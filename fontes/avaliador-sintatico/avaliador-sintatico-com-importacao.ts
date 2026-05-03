import {
    AcessoIndiceVariavel,
    AcessoMetodo,
    AcessoMetodoOuPropriedade,
    AcessoPropriedade,
    Ajuda,
    ArgumentoReferenciaFuncao,
    AvaliadorSintatico,
    Bloco,
    Chamada,
    Classe,
    Comentario,
    Const,
    ConstrutoInterface,
    Deceto,
    Declaracao,
    Dupla,
    ErroAvaliadorSintatico,
    FuncaoConstruto,
    FuncaoDeclaracao,
    Leia,
    Literal,
    Noneto,
    Octeto,
    Quarteto,
    Quinteto,
    ReferenciaFuncao,
    RetornoAvaliadorSintaticoInterface,
    RetornoLexadorInterface,
    Septeto,
    Sexteto,
    SimboloInterface,
    TendoComo,
    Trio,
    Var,
    Variavel
} from "@designliquido/delegua";

import { InformacaoElementoSintatico } from "@designliquido/delegua/informacao-elemento-sintatico";
import { FuncaoPadrao } from "@designliquido/delegua/interpretador/estruturas";

import tiposDeSimbolos from "@designliquido/delegua/tipos-de-simbolos/delegua";
import tipoDeDadosDelegua from "@designliquido/delegua/tipos-de-dados/delegua";

import { ImportadorInterface } from "../interfaces";
import { ImportarBiblioteca, ModuloDeclaracoes } from "../construtos";
import { carregarBibliotecaDelegua, verificarModulosDelegua } from "../mecanismo-importacao-bibliotecas";
import { ClasseDeModulo } from "../interpretador/estruturas";
import { MicroAvaliadorAjuda } from "./micro-avaliador-ajuda";

export class AvaliadorSintaticoComImportacao extends AvaliadorSintatico {
    tiposDefinidosPorBibliotecas: {
        [nomeTipo: string]: ClasseDeModulo;
    };
    importador: ImportadorInterface<SimboloInterface>;
    arquivosImportados: string[];
    modoLair: boolean;

    constructor(importador: ImportadorInterface<SimboloInterface>) {
        super();
        this.tiposDefinidosPorBibliotecas = {};
        this.arquivosImportados = [];
        this.importador = importador;
    }

    override async finalizarChamada(entidadeChamada: ConstrutoInterface, tipoPrimitiva?: string | undefined): Promise<Chamada> {
        const chamadaResolvida = await super.finalizarChamada(entidadeChamada, tipoPrimitiva);
        if (chamadaResolvida.entidadeChamada instanceof AcessoMetodo && chamadaResolvida.entidadeChamada.objeto.tipo === 'módulo') {
            // Espera-se que o módulo esteja devidamente registrado.
            const entidadeChamadaResolvida = chamadaResolvida.entidadeChamada as AcessoMetodo;
            const objetoEntidadeChamada = (entidadeChamadaResolvida.objeto as any);
            if (objetoEntidadeChamada && objetoEntidadeChamada.simbolo.lexema in this.primitivasConhecidas) {
                const moduloCorrespondente = this.primitivasConhecidas[objetoEntidadeChamada.simbolo.lexema];
                if (entidadeChamadaResolvida.nomeMetodo in moduloCorrespondente) {
                    const tipoResolvido = moduloCorrespondente[entidadeChamadaResolvida.nomeMetodo].tipo;
                    entidadeChamadaResolvida.tipoRetornoMetodo = tipoResolvido;
                    chamadaResolvida.tipo = tipoResolvido;
                }
            }
        }

        return chamadaResolvida;
    }

