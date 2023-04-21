import * as sistemaArquivos from 'node:fs';
import * as caminho from 'node:path';
import * as readline from 'node:readline';
import chalk from 'chalk';

import { Lexador } from '@designliquido/delegua/fontes/lexador/lexador';
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico/avaliador-sintatico';
import { Interpretador } from './interpretador/interpretador';

import tiposDeSimbolos from '@designliquido/delegua/fontes/tipos-de-simbolos/delegua';

import {
    AvaliadorSintaticoInterface,
    InterpretadorComDepuracaoInterface,
    InterpretadorInterface,
    LexadorInterface,
    RetornoExecucaoInterface,
    SimboloInterface,
} from '@designliquido/delegua/fontes/interfaces';

import { InterpretadorEguaClassico } from '@designliquido/delegua/fontes/interpretador/dialetos/egua-classico/interpretador-egua-classico';
import { LexadorEguaClassico } from '@designliquido/delegua/fontes/lexador/dialetos/lexador-egua-classico';
import { LexadorEguaP } from '@designliquido/delegua/fontes/lexador/dialetos/lexador-eguap';
import { AvaliadorSintaticoEguaP } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos/avaliador-sintatico-eguap';
import { AvaliadorSintaticoEguaClassico } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos';
import { TradutorVisualg } from '@designliquido/delegua/fontes/tradutores/tradutor-visualg';

import { Importador, RetornoImportador } from './importador';
import { LexadorMapler } from '@designliquido/delegua/fontes/lexador/dialetos/lexador-mapler';
import { AvaliadorSintaticoMapler } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos/avaliador-sintatico-mapler';
import { LexadorVisuAlg } from '@designliquido/delegua/fontes/lexador/dialetos/lexador-visualg';
import { AvaliadorSintaticoVisuAlg } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos/avaliador-sintatico-visualg';
import { LexadorBirl } from '@designliquido/delegua/fontes/lexador/dialetos/lexador-birl';
import { AvaliadorSintaticoBirl } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos/avaliador-sintatico-birl';
import { TradutorJavaScript, TradutorReversoJavaScript } from '@designliquido/delegua/fontes/tradutores';
import { InterpretadorMapler } from '@designliquido/delegua/fontes/interpretador/dialetos/mapler/interpretador-mapler';
import { InterpretadorVisuAlg } from '@designliquido/delegua/fontes/interpretador/dialetos/visualg/interpretador-visualg';
import { ErroInterpretador } from '@designliquido/delegua/fontes/interpretador';
import { InterpretadorPortugolStudio } from '@designliquido/delegua/fontes/interpretador/dialetos';
import { InterpretadorPortugolStudioComDepuracao } from '@designliquido/delegua/fontes/interpretador/dialetos/portugol-studio/interpretador-portugol-studio-com-depuracao';
import { LexadorPortugolStudio } from '@designliquido/delegua/fontes/lexador/dialetos/lexador-portugol-studio';
import { AvaliadorSintaticoPortugolStudio } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos/avaliador-sintatico-portugol-studio';
import { ServidorDepuracao } from './depuracao';
import { DeleguaInterface, ImportadorInterface } from './interfaces';
import { InterpretadorComDepuracaoImportacao } from './interpretador/interpretador-com-depuracao-importacao';
import { InterpretadorVisuAlgComDepuracaoImportacao } from './interpretador/dialetos/interpretador-visualg-com-depuracao-importacao';
import { InterpretadorMaplerComDepuracaoImportacao } from './interpretador/dialetos/interpretador-mapler-com-depuracao-importacao';

/**
 * O núcleo da linguagem.
 *
 * Responsável por avaliar a entrada fornecida, entender o código e executá-lo.
 */
