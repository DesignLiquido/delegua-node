import { RetornoImportador } from '../importador';

// TODO: Remover.
export interface ImportadorInterface<TSimbolo, TDeclaracao> {
    diretorioBase: string;
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    importar(
        caminhoRelativoArquivo: string,
        importacaoInicial: boolean
    ): RetornoImportador<TSimbolo, TDeclaracao>;
}