    protected importarFuncaoPadraoComoComponente(dadosComponente: any, nomeComponente: string) {
        const dadosComponenteResolvido = dadosComponente as FuncaoPadrao;
        const componente = new InformacaoElementoSintatico(
            nomeComponente,
            dadosComponenteResolvido.tipoRetorno,
            true,
            []
        );

        for (const argumento of dadosComponenteResolvido.argumentos) {
            const elemento = new InformacaoElementoSintatico(argumento.nome, argumento.tipo);
            componente.subElementos.push(elemento as any);
        }

        return componente;
    }

    protected criarComponenteDeClasse(nomeModulo: string, nome: string, classe: any): InformacaoElementoSintatico {
        const componente = new InformacaoElementoSintatico(nome, nome, false, []);

        // Processar métodos
        if (classe.metodos) {
            for (const [nomeMetodo, dadosMetodo] of Object.entries(classe.metodos)) {
                if (dadosMetodo instanceof FuncaoPadrao) {
                    const metodo = dadosMetodo as FuncaoPadrao;
                    const elemMetodo = new InformacaoElementoSintatico(
                        nomeMetodo,
                        metodo.tipoRetorno,
                        true,
                        []
                    );

                    for (const arg of metodo.argumentos) {
                        const argElem = new InformacaoElementoSintatico(
                            arg.nome,
                            arg.tipo
                        );
                        elemMetodo.subElementos.push(argElem as any);
                    }

                    componente.subElementos.push(elemMetodo as any);
                } else if (dadosMetodo instanceof ClasseDeModulo) {
                    // Método que retorna/é uma classe de módulo: recursão
                    const componenteDeClasseDerivado = this.criarComponenteDeClasse(nomeModulo, nomeMetodo, dadosMetodo);
                    this.primitivasConhecidas[nomeModulo][nomeMetodo] = componenteDeClasseDerivado;
                    componente.subElementos.push(componenteDeClasseDerivado as any);
                } else {
                    // Caso genérico: tentar inferir tipo
                    const tipoMetodo = (dadosMetodo && (dadosMetodo as any).tipoRetorno) || 'qualquer';
                    componente.subElementos.push(
                        new InformacaoElementoSintatico(nomeMetodo, tipoMetodo, true, []) as any
                    );
                }
            }
        }

        // Processar propriedades
        if (classe.propriedades) {
            for (const [nomeProp, dadosProp] of Object.entries(classe.propriedades)) {
                if (dadosProp instanceof ClasseDeModulo) {
                    const nested = this.criarComponenteDeClasse(nomeModulo, nomeProp, dadosProp);
                    // Registrar a classe interna também nas primitivas do módulo
                    this.primitivasConhecidas[nomeModulo][nomeProp] = nested;
                    componente.subElementos.push(nested as any);
                } else {
                    // Se for um descriptor simples ou tipo primitivo
                    const tipoProp = (dadosProp && (dadosProp as any).tipo) || (typeof dadosProp === 'string' ? dadosProp : 'qualquer');
                    componente.subElementos.push(
                        new InformacaoElementoSintatico(nomeProp, tipoProp, false, []) as any
                    );
                }
            }
        }

        return componente;
    };

