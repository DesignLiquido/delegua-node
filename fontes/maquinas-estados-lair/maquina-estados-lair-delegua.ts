import chalk from "chalk";
import { colorize } from "json-colorizer";
import { Const, RetornoExecucaoInterface, Var } from "@designliquido/delegua";

import { FormatadorJson } from "../formatadores";
import { LexadorJson } from "../lexador/lexador-json";
import { MaquinaEstadosLairBase } from "./maquina-estados-lair-base";

export class MaquinaEstadosLairDelegua extends MaquinaEstadosLairBase {
    escoposAbertos: number;

    constructor(
        executarLinhas: (linhas: string[]) => Promise<RetornoExecucaoInterface>,
        funcaoDeRetorno: Function
    ) {
        super('delegua', executarLinhas, funcaoDeRetorno);
        this.escoposAbertos = 0;
    }

    /**
     * Verifica se um valor é um tipo simples (número, texto, lógico, nulo)
     */
    private ehTipoSimples(valorRetornado: any): boolean {
        if (!valorRetornado) return false;

        const tipo = valorRetornado.tipo;
        const valorReal = valorRetornado.valor;

        // Tipos simples: número, texto, lógico, nulo
        if (tipo === 'número' || tipo === 'texto' || tipo === 'lógico') {
            return true;
        }

        if (valorReal === null || valorReal === undefined) {
            return true;
        }

        return false;
    }

    /**
     * Formata um valor simples para exibição amigável no LAIR
     */
    private formatarValorSimples(valorRetornado: any): string {
        const tipo = valorRetornado?.tipo || 'desconhecido';
        const valorReal = valorRetornado?.valor;

        if (tipo === 'texto') {
            return chalk.green(`"${valorReal}"`);
        } 
        
        if (tipo === 'número') {
            return chalk.cyan(String(valorReal));
        } 
        
        if (tipo === 'lógico') {
            return chalk.yellow(String(valorReal));
        } 
        
        if (valorReal === null || valorReal === undefined) {
            return chalk.gray('nulo');
        }

        return String(valorReal);
    }

    /**
     * Detecta se é uma declaração de variável e retorna informações sobre ela
     */
    private detectarDeclaracaoVariavel(declaracoes: any[]): {
        ehDeclaracao: boolean;
        nomeVariavel?: string;
        valor?: any;
        tipo?: string;
    } {
        if (!declaracoes || declaracoes.length === 0) {
            return { ehDeclaracao: false };
        }

        const primeiraDeclaracao = declaracoes[0];

        // Verifica se é uma declaração Var ou Const
        if (primeiraDeclaracao.constructor === Var ||
            primeiraDeclaracao.constructor === Const) {
            const simbolo = primeiraDeclaracao.simbolo;
            const inicializador = primeiraDeclaracao.inicializador;

            return {
                ehDeclaracao: true,
                nomeVariavel: simbolo?.lexema,
                valor: inicializador,
                tipo: primeiraDeclaracao.constructor === Const ? 'const' : 'var'
            };
        }

        return { ehDeclaracao: false };
    }

    async executarOuAcumular(linha: string): Promise<any> {
        // Algoritmo: detectar chave aberta na linha sem fechamento.
        this.linhas.push(linha);

        for (let i = 0; i < linha.length; i++) {
            if (linha[i] === '{') {
                this.escoposAbertos++;
            } else if (linha[i] === '}') {
                this.escoposAbertos--;
            }
        }

        if (this.escoposAbertos > 0) {
            this.interfaceLeitura.setPrompt("... ");
            this.interfaceLeitura.prompt();
            return;
        } else {
            const retornoExecucao: any = await this.executarLinhas(this.linhas);
            const { resultado, declaracoes } = retornoExecucao;

            // Detecta se é uma declaração de variável
            const infoDeclaracao = this.detectarDeclaracaoVariavel(declaracoes);

            if (infoDeclaracao.ehDeclaracao && resultado && resultado.length > 0) {
                // É uma declaração de variável - mostra mensagem amigável
                const primeiroResultado = resultado[0];
                const valorRetornado = primeiroResultado?.valorRetornado || primeiroResultado;
                const nomeVar = infoDeclaracao.nomeVariavel;
                const tipoVar = valorRetornado?.tipo || 'desconhecido';

                let valorFormatado: string;
                if (this.ehTipoSimples(valorRetornado)) {
                    valorFormatado = this.formatarValorSimples(valorRetornado);
                } else {
                    // Para objetos/dicionários, mostra apenas "dicionário" ou similar
                    valorFormatado = chalk.magenta(`{...} (${tipoVar})`);
                }

                const mensagem = chalk.dim(`(criada variável ${chalk.bold(nomeVar)} com o valor ${valorFormatado})`);
                this.funcaoDeRetorno(mensagem);
            } else if (resultado && resultado.length > 0) {
                // É uma expressão - verifica se é tipo simples ou complexo
                const primeiroResultado = resultado[0];
                const valorRetornado = primeiroResultado?.valorRetornado || primeiroResultado;

                if (this.ehTipoSimples(valorRetornado)) {
                    // Para tipos simples, mostra de forma amigável
                    const valorFormatado = this.formatarValorSimples(valorRetornado);
                    this.funcaoDeRetorno(valorFormatado);
                } else {
                    // Para objetos/dicionários, mostra apenas o valor interno sem metadados
                    const valorReal = valorRetornado?.valor;
                    if (valorReal !== undefined && valorReal !== null) {
                        this.funcaoDeRetorno(colorize(JSON.stringify(valorReal, null, 2)));
                    } else {
                        // Padrão para o formato original se não conseguir extrair o valor
                        const resultadoLexacao = this.lexadorJson.getTokens(primeiroResultado);
                        const resultadoFormatacao = this.formatadorJson.formatar(resultadoLexacao);
                        this.funcaoDeRetorno(colorize(resultadoFormatacao));
                    }
                }
            }

            // Limpa as linhas acumuladas
            this.linhas = [];

            this.interfaceLeitura.setPrompt("\ndelegua> ");
            this.interfaceLeitura.prompt();
        }
    }
}
