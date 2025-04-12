import { RetornoLexador } from '@designliquido/delegua/interfaces/retornos/retorno-lexador';

export interface RetornoImportador<TSimbolo> {
    conteudoArquivo: string[];
    nomeArquivo: string;
    hashArquivo: number;
    retornoLexador: RetornoLexador<TSimbolo>;
}
