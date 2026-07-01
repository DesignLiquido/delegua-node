import * as net from 'net';

import { Declaracao } from '@designliquido/delegua/declaracoes';
import { InterpretadorComDepuracaoInterface, RetornoExecucaoInterface } from '@designliquido/delegua/interfaces';
import { PilhaEscoposExecucaoInterface } from '@designliquido/delegua/interfaces/pilha-escopos-execucao-interface';
import { PontoParada } from '@designliquido/delegua/depuracao/ponto-parada';
import { cyrb53 } from '@designliquido/delegua/geracao-identificadores';

import { NucleoExecucaoInterface } from '../interfaces/nucleo-execucao-interface';
import { formatarValor, obterDeclaracaoAtual, RegistroReferencias } from './referencias-depuracao';

/**
 * Comandos reconhecidos pelo depurador padrão. Usado pelo comando `capacidades` para descrever
 * a própria superfície de protocolo, e como referência de quais `case`s existem em `executarComando`.
 *
 * Cada comando tem, ao seu lado, o nome da requisição/evento DAP equivalente (ver `dap/sessao-depuracao-dap.ts`)
 * — o depurador padrão existe para ensinar a mesma ideia num protocolo de texto simples.
 */
const COMANDOS_SUPORTADOS = [
    'adentrar-escopo', // stepIn
    'adicionar-ponto-parada', // setBreakpoints (incremental)
    'avaliar',
    'avaliar-variavel',
    'capacidades', // initialize
    'continuar', // continue
    'definir-pontos-parada', // setBreakpoints (em lote)
    'encerrar-sessao', // disconnect
    'escopos', // scopes
    'linhas-execucao', // threads
    'pilha-execucao', // stackTrace
    'pontos-parada',
    'proximo', // next
    'reiniciar', // launch
    'remover-ponto-parada', // setBreakpoints (incremental)
    'sair-escopo', // stepOut
    'tchau',
    'variaveis',
    'variaveis-referencia', // variables
];

/**
 * Esta foi a primeira implementacão do mecanismo de depuração, usando comunicação por _sockets_.
 * Inicialmente uma integração foi implementada na extensão do VSCode, mas o protocolo de
 * comunicação nunca foi exatamente maturado, em favor de uma implementação na extensão
 * usando a linguagem diretamente.
 *
 * Tem também propósito didático: por usar texto simples em vez de JSON-RPC, é a forma mais direta
 * de entender o que um depurador faz. Os comandos que não existem no protocolo histórico (a partir
 * de `capacidades`, abaixo) foram adicionados para espelhar, um a um, as requisições/eventos do
 * Debug Adapter Protocol implementado em `dap/`, documentados em `README.md`.
 */
export class ServidorDepuracao {
    instanciaNucleoExecucao: NucleoExecucaoInterface;
    servidor: net.Server;
    conexoes: { [chave: number]: any };
    contadorConexoes: number;
    interpretador: InterpretadorComDepuracaoInterface;

    private registroFrames = new RegistroReferencias<number>();
    private registroVariaveis = new RegistroReferencias<any>();
    private filaPorConexao = new Map<net.Socket, Promise<void>>();

    constructor(instanciaNucleoExecucao: NucleoExecucaoInterface) {
        this.instanciaNucleoExecucao = instanciaNucleoExecucao;
        this.instanciaNucleoExecucao.funcaoDeRetorno = this.escreverSaidaParaTodosClientes.bind(this);
        this.interpretador = this.instanciaNucleoExecucao.interpretador as InterpretadorComDepuracaoInterface;
        this.interpretador.funcaoDeRetorno = this.escreverSaidaParaTodosClientes.bind(this);

        this.servidor = net.createServer();
        this.conexoes = {};
        this.contadorConexoes = 0;
        this.operarConexao.bind(this);
    }

    validarPontoParada = (caminhoArquivo: string, linha: number, conexao: net.Socket): any => {
        const hashArquivo = cyrb53(caminhoArquivo.toLowerCase());
        if (!this.instanciaNucleoExecucao.arquivosAbertos.hasOwnProperty(hashArquivo)) {
            conexao.write(`[adicionar-ponto-parada]: Arquivo '${caminhoArquivo}' não encontrado\n`);
            return { sucesso: false };
        }

        if (this.instanciaNucleoExecucao.conteudoArquivosAbertos[hashArquivo].length < linha) {
            conexao.write(`[adicionar-ponto-parada]: Linha ${linha} não existente em arquivo '${caminhoArquivo}'\n`);
            return { sucesso: false };
        }

        return { sucesso: true, hashArquivo, linha };
    };

