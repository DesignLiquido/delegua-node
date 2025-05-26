import { RetornoImportador } from '../importador';

export interface ImportadorInterface<TSimbolo> {
    diretorioBase: string;
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    importar(
        caminhoRelativoArquivo: string,
        hashArquivoAnterior: number
    ): RetornoImportador<TSimbolo>;
}
