import {
    AcessoMetodo,
    AcessoMetodoOuPropriedade,
    AcessoPropriedade,
    AvaliadorSintatico,
    Chamada,
    Classe,
    Construto,
    Declaracao,
    ErroAvaliadorSintatico,
    Literal,
    ReferenciaFuncao,
    RetornoAvaliadorSintatico,
    RetornoLexador,
    SimboloInterface,
    Variavel,
} from "@designliquido/delegua";

import tiposDeSimbolos from "@designliquido/delegua/tipos-de-simbolos/delegua";
import tipoDeDadosDelegua from '@designliquido/delegua/tipos-de-dados/delegua';

import primitivasDicionario from '@designliquido/delegua/bibliotecas/primitivas-dicionario';
import primitivasNumero from '@designliquido/delegua/bibliotecas/primitivas-numero';
import primitivasTexto from '@designliquido/delegua/bibliotecas/primitivas-texto';
import primitivasVetor from '@designliquido/delegua/bibliotecas/primitivas-vetor';

import { ImportadorInterface } from "../interfaces";
import { ModuloDeclaracoes } from "../declaracoes";
import { ImportarBiblioteca } from "../construtos";


export class AvaliadorSintaticoComImportacao extends AvaliadorSintatico {
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

        const avaliadorSintaticoModulo = new AvaliadorSintaticoComImportacao(
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
                (d) => d.constructor.name === "Classe"
            ) as Classe[];

        for (const definicaoClasse of definicoesClasse) {
            this.tiposDefinidosEmCodigo[definicaoClasse.simbolo.lexema] =
                definicaoClasse;
        }

        return new ModuloDeclaracoes(
            simboloFechamento.linha,
            simboloFechamento.hashArquivo,
            [],
            resultadoAvaliacaoSintaticaModulo.declaracoes
        );
    }

    // TODO: Remover ao implementar módulo no núcleo.
    override resolverEntidadeChamadaAcessoMetodoOuPropriedade(
        entidadeChamadaResolvida: AcessoMetodoOuPropriedade
    ): Construto {
        const construtoTipado: AcessoMetodoOuPropriedade =
            entidadeChamadaResolvida;
        switch (entidadeChamadaResolvida.tipo) {
            case tipoDeDadosDelegua.DICIONARIO:
            case tipoDeDadosDelegua.DICIONÁRIO:
                if (!(construtoTipado.simbolo.lexema in primitivasDicionario)) {
                    throw this.erro(
                        construtoTipado.simbolo,
                        `${construtoTipado.simbolo.lexema} não é uma primitiva de dicionário.`
                    );
                }

                const primitivaDicionarioSelecionada =
                    primitivasDicionario[construtoTipado.simbolo.lexema];
                return new AcessoMetodo(
                    construtoTipado.hashArquivo,
                    construtoTipado.objeto,
                    construtoTipado.simbolo.lexema,
                    primitivaDicionarioSelecionada.tipoRetorno
                );

            case tipoDeDadosDelegua.INTEIRO:
            case tipoDeDadosDelegua.NUMERO:
            case tipoDeDadosDelegua.NÚMERO:
                if (!(construtoTipado.simbolo.lexema in primitivasNumero)) {
                    throw this.erro(
                        construtoTipado.simbolo,
                        `${construtoTipado.simbolo.lexema} não é uma primitiva de número.`
                    );
                }

                const primitivaNumeroSelecionada =
                    primitivasNumero[construtoTipado.simbolo.lexema];
                return new AcessoMetodo(
                    construtoTipado.hashArquivo,
                    construtoTipado.objeto,
                    construtoTipado.simbolo.lexema,
                    primitivaNumeroSelecionada.tipoRetorno
                );
            case 'modulo':
            case 'módulo':
                if (construtoTipado.simbolo.lexema in this.tiposDefinidosEmCodigo) {
                    // Construtor de classe.
                    return new Variavel(
                        construtoTipado.hashArquivo, 
                        construtoTipado.simbolo, 
                        construtoTipado.objeto.tipo
                    );
                }

                return new AcessoMetodo(
                    construtoTipado.hashArquivo, 
                    construtoTipado.objeto,
                    construtoTipado.simbolo.lexema,
                );
                
            case tipoDeDadosDelegua.TEXTO:
                if (!(construtoTipado.simbolo.lexema in primitivasTexto)) {
                    throw this.erro(
                        construtoTipado.simbolo,
                        `${construtoTipado.simbolo.lexema} não é uma primitiva de texto.`
                    );
                }

                const primitivaTextoSelecionada =
                    primitivasTexto[construtoTipado.simbolo.lexema];
                return new AcessoMetodo(
                    construtoTipado.hashArquivo,
                    construtoTipado.objeto,
                    construtoTipado.simbolo.lexema,
                    primitivaTextoSelecionada.tipoRetorno
                );
            case tipoDeDadosDelegua.VETOR:
            case tipoDeDadosDelegua.VETOR_NUMERO:
            case tipoDeDadosDelegua.VETOR_NÚMERO:
            case tipoDeDadosDelegua.VETOR_TEXTO:
                if (!(construtoTipado.simbolo.lexema in primitivasVetor)) {
                    throw this.erro(
                        construtoTipado.simbolo,
                        `${construtoTipado.simbolo.lexema} não é uma primitiva de vetor.`
                    );
                }

                const primitivaVetorSelecionada =
                    primitivasVetor[construtoTipado.simbolo.lexema];
                return new AcessoMetodo(
                    construtoTipado.hashArquivo,
                    construtoTipado.objeto,
                    construtoTipado.simbolo.lexema,
                    primitivaVetorSelecionada.tipoRetorno
                );
        }

        return entidadeChamadaResolvida;
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