    comandoAdentrarEscopo = async (conexao: net.Socket): Promise<any> => {
        let linhasResposta = '';
        linhasResposta += "Recebido comando 'adentrar-escopo'\n";
        linhasResposta += '--- adentrar-escopo-resposta ---\n';

        this.interpretador.comando = 'adentrarEscopo';
        this.interpretador.pontoDeParadaAtivo = false;

        let houveParada = false;
        this.interpretador.avisoPontoParadaAtivado = () => {
            houveParada = true;
        };

        await this.interpretador.instrucaoPasso();
        conexao.write(linhasResposta);

        this.emitirEvento('continuado');
        this.emitirEventoDeParada(houveParada, 'proximo');
    };

    comandoAdicionarPontoParada = (comando: string[], conexao: net.Socket): any => {
        conexao.write("Recebido comando 'adicionar-ponto-parada'\n");
        if (comando.length < 3) {
            conexao.write(`[adicionar-ponto-parada]: Formato: adicionar-ponto-parada /caminho/do/arquivo.egua 1\n`);
            return;
        }

        const validacaoPontoParada: any = this.validarPontoParada(comando[1], parseInt(comando[2]), conexao);
        if (validacaoPontoParada.sucesso) {
            this.interpretador.pontosParada.push({
                hashArquivo: validacaoPontoParada.hashArquivo,
                linha: validacaoPontoParada.linha,
            });
        }
    };

    comandoAvaliar = async (comando: string[], conexao: net.Socket): Promise<any> => {
        let linhasResposta = '';

        comando.shift();
        const expressaoAvaliar = comando.join(' ');
        let retornoInterpretacao: RetornoExecucaoInterface;
        let resultadoInterpretacao: any[];
        try {
            retornoInterpretacao = await this.instanciaNucleoExecucao.executarLinhas([expressaoAvaliar]);
            resultadoInterpretacao = retornoInterpretacao.resultado;
        } catch (erro: any) {
            resultadoInterpretacao = [String(erro)];
        }

        linhasResposta += "Recebido comando 'avaliar'\n";
        linhasResposta += '--- avaliar-resposta ---\n';
        linhasResposta += JSON.stringify(resultadoInterpretacao[0]) + '\n';
        linhasResposta += '--- fim-avaliar-resposta ---\n';
        conexao.write(linhasResposta);
    };

    comandoAvaliarVariavel = async (comando: string[], conexao: net.Socket): Promise<any> => {
        let linhasResposta = '';

        comando.shift();
        const nomeVariavel = comando.join(' ');
        linhasResposta += "Recebido comando 'avaliar-variavel'\n";
        linhasResposta += '--- avaliar-variavel-resposta ---\n';

        try {
            linhasResposta += JSON.stringify(this.interpretador.obterVariavel(nomeVariavel)) + '\n';
        } catch (erro: any) {
            linhasResposta += String(erro) + '\n';
        }

        linhasResposta += '--- fim-avaliar-variavel-resposta ---\n';
        conexao.write(linhasResposta);
    };

    /**
     * Equivalente a `initialize` do DAP: descreve a própria superfície de protocolo em vez do
     * cliente ter que adivinhar quais comandos existem.
     */
    comandoCapacidades = (conexao: net.Socket): any => {
        let linhasResposta = "Recebido comando 'capacidades'\n";
        linhasResposta += '--- capacidades-resposta ---\n';
        linhasResposta += `versao-delegua :: ${this.instanciaNucleoExecucao.versao ?? 'desconhecida'}\n`;
        linhasResposta += `dialeto :: ${this.instanciaNucleoExecucao.dialeto ?? 'desconhecido'}\n`;
        linhasResposta += `comandos :: ${COMANDOS_SUPORTADOS.join(',')}\n`;
        linhasResposta += '--- fim-capacidades-resposta ---\n';
        conexao.write(linhasResposta);
    };

