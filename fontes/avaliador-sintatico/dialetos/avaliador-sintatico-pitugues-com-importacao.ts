import {
    AvaliadorSintaticoPitugues,
    Classe,
    Declaracao,
    Literal,
    RetornoAvaliadorSintatico,
    RetornoLexador,
    SimboloInterface
} from "@designliquido/delegua";

import tiposDeSimbolos from "@designliquido/delegua/tipos-de-simbolos/delegua";

import { ImportadorInterface } from "../../interfaces";
import { ImportarBiblioteca, ModuloDeclaracoes } from "../../construtos";


export class AvaliadorSintaticoPituguesComImportacao extends AvaliadorSintaticoPitugues {
    importador: ImportadorInterface<SimboloInterface>;
    arquivosImportados: string[];
    modoLair: boolean;

    constructor(importador: ImportadorInterface<SimboloInterface>) {
        super();
        this.arquivosImportados = [];
        this.importador = importador;
    }

    override declaracaoImportar(): any {
        this.consumir(
            tiposDeSimbolos.PARENTESE_ESQUERDO,
            "Esperado '(' após declaração."
        );
        const caminho = this.expressao();
        const simboloFechamento = this.consumir(
            tiposDeSimbolos.PARENTESE_DIREITO,
            "Esperado ')' após declaração."
        );

        // Chegando aqui sem erros, a importação é sintaticamente válida.
        const literalCaminho = caminho as Literal;
        if (!literalCaminho.valor.endsWith('.delegua')) {
            return new ImportarBiblioteca(
                literalCaminho.hashArquivo,
                literalCaminho.linha,
                literalCaminho.valor
            );
        }

        const resultadoImportacao = this.importador.importar(
            literalCaminho.valor,
            caminho.hashArquivo
        );

        // Havendo erros no lexador, levantamos um erro de avaliação sintática na
        // importação.
        if (resultadoImportacao.retornoLexador.erros.length > 0) {
            throw this.erro(
                simboloFechamento,
                `Erros encontrados ao importar o arquivo ${
                    literalCaminho.valor
                }: ${resultadoImportacao.retornoLexador.erros.reduce(
                    (acumulado, proximo) =>
                        (acumulado += proximo.mensagem + "; "),
                    ""
                )}`
            );
        }

        const avaliadorSintaticoModulo = new AvaliadorSintaticoPituguesComImportacao(
            this.importador
        );
        const resultadoAvaliacaoSintaticaModulo =
            avaliadorSintaticoModulo.analisar(
                resultadoImportacao.retornoLexador,
                resultadoImportacao.hashArquivo,
                this.arquivosImportados
            );

        this.arquivosImportados.push(literalCaminho.valor);

        const definicoesClasse =
            resultadoAvaliacaoSintaticaModulo.declaracoes.filter(
                (d) => d.constructor === Classe
            ) as Classe[];

        for (const definicaoClasse of definicoesClasse) {
            this.tiposDefinidosEmCodigo[definicaoClasse.simbolo.lexema] =
                definicaoClasse;
        }

        return new ModuloDeclaracoes(
            simboloFechamento.linha,
            simboloFechamento.hashArquivo,
            resultadoAvaliacaoSintaticaModulo.declaracoes
        );
    }

    /**
     * No modo LAIR, a pilha de escopos não deve ser reinicializada a cada execução.
     * @returns Nada.
     */
    protected override inicializarPilhaEscopos(): void {
        if (this.modoLair && !this.pilhaEscopos.eVazio()) {
            return;
        }

        super.inicializarPilhaEscopos();
    }

    override analisar(
        retornoLexador: RetornoLexador<SimboloInterface>,
        hashArquivo: number,
        arquivosImportados?: string[]
    ): RetornoAvaliadorSintatico<Declaracao> {
        this.arquivosImportados = arquivosImportados || [];
        
        return super.analisar(retornoLexador, hashArquivo);
    }
}