    protected importarBibliotecaNode(literalCaminho: Literal): ImportarBiblioteca {
        const caminhoTexto = String(literalCaminho.valor);
        const bibliotecaResolvida = verificarModulosDelegua(caminhoTexto);
        if (bibliotecaResolvida) {
            const moduloResolvido = carregarBibliotecaDelegua(bibliotecaResolvida as string);

            this.primitivasConhecidas[caminhoTexto] = {};
            for (const [nomeComponente, dadosComponente] of Object.entries(moduloResolvido.componentes)) {
                // TODO: Verificar se sempre é o caso de ser função padrão.
                let componente;
                if (dadosComponente instanceof FuncaoPadrao) {
                    componente = this.importarFuncaoPadraoComoComponente(dadosComponente, nomeComponente);
                } else if (dadosComponente instanceof ClasseDeModulo) {
                    const classeModulo = dadosComponente as ClasseDeModulo;

                    componente = this.criarComponenteDeClasse(caminhoTexto, nomeComponente, classeModulo);
                    // Registrar também a própria classe (a atribuição ao mapa acontece mais adiante,
                    // mas garantir que exista agora caso recursão precise dela)
                    this.primitivasConhecidas[caminhoTexto] = this.primitivasConhecidas[caminhoTexto] || {};
                    this.primitivasConhecidas[caminhoTexto][nomeComponente] = componente;
                    this.tiposDefinidosPorBibliotecas[nomeComponente] = classeModulo;

                } else {
                    // Objeto bruto registrado via chave `objeto` no manifesto da biblioteca
                    // (ex.: `Base` em `delegua-entidades`). Não é FuncaoPadrao nem ClasseDeModulo,
                    // então registramos como tipo genérico `qualquer` para não bloquear a análise.
                    componente = new InformacaoElementoSintatico(nomeComponente, 'qualquer');
                }

                this.primitivasConhecidas[caminhoTexto][nomeComponente] = componente;
            }
        }

        return new ImportarBiblioteca(
            literalCaminho.hashArquivo,
            literalCaminho.linha,
            caminhoTexto
        );
    }

    protected async logicaComumImportacaoModulo(literalCaminho: Literal, simboloReferencia: SimboloInterface): Promise<ModuloDeclaracoes> {
        const caminhoTexto = String(literalCaminho.valor);
        const resultadoImportacao = this.importador.importar(
            caminhoTexto,
            literalCaminho.hashArquivo
        );

        // Havendo erros no lexador, levantamos um erro de avaliação sintática na
        // importação.
        if (resultadoImportacao.retornoLexador.erros.length > 0) {
            throw this.erro(
                simboloReferencia,
                `Erros encontrados ao importar o arquivo ${caminhoTexto
                }: ${resultadoImportacao.retornoLexador.erros.reduce(
                    (acumulado, proximo) =>
                        (acumulado += proximo.mensagem + "; "),
                    ""
                )}`
            );
        }

        const avaliadorSintaticoModulo = new AvaliadorSintaticoComImportacao(
            this.importador
        );
        const resultadoAvaliacaoSintaticaModulo =
            await avaliadorSintaticoModulo.analisar(
                resultadoImportacao.retornoLexador,
                resultadoImportacao.hashArquivo,
                this.arquivosImportados
            );

        this.arquivosImportados.push(caminhoTexto);

        const definicoesClasse =
            resultadoAvaliacaoSintaticaModulo.declaracoes.filter(
                (d) => d.constructor === Classe
            ) as Classe[];

        for (const definicaoClasse of definicoesClasse) {
            this.tiposDefinidosEmCodigo[definicaoClasse.simbolo.lexema] =
                definicaoClasse;
        }

        // Referências de funções registradas no avaliador sintático do módulo importado
        // precisam ser registradas também no avaliador sintático atual.
        for (const elementoPilha of avaliadorSintaticoModulo.pilhaEscopos.pilha) {
            for (const referenciaFuncao of Object.entries(elementoPilha.referenciasFuncoes)) {
                this.pilhaEscopos.registrarReferenciaFuncao(
                    referenciaFuncao[0],
                    referenciaFuncao[1]
                );

                const variavelCorrespondente = elementoPilha.elementosSintaticos[referenciaFuncao[0]];
                if (!variavelCorrespondente) {
                    throw this.erro(
                        simboloReferencia,
                        `Erro interno na importação do módulo '${literalCaminho.valor}': a função '${referenciaFuncao[0]}' não foi encontrada entre as variáveis do escopo.`
                    );
                }

                this.pilhaEscopos.definirInformacoesVariavel(
                    referenciaFuncao[0],
                    new InformacaoElementoSintatico(
                        referenciaFuncao[0],
                        variavelCorrespondente.tipo,
                        true,
                        []
                    )
                );
            }
        }

        return new ModuloDeclaracoes(
            simboloReferencia.linha,
            simboloReferencia.hashArquivo,
            resultadoAvaliacaoSintaticaModulo.declaracoes
        );
    }

