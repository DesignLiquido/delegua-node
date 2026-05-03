import { RetornoLexadorInterface } from '@designliquido/delegua/interfaces/retornos';

export interface RetornoImportador<TSimbolo> {
    conteudoArquivo: string[];
    nomeArquivo: string;
    hashArquivo: number;
    retornoLexador: RetornoLexadorInterface<TSimbolo>;
}
