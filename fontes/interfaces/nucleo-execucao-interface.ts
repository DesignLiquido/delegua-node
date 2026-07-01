import { InterpretadorInterface, RetornoExecucaoInterface } from "@designliquido/delegua/interfaces";

export interface NucleoExecucaoInterface {
    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    funcaoDeRetorno: Function;
    interpretador: InterpretadorInterface;

    versao?: string;
    dialeto?: string;

    executarLinhas(linhas: string[]): Promise<RetornoExecucaoInterface>;
    carregarEExecutarArquivo?(caminhoRelativoArquivo: string): Promise<any>;
    finalizarDepuracao?(): void;
}