    /**
     * Quando válida, devolve a resolução do módulo como construto. 
     * Normalmente usada na importação dinâmica, ou seja, `var algumaCoisa = importar('caminho')`.
     */
    protected override async construtoImportar(): Promise<any> {
        const simboloAbertura = this.consumir(
            tiposDeSimbolos.PARENTESE_ESQUERDO,
            "Esperado '(' após declaração."
        );
        const caminho = await this.expressao();
        this.consumir(
            tiposDeSimbolos.PARENTESE_DIREITO,
            "Esperado ')' após declaração."
        );

        // Chegando aqui sem erros, a importação é sintaticamente válida.
        const literalCaminho = caminho as Literal;
        if (!String(literalCaminho.valor).endsWith('.delegua')) {
            return this.importarBibliotecaNode(literalCaminho);
        }

        return await this.logicaComumImportacaoModulo(literalCaminho, simboloAbertura);
    }

    protected localizarDeclaracaoPorNomeEmModulo(
        moduloDeclaracoes: ModuloDeclaracoes,
        nome: string,
        simboloReferencia:
            SimboloInterface
    ): [string, Declaracao] {
        for (const declaracao of moduloDeclaracoes.declaracoes) {
            switch (declaracao.constructor) {
                case Classe:
                    const declaracaoClasse = declaracao as Classe;
                    if (declaracaoClasse.simbolo.lexema === nome) {
                        return [declaracaoClasse.simbolo.lexema, declaracaoClasse];
                    }
                    break;
                case Comentario:
                    continue;
                case Const:
                    const declaracaoConst = declaracao as Const;
                    if (declaracaoConst.simbolo.lexema === nome) {
                        return [declaracaoConst.tipo, declaracaoConst];
                    }
                    break;
                case FuncaoDeclaracao:
                    const declaracaoFuncao = declaracao as FuncaoDeclaracao;
                    if (declaracaoFuncao.simbolo.lexema === nome) {
                        return [declaracaoFuncao.tipo, declaracaoFuncao];
                    }
                    break;
                case Var:
                    const declaracaoVar = declaracao as Var;
                    if (declaracaoVar.simbolo.lexema === nome) {
                        return [declaracaoVar.tipo, declaracaoVar];
                    }
                    break;
                default:
                    console.warn(`Declaração de tipo desconhecido na importação estruturada: ${declaracao.constructor.name}.`);
                    break;
            }
        }

        throw this.erro(
            simboloReferencia,
            `O elemento '${nome}' não foi encontrado no módulo importado.`
        );
    }

