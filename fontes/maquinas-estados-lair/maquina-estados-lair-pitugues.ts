import { colorize } from "json-colorizer";
import { RetornoExecucaoInterface } from "@designliquido/delegua";

import { FormatadorJson } from "../formatadores";
import { LexadorJson } from "../lexador/lexador-json";
import { MaquinaEstadosLairBase } from "./maquina-estados-lair-base";

export class MaquinaEstadosLairPitugues extends MaquinaEstadosLairBase {
    lexadorJson: LexadorJson;
    formatadorJson: FormatadorJson;
    linhas: string[];
    acumular: boolean;

    constructor(
        executarLinhas: (linhas: string[]) => Promise<RetornoExecucaoInterface>,
        funcaoDeRetorno: Function
    ) {
        super('pitugues', executarLinhas, funcaoDeRetorno);
    }

    async executarOuAcumular(linha: string): Promise<void> {
        this.linhas.push(linha);

        if (linha.endsWith(':')) {
            this.acumular = true;
            this.interfaceLeitura.setPrompt("... ");
        }

        if (this.acumular && linha.length === 0) {
            this.acumular = false;
            this.interfaceLeitura.setPrompt("\npitugues> ");
        }

        if (!this.acumular) {
            const { resultado } = await this.executarLinhas(this.linhas);
            if (resultado && resultado.length) {
                const resultadoLexacao = this.lexadorJson.getTokens(resultado[0]);
                const resultadoFormatacao =
                    this.formatadorJson.formatar(resultadoLexacao);
                this.funcaoDeRetorno(colorize(resultadoFormatacao));
            }
            this.linhas = [];
        }

        this.interfaceLeitura.prompt();
    }
}
