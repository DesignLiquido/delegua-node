import { SimboloInterface } from '@designliquido/delegua/interfaces';
import { Literal, Variavel } from '@designliquido/delegua/construtos';

import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/delegua';

/**
 * Micro-avaliador sintático especializado para argumentos da função ajuda().
 *
 * Diferente do parser principal, este tratador permite que palavras-chave
 * (como 'para', 'se', 'enquanto') sejam usadas como argumentos para ajuda(),
 * convertendo-as em nomes de tópicos.
 *
 * Exemplo:
 *   ajuda(para)     → tópico "para"
 *   ajuda(escreva)  → tópico "escreva"
 *   ajuda("texto")  → tópico "texto"
 */
export class MicroAvaliadorAjuda {
    /**
     * Lista de tipos de símbolos que são palavras-chave da linguagem.
     * Todos podem ser usados como tópicos de ajuda.
     */
    private static readonly PALAVRAS_CHAVE = new Set([
        tiposDeSimbolos.CONSTANTE,
        tiposDeSimbolos.VARIAVEL,
        tiposDeSimbolos.SE,
        tiposDeSimbolos.SENAO,
        tiposDeSimbolos.PARA,
        tiposDeSimbolos.ENQUANTO,
        tiposDeSimbolos.FAZER,
        tiposDeSimbolos.FUNCAO,
        tiposDeSimbolos.RETORNA,
        tiposDeSimbolos.CLASSE,
        tiposDeSimbolos.HERDA,
        tiposDeSimbolos.CONSTRUTOR,
        tiposDeSimbolos.ISTO,
        tiposDeSimbolos.SUPER,
        tiposDeSimbolos.TENTE,
        tiposDeSimbolos.PEGUE,
        tiposDeSimbolos.FINALMENTE,
        tiposDeSimbolos.SUSTAR,
        tiposDeSimbolos.CONTINUA,
        tiposDeSimbolos.ESCOLHA,
        tiposDeSimbolos.CASO,
        tiposDeSimbolos.PADRAO,
        tiposDeSimbolos.IMPORTAR,
        tiposDeSimbolos.DE,
        tiposDeSimbolos.COMO,
        tiposDeSimbolos.VERDADEIRO,
        tiposDeSimbolos.FALSO,
        tiposDeSimbolos.NULO,
        tiposDeSimbolos.ESCREVA,
        tiposDeSimbolos.LEIA,
    ]);

    /**
     * Converte um símbolo (palavra-chave ou identificador) em um construto
     * que pode ser usado como argumento de ajuda.
     *
     * @param simbolo - Símbolo a ser convertido
     * @returns Construto Variavel com o nome do tópico
     */
    static converterSimboloParaTopico(simbolo: SimboloInterface): Variavel | Literal {
        // Se for um literal de texto, retorna como está
        if (simbolo.tipo === tiposDeSimbolos.TEXTO) {
            return new Literal(
                simbolo.hashArquivo,
                simbolo.linha,
                simbolo.literal as string,
                'texto'
            );
        }

        // Se for número, booleano, ou nulo, retorna como literal
        if (simbolo.tipo === tiposDeSimbolos.NUMERO ||
            simbolo.tipo === tiposDeSimbolos.VERDADEIRO ||
            simbolo.tipo === tiposDeSimbolos.FALSO ||
            simbolo.tipo === tiposDeSimbolos.NULO) {
            return new Literal(
                simbolo.hashArquivo,
                simbolo.linha,
                simbolo.literal,
                simbolo.tipo === tiposDeSimbolos.NUMERO ? 'número' : 'lógico'
            );
        }

        // Se for uma palavra-chave ou identificador, converte para Variavel
        // usando o lexema como nome do tópico
        return new Variavel(
            simbolo.hashArquivo,
            simbolo
        );
    }

    /**
     * Verifica se um símbolo pode ser usado como tópico de ajuda.
     */
    static ehTopicoValido(simbolo: SimboloInterface): boolean {
        return (
            simbolo.tipo === tiposDeSimbolos.IDENTIFICADOR ||
            simbolo.tipo === tiposDeSimbolos.TEXTO ||
            this.PALAVRAS_CHAVE.has(simbolo.tipo)
        );
    }

    /**
     * Extrai o nome do tópico de um símbolo.
     */
    static extrairNomeTopico(simbolo: SimboloInterface): string {
        if (simbolo.tipo === tiposDeSimbolos.TEXTO) {
            return simbolo.literal as string;
        }
        return simbolo.lexema;
    }
}