    /**
     * Quando válida, devolve a resolução do módulo como declaração de constante. 
     * Normalmente usada na importação estruturada, ou seja, `importar tudo de 'caminho'`, 
     * ou então `importar { algo, outro } de 'caminho'`.
     * @returns 
     */
    override async declaracaoImportar(): Promise<any> {
        const declaracaoResolvida = await super.declaracaoImportar();

        const literalCaminho = declaracaoResolvida.caminho as Literal;
        if (declaracaoResolvida.simboloTudo !== null && declaracaoResolvida.simboloTudo !== undefined) {
            this.pilhaEscopos.definirInformacoesVariavel(
                declaracaoResolvida.simboloTudo.lexema,
                new InformacaoElementoSintatico(declaracaoResolvida.simboloTudo.lexema, 'módulo')
            );

            if (!String(literalCaminho.valor).endsWith('.delegua')) {
                return new Const(
                    declaracaoResolvida.simboloTudo,
                    this.importarBibliotecaNode(literalCaminho),
                    'módulo',
                    true,
                    declaracaoResolvida.decoradores
                );
            }

            const moduloDeclaracoes = await this.logicaComumImportacaoModulo(literalCaminho, declaracaoResolvida.simboloTudo);

            return new Const(
                declaracaoResolvida.simboloTudo,
                moduloDeclaracoes,
                'módulo',
                true,
                declaracaoResolvida.decoradores
            );
        }

        if (declaracaoResolvida.elementosImportacao.length === 0) {
            throw this.erro(
                { hashArquivo: literalCaminho.hashArquivo, linha: literalCaminho.linha } as SimboloInterface,
                "Erro interno na importação estruturada: nenhum elemento para importar."
            );
        }

        // No caso da desestruturação de valores de módulo, criamos um nome provisório para o módulo
        // e uma declaração de constante para cada nome mencionado na desestruturação.
        const moduloDeclaracoes = await this.logicaComumImportacaoModulo(literalCaminho, declaracaoResolvida.elementosImportacao[0]);
        const constantesImportadas: Const[] = [];
        const nomeReservadoModulo = `${literalCaminho.hashArquivo}_${literalCaminho.linha}_modulo`;
        const simboloReservadoModulo = { lexema: nomeReservadoModulo, hashArquivo: literalCaminho.hashArquivo, linha: literalCaminho.linha } as SimboloInterface;
        constantesImportadas.push(
            new Const(
                simboloReservadoModulo,
                moduloDeclaracoes,
                'módulo',
                true,
                declaracaoResolvida.decoradores
            )
        );

        for (const simboloImportacao of declaracaoResolvida.elementosImportacao) {
            const declaracaoCorrespondente = this.localizarDeclaracaoPorNomeEmModulo(
                moduloDeclaracoes,
                simboloImportacao.lexema,
                simboloImportacao
            );

            this.pilhaEscopos.definirInformacoesVariavel(
                simboloImportacao.lexema,
                new InformacaoElementoSintatico(simboloImportacao.lexema, declaracaoCorrespondente[0])
            );

            constantesImportadas.push(
                new Const(
                    simboloImportacao,
                    new AcessoMetodo(
                        simboloImportacao.hashArquivo,
                        new Variavel(
                            simboloImportacao.hashArquivo,
                            simboloReservadoModulo,
                            'módulo'
                        ),
                        simboloImportacao.lexema
                    ),
                    declaracaoCorrespondente[0],
                    true,
                    []
                )
            );
        }

        return constantesImportadas;
    }

    protected async declaracaoTendoComo(): Promise<TendoComo> {
        const simboloTendo = this.simbolos[this.atual - 1];
        const expressaoInicializacao = await this.expressao();
        this.consumir(
            tiposDeSimbolos.COMO,
            "Esperado palavra reservada 'como' após expressão de inicialização de variável, em declaração 'tendo'."
        );
        const simboloNomeVariavel = this.consumir(
            tiposDeSimbolos.IDENTIFICADOR,
            "Esperado nome do identificador em declaração 'tendo'."
        );
        this.consumir(
            tiposDeSimbolos.CHAVE_ESQUERDA,
            "Esperado chave esquerda para abertura de bloco em declaração 'tendo'."
        );

        let tipoInicializacao: string = 'qualquer';
        switch (expressaoInicializacao.constructor) {
            case Chamada:
                const construtoChamada = expressaoInicializacao as Chamada;
                switch (construtoChamada.entidadeChamada.constructor) {
                    case AcessoMetodo:
                        const entidadeChamadaAcessoMetodo =
                            construtoChamada.entidadeChamada as AcessoMetodo;
                        tipoInicializacao = entidadeChamadaAcessoMetodo.tipoRetornoMetodo.replace(
                            '<T>',
                            entidadeChamadaAcessoMetodo.objeto.tipo
                        );
                        break;
                    case Variavel:
                        const entidadeChamadaVariavel =
                            construtoChamada.entidadeChamada as Variavel;
                        tipoInicializacao = entidadeChamadaVariavel.tipo;
                        break;
                    // TODO: Demais casos
                    default:
                        break;
                }
                break;
            // TODO: Demais casos
            default:
                break;
        }

        this.pilhaEscopos.definirInformacoesVariavel(
            simboloNomeVariavel.lexema,
            new InformacaoElementoSintatico(simboloNomeVariavel.lexema, tipoInicializacao)
        );

        const blocoCorpo = await this.blocoEscopo();
        return new TendoComo(
            simboloTendo.linha,
            simboloTendo.hashArquivo,
            simboloNomeVariavel,
            expressaoInicializacao,
            new Bloco(simboloTendo.linha, simboloTendo.hashArquivo, blocoCorpo)
        );
    }

