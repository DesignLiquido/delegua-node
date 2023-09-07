import * as caminho from 'path';
import * as readline from 'readline';

import chalk from "chalk";
import colorizeJson from 'json-colorizer';

import { AvaliadorSintaticoInterface, InterpretadorComDepuracaoInterface, InterpretadorInterface, LexadorInterface, RetornoExecucaoInterface, SimboloInterface } from "@designliquido/delegua/fontes/interfaces";
import { ErroInterpretador } from "@designliquido/delegua/fontes/interpretador";

import { Importador, RetornoImportador } from "./importador";
import { ImportadorInterface } from "./interfaces";
import { ServidorDepuracao } from './depuracao';

import { FormatadorJson } from './formatadores';
import { LexadorJson } from './lexador/lexador-json';
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico';
import { AvaliadorSintaticoBirl, AvaliadorSintaticoEguaClassico, AvaliadorSintaticoPitugues, AvaliadorSintaticoMapler, AvaliadorSintaticoPortugolIpt, AvaliadorSintaticoPortugolStudio, AvaliadorSintaticoVisuAlg } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos';
import { InterpretadorBirl, InterpretadorEguaClassico, InterpretadorMapler, InterpretadorPortugolIpt, InterpretadorPortugolStudioComDepuracao, InterpretadorPortugolStudio, InterpretadorVisuAlg } from '@designliquido/delegua/fontes/interpretador/dialetos';
import { Lexador } from '@designliquido/delegua/fontes/lexador';
import { LexadorBirl, LexadorEguaClassico, LexadorPitugues, LexadorMapler, LexadorPortugolIpt, LexadorPortugolStudio, LexadorVisuAlg } from '@designliquido/delegua/fontes/lexador/dialetos';
import { Interpretador } from './interpretador';
import { InterpretadorMaplerComDepuracaoImportacao } from './interpretador/dialetos/interpretador-mapler-com-depuracao-importacao';
import { InterpretadorVisuAlgComDepuracaoImportacao } from './interpretador/dialetos/interpretador-visualg-com-depuracao-importacao';
import { InterpretadorComDepuracaoImportacao } from './interpretador/interpretador-com-depuracao-importacao';
import { NucleoExecucaoInterface } from './interfaces/nucleo-execucao-interface';
import { NucleoComum } from './nucleo-comum';

