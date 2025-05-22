import { InterpretadorInterface, RetornoExecucaoInterface } from "@designliquido/delegua/interfaces";

export interface NucleoExecucaoInterface {
    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    funcaoDeRetorno: Function;
    interpretador: InterpretadorInterface;

    executarLinhas(linhas: string[]): Promise<RetornoExecucaoInterface>;
}
