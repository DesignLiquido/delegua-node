import { RetornoImportador } from '../importador';

export interface ImportadorInterface<TSimbolo, TDeclaracao> {
    diretorioBase: string;
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    importar(
        caminhoRelativoArquivo: string,
        importacaoInicial: boolean
    ): RetornoImportador<TSimbolo, TDeclaracao>;
}