export class NucleoExecucao 
    extends NucleoComum
    implements NucleoExecucaoInterface 
{
    interpretador: InterpretadorInterface;
    lexador: LexadorInterface<any>;
    avaliadorSintatico: AvaliadorSintaticoInterface<any, any>;
    importador: ImportadorInterface<any, any>;
    servidorDepuracao: ServidorDepuracao;

    versao: string;
    dialeto: string;
    modoDepuracao: boolean;
    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    dialetos: { [identificador: string]: string } = {
        birl: 'BIRL',
        delegua: 'padrão',
        egua: 'Égua',
        mapler: 'Mapler',
        pitugues: 'Pituguês',
        'portugol-studio': 'Portugol Studio',
        visualg: 'VisuAlg',
    };

    funcaoDeRetorno: Function;
    funcaoDeRetornoMesmaLinha: Function;

    constructor(
        versao: string,
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        super();
        this.versao = versao;
        this.arquivosAbertos = {};
        this.conteudoArquivosAbertos = {};

        this.funcaoDeRetorno = funcaoDeRetorno || console.log;
        // `process.stdout.write.bind(process.stdout)` é necessário por causa de 
        // https://stackoverflow.com/questions/28874665/node-js-cannot-read-property-defaultencoding-of-undefined
        this.funcaoDeRetornoMesmaLinha = funcaoDeRetornoMesmaLinha || process.stdout.write.bind(process.stdout);
    }

    configurarDialeto(
        dialeto: string = 'delegua', 
        performance: boolean = false,
        depurador: boolean = false
    ) {
        this.dialeto = dialeto;
        this.modoDepuracao = depurador;
        switch (dialeto) {
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
                this.interpretador = new InterpretadorBirl(
                    process.cwd(),
                    this.funcaoDeRetorno,
                    this.funcaoDeRetornoMesmaLinha);
                break;
            case 'egua':
                if (depurador) {
                    throw new Error('Dialeto ' + dialeto + ' não suporta depuração.');
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
            case 'pitugues':
                this.lexador = new LexadorPitugues();
                this.avaliadorSintatico = new AvaliadorSintaticoPitugues();
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
            case 'portugol-ipt':
                this.lexador = new LexadorPortugolIpt();
                this.avaliadorSintatico = new AvaliadorSintaticoPortugolIpt();
                this.importador = new Importador(
                    this.lexador,
                    this.avaliadorSintatico,
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    depurador
                );

                this.interpretador = depurador
                    ? new InterpretadorPortugolIpt(
                        process.cwd(),
                        this.funcaoDeRetornoMesmaLinha,
                        this.funcaoDeRetornoMesmaLinha)
                    : new InterpretadorPortugolIpt(
                        process.cwd(),
                        this.funcaoDeRetornoMesmaLinha,
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

        if (depurador) {
            this.iniciarDepuracao();
        }
    }
    
    async executarCodigoComoArgumento(codigo: string): Promise<void> {
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
    async carregarEExecutarArquivo(caminhoRelativoArquivo: string): Promise<any> {
        const caminhoAbsolutoPrimeiroArquivo = caminho.resolve(caminhoRelativoArquivo);
        const novoDiretorioBase = caminho.dirname(caminhoAbsolutoPrimeiroArquivo);

        this.importador.diretorioBase = novoDiretorioBase;
        this.interpretador.diretorioBase = novoDiretorioBase;

        const retornoImportador = this.importador.importar(caminhoRelativoArquivo, true);

        if (this.afericaoErros(retornoImportador)) {
            process.exit(65); // Código para erro de avaliação antes da execução
        }

        let errosExecucao: any = {
            lexador: [],
            avaliadorSintatico: [],
            interpretador: [],
        };

        // Se a interface de entrada e saída ainda não está definida, definimos agora.
        // A interface pode ser definida por um teste unitário antes da execução
        // aqui, por exemplo.
        let interfaceLeitura: any;
        if (!this.interpretador.interfaceEntradaSaida) {
            interfaceLeitura = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                prompt: '\n> ',
            });
    
            this.interpretador.interfaceEntradaSaida = interfaceLeitura;
        }

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

        if (interfaceLeitura && interfaceLeitura.hasOwnProperty('close')) {
            interfaceLeitura.close();
        }
        
        if (errosExecucao.length > 0) process.exit(70); // Código com exceções não tratadas
    }

        /**
     * LAIR (Leia-Avalie-Imprima-Repita) é o modo em que Delégua executa em modo console,
     * ou seja, esperando como entrada linhas de código fornecidas pelo usuário.
     */
    iniciarLairDelegua(): void {
        const lexadorJson = new LexadorJson();
        const formatadorJson = new FormatadorJson();

        this.funcaoDeRetorno(`Usando dialeto: ${this.dialetos[this.dialeto]}`);
        this.funcaoDeRetorno(`Console da Linguagem Delégua v${this.versao}`);
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
                const resultadoLexacao = lexadorJson.getTokens(resultado[0]);
                const resultadoFormatacao = formatadorJson.formatar(resultadoLexacao);
                isto.funcaoDeRetorno(colorizeJson(resultadoFormatacao));
            }

            interfaceLeitura.prompt();
        });
    }

    /**
     * A execução do código de fato.
     * @param retornoImportador Dados retornados do Importador, como o retorno do Lexador, do Avaliador
     *                          Sintático e respectivos erros.
     * @param manterAmbiente Indicação se ambiente deve ser mantido ou não. Normalmente verdadeiro
     *                       para LAIR, falso para execução por arquivo.
     * @returns Um objeto com o resultado da execução.
     */
    async executar(retornoImportador: RetornoImportador<any, any>, manterAmbiente = false): Promise<RetornoExecucaoInterface> {
        const retornoInterpretador = await this.interpretador.interpretar(
            retornoImportador.retornoAvaliadorSintatico.declaracoes,
            manterAmbiente
        );

        if (retornoInterpretador.erros.length > 0) {
            for (const erroInterpretador of retornoInterpretador.erros) {
                if (erroInterpretador.hasOwnProperty('simbolo')) {
                    this.erroEmTempoDeExecucao(erroInterpretador);
                } else {
                    if (erroInterpretador.hasOwnProperty('erroInterno')) {
                        const erroEmJavaScript: any = erroInterpretador as ErroInterpretador;
                        console.error(
                            chalk.red(`[Linha: ${erroEmJavaScript.linha}] Erro em JavaScript: `) +
                            `${erroEmJavaScript.erroInterno?.message}`
                        );
                        console.error(chalk.red(`Pilha de execução: `) + `${erroEmJavaScript.erroInterno?.stack}`);
                    } else {
                        console.error(
                            chalk.red(`Erro em JavaScript: `) + JSON.stringify(erroInterpretador)
                        );
                    }
                }
            }
        }

        return {
            erros: retornoInterpretador.erros,
            resultado: retornoInterpretador.resultado,
        };
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
            } as RetornoImportador<any, any>)
        ) {
            return { resultado: [] } as RetornoExecucaoInterface;
        }

        return await this.executar(
            {
                retornoLexador,
                retornoAvaliadorSintatico,
            } as RetornoImportador<any, any>,
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

    protected erroEmTempoDeExecucao(erro: any): void {
        const linha = erro?.simbolo?.linha || erro?.linha;
        const mensagem = erro?.mensagem || erro?.message;
        console.error(chalk.red(`Erro: [Linha: ${linha}]`) + ` ${mensagem}`);
    }
}
