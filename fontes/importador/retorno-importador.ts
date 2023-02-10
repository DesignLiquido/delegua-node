import { RetornoAvaliadorSintatico } from '@designliquido/delegua/fontes/interfaces/retornos/retorno-avaliador-sintatico';
import { RetornoLexador } from '@designliquido/delegua/fontes/interfaces/retornos/retorno-lexador';

export interface RetornoImportador {
    conteudoArquivo: string[];
    nomeArquivo: string;
    hashArquivo: number;
    retornoLexador: RetornoLexador;
    retornoAvaliadorSintatico: RetornoAvaliadorSintatico;
}