    /**
     * No modo LAIR, a pilha de escopos não deve ser reinicializada a cada execução.
     * @returns Nada.
     */
    protected override inicializarPilhaEscopos(): void {
        if (this.modoLair && !this.pilhaEscopos.eVazio()) {
            return;
        }

        super.inicializarPilhaEscopos();
    }

    /**
     * Override para permitir que palavras-chave sejam usadas como argumentos
     * em ajuda(). Por exemplo: ajuda(para), ajuda(se), ajuda(enquanto).
     */
    override async declaracaoAjuda(): Promise<Ajuda> {
        // Primeiro, consome o token AJUDA
        const simboloAjuda = this.avancarEDevolverAnterior();

        // Se não há '(' ou estamos no final, é apenas uma declaração simples
        if (this.estaNoFinal() ||
            this.simbolos[this.atual].tipo !== tiposDeSimbolos.PARENTESE_ESQUERDO) {
            return new Ajuda(
                simboloAjuda.hashArquivo,
                simboloAjuda.linha,
                undefined,
                false
            );
        }

        // Consome '('
        this.avancarEDevolverAnterior();

        // Se há ')' imediatamente, é ajuda() sem argumentos
        if (this.simbolos[this.atual].tipo === tiposDeSimbolos.PARENTESE_DIREITO) {
            this.avancarEDevolverAnterior(); // Consome ')'
            return new Ajuda(
                simboloAjuda.hashArquivo,
                simboloAjuda.linha,
                undefined,
                true
            );
        }

        // Pega o símbolo atual (pode ser palavra-chave ou identificador)
        const simboloTopico = this.simbolos[this.atual];

        // Verifica se é um tópico válido (palavra-chave ou identificador)
        if (simboloTopico && MicroAvaliadorAjuda.ehTopicoValido(simboloTopico)) {
            // Converte o símbolo para um construto de tópico
            const construtoTopico = MicroAvaliadorAjuda.converterSimboloParaTopico(simboloTopico);

            // Avança para consumir o símbolo
            this.avancarEDevolverAnterior();

            // Consome ')'
            this.consumir(
                tiposDeSimbolos.PARENTESE_DIREITO,
                "Esperado ')' após argumento de ajuda."
            );

            return new Ajuda(
                simboloAjuda.hashArquivo,
                simboloAjuda.linha,
                construtoTopico,
                true
            );
        }

        // Se não é um tópico simples, delega para o parser padrão
        // (pode ser uma expressão complexa)
        const expressaoAjuda = await this.expressao();
        this.consumir(
            tiposDeSimbolos.PARENTESE_DIREITO,
            `Esperado parêntese direito após expressão usada como argumento em ajuda(). Atual: ${this.simbolos[this.atual].lexema}.`
        );

        return new Ajuda(
            simboloAjuda.hashArquivo,
            simboloAjuda.linha,
            expressaoAjuda,
            true
        );
    }

    override async analisar(
        retornoLexador: RetornoLexadorInterface<SimboloInterface>,
        hashArquivo: number,
        arquivosImportados?: string[]
    ): Promise<RetornoAvaliadorSintaticoInterface<Declaracao>> {
        this.arquivosImportados = arquivosImportados || [];
        return super.analisar(retornoLexador, hashArquivo);
    }
}