    comandoContinuar = async (conexao: net.Socket): Promise<any> => {
        let linhasResposta = '';

        linhasResposta += "Recebido comando 'continuar'\n";
        this.interpretador.pontoDeParadaAtivo = false;

        let houveParada = false;
        this.interpretador.avisoPontoParadaAtivado = () => {
            houveParada = true;
        };

        await this.interpretador.instrucaoContinuarInterpretacao();

        linhasResposta += '--- continuar-resposta ---\n';
        conexao.write(linhasResposta);

        this.emitirEvento('continuado');
        this.emitirEventoDeParada(houveParada, 'breakpoint');
    };

    /**
     * Equivalente a `setBreakpoints` do DAP: substitui, numa única chamada, todo o conjunto de
     * pontos de parada de um arquivo, respondendo `verificado`/`nao-verificado` por linha.
     * `adicionar-ponto-parada`/`remover-ponto-parada` continuam existindo para edição incremental
     * e compartilham a mesma validação via `validarPontoParada`.
     */
    comandoDefinirPontosParada = (comando: string[], conexao: net.Socket): any => {
        conexao.write("Recebido comando 'definir-pontos-parada'\n");
        if (comando.length < 2) {
            conexao.write(`[definir-pontos-parada]: Formato: definir-pontos-parada /caminho/do/arquivo.egua 1,2,3\n`);
            return;
        }

        const caminhoArquivo = comando[1];
        const hashArquivo = cyrb53(caminhoArquivo.toLowerCase());
        const linhas = (comando[2] || '')
            .split(',')
            .map((linha) => parseInt(linha.trim(), 10))
            .filter((linha) => !isNaN(linha));

        this.interpretador.pontosParada = this.interpretador.pontosParada.filter(
            (pontoParada: PontoParada) => pontoParada.hashArquivo !== hashArquivo
        );

        let linhasResposta = '--- definir-pontos-parada-resposta ---\n';
        for (const linha of linhas) {
            const validacao: any = this.validarPontoParada(caminhoArquivo, linha, conexao);
            if (validacao.sucesso) {
                this.interpretador.pontosParada.push({ hashArquivo: validacao.hashArquivo, linha: validacao.linha });
            }
            linhasResposta += `${linha} :: ${validacao.sucesso ? 'verificado' : 'nao-verificado'}\n`;
        }

        linhasResposta += '--- fim-definir-pontos-parada-resposta ---\n';
        conexao.write(linhasResposta);
    };

    /**
     * Equivalente a `disconnect` do DAP: finaliza a sessão de depuração do núcleo de execução
     * (diferente de `tchau`, que só encerra a conexão de quem pediu) e avisa todos os clientes.
     */
    comandoEncerrarSessao = (conexao: net.Socket): any => {
        conexao.write("Recebido comando 'encerrar-sessao'\n");
        try {
            this.instanciaNucleoExecucao.finalizarDepuracao?.();
        } catch (erro: any) {
            conexao.write(`[encerrar-sessao]: ${String(erro)}\n`);
        }

        this.registroFrames.limpar();
        this.registroVariaveis.limpar();
        this.emitirEvento('encerrado');
        this.finalizarServidorDepuracao();
    };

    /**
     * Equivalente a `scopes` do DAP: dado um `frameId` obtido via `pilha-execucao`, responde a
     * referência de variáveis daquele quadro, para consulta com `variaveis-referencia`.
     */
    comandoEscopos = (comando: string[], conexao: net.Socket): any => {
        conexao.write("Recebido comando 'escopos'\n");
        if (comando.length < 2) {
            conexao.write(`[escopos]: Formato: escopos <frameId>\n`);
            return;
        }

        const frameId = parseInt(comando[1], 10);
        const indiceFrame = this.registroFrames.obter(frameId);
        let linhasResposta = '--- escopos-resposta ---\n';
        if (indiceFrame === undefined) {
            linhasResposta += `[escopos]: frameId ${frameId} não encontrado. Execute 'pilha-execucao' primeiro.\n`;
            linhasResposta += '--- fim-escopos-resposta ---\n';
            conexao.write(linhasResposta);
            return;
        }

        const elementoPilha = this.interpretador.pilhaEscoposExecucao.pilha[indiceFrame];
        const variaveis = (elementoPilha as any)?.espacoMemoria?.valores || {};
        const variablesReference = this.registroVariaveis.registrar(variaveis);

        linhasResposta += `Locais :: ${variablesReference}\n`;
        linhasResposta += '--- fim-escopos-resposta ---\n';
        conexao.write(linhasResposta);
    };

