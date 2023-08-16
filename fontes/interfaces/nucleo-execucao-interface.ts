import { InterpretadorInterface, RetornoExecucaoInterface } from "@designliquido/delegua/fontes/interfaces";

export interface NucleoExecucaoInterface {
    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    funcaoDeRetorno: Function;
    interpretador: InterpretadorInterface;

    executarUmaLinha(linha: string): Promise<RetornoExecucaoInterface>;
}
