export interface DeleguaInterface {
    executarCodigoComoArgumento(
        codigo: string,
        dialeto: string,
        performance: boolean
    ): Promise<void>;
    executarCodigoPorArquivo(
        caminhoRelativoArquivo: string,
        dialeto: string,
        performance: boolean
    ): Promise<any>;
    iniciarLair(dialeto: string): Promise<void>;
    traduzirArquivo(
        caminhoRelativoArquivo: string, 
        comandoTraducao: string,
        gerarArquivoSaida: boolean
    ): void;
}