    comandoPilhaExecucao = (conexao: net.Socket): any => {
        let linhasResposta = '';
        linhasResposta += "Recebido comando 'pilha-execucao'\n";
        const pilhaEscoposExecucao: PilhaEscoposExecucaoInterface = this.interpretador.pilhaEscoposExecucao;

        linhasResposta += '--- pilha-execucao-resposta ---\n';
        try {
            this.registroFrames.limpar();
            for (let i = pilhaEscoposExecucao.pilha.length - 1; i > 0; i--) {
                const elementoPilha = pilhaEscoposExecucao.pilha[i];
                const declaracaoAtual: Declaracao = obterDeclaracaoAtual(elementoPilha);
                const frameId = this.registroFrames.registrar(i);

                linhasResposta +=
                    this.instanciaNucleoExecucao.conteudoArquivosAbertos[declaracaoAtual.hashArquivo][
                        declaracaoAtual.linha - 1
                    ].trim() +
                    ' --- ' +
                    this.instanciaNucleoExecucao.arquivosAbertos[declaracaoAtual.hashArquivo] +
                    '::' +
                    declaracaoAtual.assinaturaMetodo +
                    '::' +
                    declaracaoAtual.linha +
                    '::' +
                    frameId +
                    '\n';
            }

            linhasResposta += '--- fim-pilha-execucao-resposta ---\n';
            conexao.write(linhasResposta);
        } catch (erro: any) {
            conexao.write(erro + '\n');
        }
    };

    comandoPontosParada = (conexao: net.Socket): any => {
        let linhasResposta = '';
        linhasResposta += "Recebido comando 'pontos-parada'\n";
        for (const pontoParada of this.interpretador.pontosParada) {
            linhasResposta +=
                this.instanciaNucleoExecucao.arquivosAbertos[pontoParada.hashArquivo] + ': ' + pontoParada.linha + '\n';
        }

        conexao.write(linhasResposta);
    };

    comandoProximo = async (conexao: net.Socket): Promise<any> => {
        let linhasResposta = '';
        linhasResposta += "Recebido comando 'proximo'\n";
        linhasResposta += '--- proximo-resposta ---\n';
        this.interpretador.comando = 'proximo';
        this.interpretador.pontoDeParadaAtivo = false;

        let houveParada = false;
        this.interpretador.avisoPontoParadaAtivado = () => {
            houveParada = true;
        };

        try {
            await this.interpretador.instrucaoPasso();
        } catch (erro: any) {
            console.error(erro);
        }

        conexao.write(linhasResposta);

        this.emitirEvento('continuado');
        this.emitirEventoDeParada(houveParada, 'proximo');
    };

    /**
     * Equivalente a `launch` do DAP, mas vindo do cliente em vez de configurado pela CLI: permite
     * trocar ou recarregar o programa em depuração sem reiniciar o processo Node.
     */
    comandoReiniciar = async (comando: string[], conexao: net.Socket): Promise<any> => {
        let linhasResposta = "Recebido comando 'reiniciar'\n";
        if (comando.length < 2) {
            linhasResposta += `[reiniciar]: Formato: reiniciar <arquivo>\n`;
            conexao.write(linhasResposta);
            return;
        }

        if (!this.instanciaNucleoExecucao.carregarEExecutarArquivo) {
            linhasResposta += `[reiniciar]: núcleo de execução atual não suporta recarregamento.\n`;
            conexao.write(linhasResposta);
            return;
        }

        try {
            this.registroFrames.limpar();
            this.registroVariaveis.limpar();
            await this.instanciaNucleoExecucao.carregarEExecutarArquivo(comando[1]);
            linhasResposta += '--- reiniciar-resposta ---\n';
            conexao.write(linhasResposta);
        } catch (erro: any) {
            linhasResposta += `[reiniciar]: ${String(erro)}\n`;
            conexao.write(linhasResposta);
        }
    };

