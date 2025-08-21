import { colorize } from "json-colorizer";
import { RetornoExecucaoInterface } from "@designliquido/delegua";

import { FormatadorJson } from "../formatadores";
import { LexadorJson } from "../lexador/lexador-json";
import { MaquinaEstadosLairBase } from "./maquina-estados-lair-base";

export class MaquinaEstadosLairDelegua extends MaquinaEstadosLairBase {
    lexadorJson: LexadorJson;
    formatadorJson: FormatadorJson;
    linhas: string[];
    escoposAbertos: number;

    constructor(
        executarLinhas: (linhas: string[]) => Promise<RetornoExecucaoInterface>,
        funcaoDeRetorno: Function
    ) {
        super('delegua', executarLinhas, funcaoDeRetorno);
        this.escoposAbertos = 0;
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
            const { resultado } = await this.executarLinhas(this.linhas);
            if (resultado && resultado.length) {
                const resultadoLexacao = this.lexadorJson.getTokens(resultado[0]);
                const resultadoFormatacao =
                    this.formatadorJson.formatar(resultadoLexacao);
                this.funcaoDeRetorno(colorize(resultadoFormatacao));
            }

            this.interfaceLeitura.setPrompt("\ndelegua> ");
            this.interfaceLeitura.prompt();
        }
    }
}