export class Delegua implements DeleguaInterface {
    dialeto: string;
    dialetos: { [identificador: string]: string } = {
        birl: 'BIRL',
        delegua: 'padrão',
        egua: 'Égua',
        eguap: 'ÉguaP',
        mapler: 'mapler',
        'portugol-studio': 'Portugol Studio',
        visualg: 'VisuAlg',
    };

    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    interpretador: InterpretadorInterface;
    lexador: LexadorInterface;
    avaliadorSintatico: AvaliadorSintaticoInterface;
    importador: ImportadorInterface;
    tradutorJavaScript: TradutorJavaScript;
    tradutorReversoJavascript: TradutorReversoJavaScript;
    tradutorVisualg: TradutorVisualg;

    funcaoDeRetorno: Function;
    funcaoDeRetornoMesmaLinha: Function;
    modoDepuracao: boolean;

    servidorDepuracao: ServidorDepuracao;

    constructor(
        dialeto = 'delegua',
        performance = false,
        depurador = false,
        traduzir: any = null,
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        this.arquivosAbertos = {};
        this.conteudoArquivosAbertos = {};

        this.dialeto = dialeto;
        this.funcaoDeRetorno = funcaoDeRetorno || console.log;
        // `process.stdout.write.bind(process.stdout)` é necessário por causa de 
        // https://stackoverflow.com/questions/28874665/node-js-cannot-read-property-defaultencoding-of-undefined
        this.funcaoDeRetornoMesmaLinha = funcaoDeRetornoMesmaLinha || process.stdout.write.bind(process.stdout);
        this.modoDepuracao = depurador;

        switch (this.dialeto) {
            case 'birl':
                this.lexador = new LexadorBirl();
                this.avaliadorSintatico = new AvaliadorSintaticoBirl();
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );
                this.interpretador = new Interpretador(
                    this.importador, 
                    process.cwd(), 
                    false, 
                    this.funcaoDeRetorno, 
                    this.funcaoDeRetornoMesmaLinha);
                break;
            case 'egua':
                if (depurador) {
                    throw new Error('Dialeto ' + this.dialeto + ' não suporta depuração.');
                }

                this.lexador = new LexadorEguaClassico();
                this.avaliadorSintatico = new AvaliadorSintaticoEguaClassico();
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );
                this.interpretador = new InterpretadorEguaClassico(process.cwd());
                break;
            case 'eguap':
                this.lexador = new LexadorEguaP();
                this.avaliadorSintatico = new AvaliadorSintaticoEguaP();
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );
                
                this.interpretador = depurador
                    ? new InterpretadorComDepuracaoImportacao(
                        this.importador, 
                        process.cwd(), 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha)
                    : new Interpretador(this.importador, 
                        process.cwd(), 
                        performance, 
                        this.funcaoDeRetorno,
                        this.funcaoDeRetornoMesmaLinha);
                break;
            case 'portugol-studio':
                this.lexador = new LexadorPortugolStudio();
                this.avaliadorSintatico = new AvaliadorSintaticoPortugolStudio();
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );
                
                this.interpretador = depurador
                    ? new InterpretadorPortugolStudioComDepuracao(
                        process.cwd(), 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha)
                    : new InterpretadorPortugolStudio(
                        process.cwd(),
                        performance, 
                        this.funcaoDeRetorno);
                break;
            case 'mapler':
                this.lexador = new LexadorMapler();
                this.avaliadorSintatico = new AvaliadorSintaticoMapler();
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );
    
                this.interpretador = depurador
                    ? new InterpretadorMaplerComDepuracaoImportacao(
                        this.importador, 
                        process.cwd(), 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha)
                    : new InterpretadorMapler(
                        process.cwd(), 
                        false, 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha);
                break;
            case 'visualg':
                this.lexador = new LexadorVisuAlg();
                this.avaliadorSintatico = new AvaliadorSintaticoVisuAlg();
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );

                this.interpretador = depurador
                    ? new InterpretadorVisuAlgComDepuracaoImportacao(
                        this.importador, 
                        process.cwd(), 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha)
                    : new InterpretadorVisuAlg(
                        process.cwd(), 
                        false, 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha);
                break;
            default:
                this.lexador = new Lexador(performance);
                this.avaliadorSintatico = new AvaliadorSintatico(performance);
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );

                this.interpretador = depurador
                    ? new InterpretadorComDepuracaoImportacao(
                        this.importador, 
                        process.cwd(), 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha)
                    : new Interpretador(
                        this.importador, 
                        process.cwd(), 
                        performance, 
                        this.funcaoDeRetorno, 
                        this.funcaoDeRetornoMesmaLinha);
                break;
        }

        if (traduzir) {
            switch (traduzir) {
                case 'javascript':
                case 'js':
                    this.tradutorJavaScript = new TradutorJavaScript();
                    break;
                case 'delegua':
                    this.tradutorReversoJavascript = new TradutorReversoJavaScript();
                    break;
                case 'alg':
                case 'visualg':
                        this.tradutorVisualg = new TradutorVisualg();
                        break;
                default:
                    throw new Error(`Tradutor '${traduzir}' não implementado.`);
            }
        }

        if (depurador) {
            this.iniciarDepuracao();
        }
    }

    versao(): string {
        try {
            const manifesto = caminho.resolve(__dirname, 'package.json');

            return JSON.parse(sistemaArquivos.readFileSync(manifesto, { encoding: 'utf8' })).version || '0.12';
        } catch (error: any) {
            return '0.16 (desenvolvimento)';
        }
    }

    /**
     * LAIR (Leia-Avalie-Imprima-Repita) é o modo em que Delégua executa em modo console,
     * ou seja, esperando como entrada linhas de código fornecidas pelo usuário.
     */
    iniciarLairDelegua(): void {
        this.funcaoDeRetorno(`Usando dialeto: ${this.dialetos[this.dialeto]}`);
        this.funcaoDeRetorno(`Console da Linguagem Delégua v${this.versao()}`);
        this.funcaoDeRetorno('Pressione Ctrl + C para sair');

        const interfaceLeitura = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '\ndelegua> ',
        });

        const isto = this;

        this.interpretador.interfaceEntradaSaida = interfaceLeitura;

        interfaceLeitura.prompt();
        interfaceLeitura.on('line', async (linha: string) => {
            const { resultado } = await isto.executarUmaLinha(linha);
            if (resultado && resultado.length) {
                isto.funcaoDeRetorno(resultado[0]);
            }

            interfaceLeitura.prompt();
        });
    }

    /**
     * Executa uma linha. Usado pelo modo LAIR e pelo servidor de depuração, quando recebe um comando 'avaliar'.
     * @param linha A linha a ser avaliada.
     * @returns O resultado da execução, com os retornos e respectivos erros, se houverem.
     */
    async executarUmaLinha(linha: string): Promise<RetornoExecucaoInterface> {
        const retornoLexador = this.lexador.mapear([linha], -1);
        const retornoAvaliadorSintatico = this.avaliadorSintatico.analisar(retornoLexador, -1);
        if (
            this.afericaoErros({
                retornoLexador,
                retornoAvaliadorSintatico,
            } as RetornoImportador)
        ) {
            return { resultado: [] } as RetornoExecucaoInterface;
        }

        return await this.executar(
            {
                retornoLexador,
                retornoAvaliadorSintatico,
            } as RetornoImportador,
            true
        );
    }

    /**
     * Instancia um servidor de depuração, normalmente recebendo requisições na porta 7777.
     */
    iniciarDepuracao(): void {
        this.servidorDepuracao = new ServidorDepuracao(this);
        this.servidorDepuracao.iniciarServidorDepuracao();
        (this.interpretador as any).finalizacaoDaExecucao = this.finalizarDepuracao.bind(this);
    }

    /**
     * Pede ao servidor de depuração que finalize a execução.
     * Se não for feito, o servidor de depuração mantém um _stream_ aberto e nunca finaliza.
     * Mais informações: https://stackoverflow.com/a/47456805/1314276
     */
    finalizarDepuracao(): void {
        if (this.servidorDepuracao) {
            this.servidorDepuracao.finalizarServidorDepuracao();
        }
    }

    /**
     * Verifica erros nas etapas de lexação e avaliação sintática.
     * @param retornoImportador Um objeto que implementa a interface RetornoImportador.
     * @returns Verdadeiro se há erros. Falso caso contrário.
     */
    afericaoErros(retornoImportador: RetornoImportador): boolean {
        if (retornoImportador.retornoLexador.erros.length > 0) {
            for (const erroLexador of retornoImportador.retornoLexador.erros) {
                this.reportar(erroLexador.linha, ` no '${erroLexador.caractere}'`, erroLexador.mensagem);
            }
            return true;
        }

        if (retornoImportador.retornoAvaliadorSintatico.erros.length > 0) {
            for (const erroAvaliadorSintatico of retornoImportador.retornoAvaliadorSintatico.erros) {
                this.erro(erroAvaliadorSintatico.simbolo, erroAvaliadorSintatico.message);
            }
            return true;
        }

        return false;
    }

    /**
     * Realiza a tradução do arquivo passado como parâmetro no comando de execução.
     * @param caminhoRelativoArquivo O caminho do arquivo.
     * @param gerarArquivoSaida Se o resultado da tradução deve ser escrito em arquivo.
     *                          Se verdadeiro, os arquivos de saída são escritos no mesmo diretório
     *                          do arquivo passado no primeiro parâmetro.
     */
    traduzirArquivo(caminhoRelativoArquivo: string, gerarArquivoSaida: boolean): any {
        const caminhoAbsolutoPrimeiroArquivo = caminho.resolve(caminhoRelativoArquivo);
        const novoDiretorioBase = caminho.dirname(caminhoAbsolutoPrimeiroArquivo);

        this.importador.diretorioBase = novoDiretorioBase;

        const retornoImportador = this.importador.importar(
            caminhoRelativoArquivo,
            true,
            !this.tradutorJavaScript
        );

        let resultado = null;
        if (this.tradutorJavaScript !== null && this.tradutorJavaScript !== undefined) {
            if (this.afericaoErros(retornoImportador)) {
                process.exit(65); // Código para erro de avaliação antes da tradução
            }

            resultado = this.tradutorJavaScript.traduzir(retornoImportador.retornoAvaliadorSintatico.declaracoes);
        } else if (this.tradutorReversoJavascript !== null && this.tradutorReversoJavascript !== undefined) {
            resultado = this.tradutorReversoJavascript.traduzir(retornoImportador.conteudoArquivo.join('\n'));
        } else {
            resultado = this.tradutorVisualg.traduzir(retornoImportador.conteudoArquivo.join('\n'));
        }

        if (gerarArquivoSaida) {
            ['.delegua', '.js', '.alg'].map((extensao) => {
                const extensaoArquivoSaida = extensao === '.delegua' ? '.js' : '.delegua'
                if (caminhoAbsolutoPrimeiroArquivo.includes(extensao)) {
                    sistemaArquivos.writeFile(caminhoAbsolutoPrimeiroArquivo.replace(extensao, `${extensaoArquivoSaida}`), resultado, (erro) => {
                        if (erro) throw erro;
                    });
                    return;
                }
            });
        }

        this.funcaoDeRetorno(resultado);
    }

    async executarCodigoComoArgumento(codigo: string) {
        const retornoLexador = this.lexador.mapear([codigo], -1);
        const retornoAvaliadorSintatico = this.avaliadorSintatico.analisar(retornoLexador, -1);
        const { erros } = await this.executar({
            conteudoArquivo: [codigo],
            nomeArquivo: '',
            hashArquivo: -1,
            retornoLexador: retornoLexador,
            retornoAvaliadorSintatico: retornoAvaliadorSintatico,
        });

        if (erros.length > 0) process.exit(70); // Código com exceções não tratadas
    }

    /**
     * Execução por arquivo.
     * @param caminhoRelativoArquivo O caminho no sistema operacional do arquivo a ser aberto.
     */
    async carregarArquivo(caminhoRelativoArquivo: string): Promise<any> {
        const caminhoAbsolutoPrimeiroArquivo = caminho.resolve(caminhoRelativoArquivo);
        const novoDiretorioBase = caminho.dirname(caminhoAbsolutoPrimeiroArquivo);

        this.importador.diretorioBase = novoDiretorioBase;
        this.interpretador.diretorioBase = novoDiretorioBase;

        const retornoImportador = this.importador.importar(caminhoRelativoArquivo, true, false);

        if (this.afericaoErros(retornoImportador)) {
            process.exit(65); // Código para erro de avaliação antes da execução
        }

        let errosExecucao: any = {
            lexador: [],
            avaliadorSintatico: [],
            interpretador: [],
        };

        const interfaceLeitura = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '\n> ',
        });

        this.interpretador.interfaceEntradaSaida = interfaceLeitura;

        if (this.modoDepuracao) {
            try {
                (this.interpretador as InterpretadorComDepuracaoInterface).prepararParaDepuracao(
                    retornoImportador.retornoAvaliadorSintatico.declaracoes
                );
            } catch (erro: any) {
                console.error(chalk.red(`[Erro de execução]`) + ` Dialeto ${this.dialeto} não suporta depuração.`);
            }
        } else {
            const { erros } = await this.executar(retornoImportador);
            errosExecucao = erros;
        }

        interfaceLeitura.close();
        if (errosExecucao.length > 0) process.exit(70); // Código com exceções não tratadas
    }

    /**
     * A execução do código de fato.
     * @param retornoImportador Dados retornados do Importador, como o retorno do Lexador, do Avaliador
     *                          Sintático e respectivos erros.
     * @param manterAmbiente Indicação se ambiente deve ser mantido ou não. Normalmente verdadeiro
     *                       para LAIR, falso para execução por arquivo.
     * @returns Um objeto com o resultado da execução.
     */
    async executar(retornoImportador: RetornoImportador, manterAmbiente = false): Promise<RetornoExecucaoInterface> {
        const retornoInterpretador = await this.interpretador.interpretar(
            retornoImportador.retornoAvaliadorSintatico.declaracoes,
            manterAmbiente
        );

        if (retornoInterpretador.erros.length > 0) {
            for (const erroInterpretador of retornoInterpretador.erros) {
                if (erroInterpretador.simbolo) {
                    this.erroEmTempoDeExecucao(erroInterpretador);
                } else {
                    const erroEmJavaScript: any = erroInterpretador as ErroInterpretador;
                    console.error(
                        chalk.red(`[Linha: ${erroEmJavaScript.linha}] Erro em JavaScript: `) +
                            `${erroEmJavaScript.erroInterno?.message}`
                    );
                    console.error(chalk.red(`Pilha de execução: `) + `${erroEmJavaScript.erroInterno?.stack}`);
                }
            }
        }

        return {
            erros: retornoInterpretador.erros,
            resultado: retornoInterpretador.resultado,
        };
    }

    reportar(linha: number, onde: any, mensagem: string): void {
        /* if (this.nomeArquivo)
            console.error(
                chalk.red(`[Arquivo: ${this.nomeArquivo}] [Linha: ${linha}]`) + ` Erro${onde}: ${mensagem}`
            );
        else */
        console.error(chalk.red(`[Linha: ${linha}]`) + ` Erro${onde}: ${mensagem}`);
    }

    erro(simbolo: SimboloInterface, mensagemDeErro: string): void {
        const _simbolo = simbolo || { tipo: tiposDeSimbolos.EOF, linha: -1, lexema: '(indefinido)' };
        if (_simbolo.tipo === tiposDeSimbolos.EOF) {
            this.reportar(Number(_simbolo.linha), ' no final do código', mensagemDeErro);
        } else {
            this.reportar(Number(_simbolo.linha), ` no '${_simbolo.lexema}'`, mensagemDeErro);
        }
    }

    erroEmTempoDeExecucao(erro: any): void {
        const linha = erro?.simbolo?.linha || erro?.linha;
        const mensagem = erro?.mensagem || erro?.message;
        console.error(chalk.red(`Erro: [Linha: ${linha}]`) + ` ${mensagem}`);
    }
}
