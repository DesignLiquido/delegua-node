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

    override async declaracaoImportar(): Promise<any> {
        this.consumir(
            tiposDeSimbolos.PARENTESE_ESQUERDO,
            "Esperado '(' após declaração."
        );
        const caminho = await this.expressao();
        const simboloFechamento = this.consumir(
            tiposDeSimbolos.PARENTESE_DIREITO,
            "Esperado ')' após declaração."
        );

        // Chegando aqui sem erros, a importação é sintaticamente válida.
        const literalCaminho = caminho as Literal;
        const caminhoTexto = String(literalCaminho.valor);
        if (!caminhoTexto.endsWith('.delegua')) {
            return new ImportarBiblioteca(
                literalCaminho.hashArquivo,
                literalCaminho.linha,
                caminhoTexto
            );
        }

        const resultadoImportacao = this.importador.importar(
            caminhoTexto,
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
            await avaliadorSintaticoModulo.analisar(
                resultadoImportacao.retornoLexador,
                resultadoImportacao.hashArquivo,
                this.arquivosImportados
            );

        this.arquivosImportados.push(caminhoTexto);

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

    override async analisar(
        retornoLexador: RetornoLexador<SimboloInterface>,
        hashArquivo: number,
        arquivosImportados?: string[]
    ): Promise<RetornoAvaliadorSintatico<Declaracao>> {
        this.arquivosImportados = arquivosImportados || [];
        
        return super.analisar(retornoLexador, hashArquivo);
    }
}