    comandoRemoverPontoParada = (comando: string[], conexao: net.Socket): any => {
        let linhasResposta = '';
        linhasResposta += "Recebido comando 'remover-ponto-parada'\n";
        if (comando.length < 3) {
            linhasResposta += `[remover-ponto-parada]: Formato: remover-ponto-parada /caminho/do/arquivo.egua 1\n`;
            conexao.write(linhasResposta);
            return;
        }

        const validacaoPontoParada: any = this.validarPontoParada(comando[1], parseInt(comando[2]), conexao);
        if (validacaoPontoParada.sucesso) {
            this.interpretador.pontosParada = this.interpretador.pontosParada.filter(
                (p: PontoParada) =>
                    !(p.hashArquivo === validacaoPontoParada.hashArquivo && p.linha === validacaoPontoParada.linha)
            );
            linhasResposta += `Ponto de parada removido com sucesso\n`;
        }

        conexao.write(linhasResposta);
    };

    comandoSairEscopo = async (conexao: net.Socket): Promise<any> => {
        let linhasResposta = '';
        linhasResposta += "Recebido comando 'sair-escopo'\n";
        this.interpretador.pontoDeParadaAtivo = false;

        let houveParada = false;
        this.interpretador.avisoPontoParadaAtivado = () => {
            houveParada = true;
        };

        await this.interpretador.instrucaoProximoESair();

        linhasResposta += '--- sair-escopo-resposta ---\n';
        conexao.write(linhasResposta);

        this.emitirEvento('continuado');
        this.emitirEventoDeParada(houveParada, 'proximo');
    };

    /**
     * Equivalente a `threads` do DAP. O interpretador Delégua é de thread única, mas o comando
     * existe para completar o paralelo de protocolo e preparar terreno para suporte futuro.
     */
    comandoLinhasExecucao = (conexao: net.Socket): any => {
        let linhasResposta = "Recebido comando 'linhas-execucao'\n";
        linhasResposta += '--- linhas-execucao-resposta ---\n';
        linhasResposta += '1 :: thread-principal\n';
        linhasResposta += '--- fim-linhas-execucao-resposta ---\n';
        conexao.write(linhasResposta);
    };

    comandoVariaveis = (conexao: net.Socket): any => {
        let linhasResposta = '';
        linhasResposta += "Recebido comando 'variaveis'. Enviando variáveis do escopo atual\n";
        const todasVariaveis = this.interpretador.pilhaEscoposExecucao.obterTodasVariaveis([]);

        linhasResposta += '--- variaveis-resposta ---\n';
        for (const variavel of todasVariaveis) {
            linhasResposta += variavel.nome + ' :: ' + variavel.tipo + ' :: ' + variavel.valor + '\n';
        }

        linhasResposta += '--- fim-variaveis-resposta ---\n';
        conexao.write(linhasResposta);
    };

    /**
     * Equivalente a `variables` do DAP: dada uma referência obtida via `escopos` (ou outra
     * `variaveis-referencia` anterior), lista as variáveis daquele recipiente. Quando um valor é
     * objeto ou vetor, uma nova referência é registrada para ele, permitindo navegação recursiva
     * em vez do `JSON.stringify` cego usado por `variaveis`.
     */
    comandoVariaveisReferencia = (comando: string[], conexao: net.Socket): any => {
        conexao.write("Recebido comando 'variaveis-referencia'\n");
        if (comando.length < 2) {
            conexao.write(`[variaveis-referencia]: Formato: variaveis-referencia <variablesReference>\n`);
            return;
        }

        const referencia = parseInt(comando[1], 10);
        const recipiente = this.registroVariaveis.obter(referencia);
        let linhasResposta = '--- variaveis-referencia-resposta ---\n';
        if (!recipiente) {
            linhasResposta += `[variaveis-referencia]: referência ${referencia} não encontrada. Execute 'escopos' primeiro.\n`;
            linhasResposta += '--- fim-variaveis-referencia-resposta ---\n';
            conexao.write(linhasResposta);
            return;
        }

        for (const [nome, entrada] of Object.entries(recipiente)) {
            const ehVariavel = entrada !== null && typeof entrada === 'object' && 'valor' in (entrada as any);
            const tipo = ehVariavel ? (entrada as any).tipo : typeof entrada;
            const valor = ehVariavel ? (entrada as any).valor : entrada;

            let referenciaFilha = 0;
            if (valor !== null && typeof valor === 'object') {
                referenciaFilha = this.registroVariaveis.registrar(valor);
            }

            linhasResposta += `${nome} :: ${tipo} :: ${formatarValor(valor)} :: ${referenciaFilha}\n`;
        }

        linhasResposta += '--- fim-variaveis-referencia-resposta ---\n';
        conexao.write(linhasResposta);
    };

