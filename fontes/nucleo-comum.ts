import chalk from "chalk";

import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/delegua';
import { RetornoAvaliadorSintatico, RetornoLexador, SimboloInterface } from "@designliquido/delegua/interfaces";

import { RetornoImportador } from "./importador";
import { Declaracao } from "@designliquido/delegua";

export abstract class NucleoComum {
    /**
     * Verifica erros nas etapas de lexação e avaliação sintática.
     * @param retornoLexador Um objeto que implementa a interface RetornoImportador.
     * @returns Verdadeiro se há erros. Falso caso contrário.
     */
    protected afericaoErrosLexador(retornoLexador: RetornoLexador<SimboloInterface>): boolean {
        if (retornoLexador.erros.length > 0) {
            for (const erroLexador of retornoLexador.erros) {
                this.reportar(erroLexador.linha, ` no '${erroLexador.caractere}'`, erroLexador.mensagem);
            }
            return true;
        }

        return false;
    }

    protected afericaoErrosAvaliadorSintatico(retornoAvaliadorSintatico: RetornoAvaliadorSintatico<Declaracao>): boolean {
        if (retornoAvaliadorSintatico.erros.length > 0) {
            for (const erroAvaliadorSintatico of retornoAvaliadorSintatico.erros) {
                this.erro(erroAvaliadorSintatico.simbolo, erroAvaliadorSintatico.message);
            }

            return true;
        }

        return false;
    }

    protected reportar(linha: number, onde: any, mensagem: string): void {
        /* if (this.nomeArquivo)
            console.error(
                chalk.red(`[Arquivo: ${this.nomeArquivo}] [Linha: ${linha}]`) + ` Erro${onde}: ${mensagem}`
            );
        else */
        console.error(chalk.red(`[Linha: ${linha}]`) + ` Erro${onde}: ${mensagem}`);
    }

    protected erro(simbolo: SimboloInterface, mensagemDeErro: string): void {
        const _simbolo = simbolo || { tipo: tiposDeSimbolos.EOF, linha: -1, lexema: '(indefinido)' };
        if (_simbolo.tipo === tiposDeSimbolos.EOF) {
            this.reportar(Number(_simbolo.linha), ' no final do código', mensagemDeErro);
        } else {
            this.reportar(Number(_simbolo.linha), ` no '${_simbolo.lexema}'`, mensagemDeErro);
        }
    }
}
