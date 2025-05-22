import * as readline from "readline";

import { RetornoExecucaoInterface } from "@designliquido/delegua";

import { FormatadorJson } from "../formatadores";
import { LexadorJson } from "../lexador/lexador-json";

export abstract class MaquinaEstadosLairBase {
    lexadorJson: LexadorJson;
    formatadorJson: FormatadorJson;
    linhas: string[];
    interfaceLeitura: readline.Interface;
    acumular: boolean;
    executarLinhas: (linhas: string[]) => Promise<RetornoExecucaoInterface>;
    funcaoDeRetorno: Function;

    constructor(
        dialeto: string, 
        executarLinhas: (linhas: string[]) => Promise<RetornoExecucaoInterface>,
        funcaoDeRetorno: Function
    ) {
        this.interfaceLeitura = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: `\n${dialeto}> `,
        });

        this.lexadorJson = new LexadorJson();
        this.formatadorJson = new FormatadorJson();
        this.linhas = [];
        this.acumular = false;
        this.executarLinhas = executarLinhas;
        this.funcaoDeRetorno = funcaoDeRetorno;
    }

    abstract executarOuAcumular(linha: string): Promise<void>;
}