    /**
     * Emite um evento assíncrono (estilo `stopped`/`continued`/`terminated` do DAP) para todos os
     * clientes conectados, sem que precisem pollar comandos como `pilha-execucao` após cada passo.
     */
    private emitirEvento(nomeEvento: string, linhasCorpo: string[] = []): void {
        let mensagem = `--- evento: ${nomeEvento} ---\n`;
        for (const linha of linhasCorpo) {
            mensagem += linha + '\n';
        }
        mensagem += '--- fim-evento ---\n';

        Object.keys(this.conexoes).forEach((chave) => {
            this.conexoes[chave].write(mensagem);
        });
    }

    /** Localiza arquivo/linha da declaração em execução no topo da pilha de escopos. */
    private obterLocalizacaoAtual(): { caminhoArquivo: string; linha: number } | null {
        const pilhaEscopos = this.interpretador?.pilhaEscoposExecucao?.pilha;
        if (!Array.isArray(pilhaEscopos)) {
            return null;
        }

        for (let indice = pilhaEscopos.length - 1; indice >= 0; indice--) {
            const declaracaoAtual = obterDeclaracaoAtual(pilhaEscopos[indice]);
            if (!declaracaoAtual) {
                continue;
            }

            const caminhoArquivo = this.instanciaNucleoExecucao.arquivosAbertos[declaracaoAtual.hashArquivo];
            if (!caminhoArquivo) {
                continue;
            }

            return { caminhoArquivo, linha: declaracaoAtual.linha };
        }

        return null;
    }

    /** Emite `parado` (com a localização atual) ou `encerrado`, conforme o resultado de um passo/continue. */
    private emitirEventoDeParada(houveParada: boolean, motivoPadrao: 'breakpoint' | 'proximo'): void {
        if (!houveParada && !this.interpretador.pontoDeParadaAtivo) {
            this.emitirEvento('encerrado');
            return;
        }

        const localizacao = this.obterLocalizacaoAtual();
        if (localizacao) {
            this.emitirEvento('parado', [
                `motivo:${motivoPadrao}`,
                `arquivo:${localizacao.caminhoArquivo}::linha:${localizacao.linha}`,
            ]);
        }
    }

    /** Despacha um comando de texto já tokenizado para o `comando*` correspondente. */
    private executarComando(partesComando: string[], conexao: net.Socket): any {
        switch (partesComando[0]) {
            case 'adentrar-escopo':
                return this.comandoAdentrarEscopo(conexao);
            case 'adicionar-ponto-parada':
                return this.comandoAdicionarPontoParada(partesComando, conexao);
            case 'avaliar':
                return this.comandoAvaliar(partesComando, conexao);
            case 'avaliar-variavel':
                return this.comandoAvaliarVariavel(partesComando, conexao);
            case 'capacidades':
                return this.comandoCapacidades(conexao);
            case 'continuar':
                return this.comandoContinuar(conexao);
            case 'definir-pontos-parada':
                return this.comandoDefinirPontosParada(partesComando, conexao);
            case 'encerrar-sessao':
                return this.comandoEncerrarSessao(conexao);
            case 'escopos':
                return this.comandoEscopos(partesComando, conexao);
            case 'linhas-execucao':
                return this.comandoLinhasExecucao(conexao);
            case 'pilha-execucao':
                return this.comandoPilhaExecucao(conexao);
            case 'pontos-parada':
                return this.comandoPontosParada(conexao);
            case 'proximo':
                return this.comandoProximo(conexao);
            case 'reiniciar':
                return this.comandoReiniciar(partesComando, conexao);
            case 'remover-ponto-parada':
                return this.comandoRemoverPontoParada(partesComando, conexao);
            case 'sair-escopo':
                return this.comandoSairEscopo(conexao);
            case 'variaveis':
                return this.comandoVariaveis(conexao);
            case 'variaveis-referencia':
                return this.comandoVariaveisReferencia(partesComando, conexao);
        }
    }

