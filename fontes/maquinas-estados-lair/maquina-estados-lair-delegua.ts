import { colorize } from "json-colorizer";
import { RetornoExecucaoInterface } from "@designliquido/delegua";

import { FormatadorJson } from "../formatadores";
import { LexadorJson } from "../lexador/lexador-json";
import { MaquinaEstadosLairBase } from "./maquina-estados-lair-base";

export class MaquinaEstadosLairDelegua extends MaquinaEstadosLairBase {
    lexadorJson: LexadorJson;
    formatadorJson: FormatadorJson;
    linhas: string[];

    constructor(
        executarLinhas: (linhas: string[]) => Promise<RetornoExecucaoInterface>,
        funcaoDeRetorno: Function
    ) {
        super('delegua', executarLinhas, funcaoDeRetorno);
    }

    async executarOuAcumular(linha: string): Promise<any> {
        const { resultado } = await this.executarLinhas([linha]);
        if (resultado && resultado.length) {
            const resultadoLexacao = this.lexadorJson.getTokens(resultado[0]);
            const resultadoFormatacao =
                this.formatadorJson.formatar(resultadoLexacao);
            this.funcaoDeRetorno(colorize(resultadoFormatacao));
        }

        this.interfaceLeitura.prompt();
    }
}