    /**
     * Despacha um comando, serializando-o após qualquer comando assíncrono ainda pendente na mesma
     * conexão. Quando a fila está ociosa, o comando é executado de forma síncrona/imediata, igual ao
     * comportamento histórico; só quando há um comando assíncrono em andamento é que a execução do
     * próximo comando é adiada até ele terminar — evitando que dois comandos leiam/alterem o estado
     * do interpretador ao mesmo tempo quando um cliente envia vários comandos em sequência rápida.
     */
    private despacharComando(partesComando: string[], conexao: net.Socket): void {
        const filaAtual = this.filaPorConexao.get(conexao);

        if (!filaAtual) {
            const resultado = this.executarComando(partesComando, conexao);
            if (resultado && typeof resultado.then === 'function') {
                this.registrarNaFila(conexao, resultado as Promise<void>);
            }
            return;
        }

        const promessaEncadeada = filaAtual.then(() => {
            const resultado = this.executarComando(partesComando, conexao);
            return resultado instanceof Promise ? resultado : undefined;
        });
        this.registrarNaFila(conexao, promessaEncadeada);
    }

    private registrarNaFila(conexao: net.Socket, promessa: Promise<void>): void {
        const promessaTratada: Promise<void> = promessa
            .catch((erro: any) => {
                conexao.write(`--- erro --- ${String(erro?.message ?? erro)} --- fim-erro ---\n`);
            })
            .finally(() => {
                if (this.filaPorConexao.get(conexao) === promessaTratada) {
                    this.filaPorConexao.delete(conexao);
                }
            });
        this.filaPorConexao.set(conexao, promessaTratada);
    }

    /**
     * Função que descreve como conexão com clientes de depuração deve ser operada.
     * @param conexao Instância de conexão, tipo net.Socket.
     */
    operarConexao = (conexao: net.Socket) => {
        const enderecoRemoto = conexao.remoteAddress + ':' + conexao.remotePort;
        process.stdout.write('\n[Depurador] Nova conexão de cliente de ' + enderecoRemoto + '\ndelegua> ');

        conexao.setEncoding('utf8');
        this.conexoes[this.contadorConexoes++] = conexao;

        // Aqui, dados pode ter uma série de comandos, sendo um por linha.
        const aoReceberDados: any = (dados: Buffer) => {
            const comandos: string[] = String(dados).split('\n');
            process.stdout.write(
                '\n[Depurador] Dados da conexão vindos de ' + enderecoRemoto + ': ' + comandos + '\ndelegua> '
            );
            for (const comando of comandos) {
                const partesComando: string[] = comando.split(' ');
                if (partesComando[0] === 'tchau') {
                    conexao.write("Recebido comando 'tchau'. Conexão será encerrada\n");
                    this.finalizarServidorDepuracao();
                    return;
                }

                this.despacharComando(partesComando, conexao);
            }
        };

        const aoFecharConexao = () => {
            this.filaPorConexao.delete(conexao);
            process.stdout.write('\n[Depurador] Conexão de ' + enderecoRemoto + ' fechada\ndelegua> ');
        };

        const aoObterErro = (erro: Error) => {
            process.stdout.write(
                '\n[Depurador] Conexão ' + enderecoRemoto + ' com erro: ' + erro.message + '\ndelegua> '
            );
        };

        // `.bind()` é necessário aqui para que os eventos não usem net.Socket ou net.Server como o `this`,
        // como acontece normalmente se o `.bind()` não é chamado.
        conexao.on('data', aoReceberDados.bind(this));
        conexao.once('close', aoFecharConexao.bind(this));
        conexao.on('error', aoObterErro.bind(this));
    };

    iniciarServidorDepuracao(): net.AddressInfo {
        // É necessário mudar o `this` aqui por `.bind()`, senão `this` será net.Server dentro dos métodos.
        this.servidor.on('connection', this.operarConexao.bind(this));

        this.servidor.listen(7777);
        process.stdout.write('\n[Depurador] Servidor de depuração iniciado na porta 7777');

        return this.servidor.address() as net.AddressInfo;
    }

    escreverSaidaParaTodosClientes(mensagem: string) {
        Object.keys(this.conexoes).forEach((chave) => {
            this.conexoes[chave].write('Enviando mensagem de saída\n--- mensagem-saida ---\n' + mensagem + '\n');
        });
    }

    finalizarServidorDepuracao(): void {
        Object.keys(this.conexoes).forEach((chave) => {
            this.conexoes[chave].write('--- finalizando ---\n');
            this.conexoes[chave].end();
        });

        this.filaPorConexao.clear();
        this.servidor.close();
    }
}
