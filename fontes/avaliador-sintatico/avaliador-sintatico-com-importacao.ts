import {
    AcessoMetodo,
    AvaliadorSintatico,
    Chamada,
    Classe,
    Construto,
    Declaracao,
    Literal,
    RetornoAvaliadorSintatico,
    RetornoLexador,
    SimboloInterface
} from "@designliquido/delegua";

import tiposDeSimbolos from "@designliquido/delegua/tipos-de-simbolos/delegua";

import { ImportadorInterface } from "../interfaces";
import { ModuloDeclaracoes } from "../declaracoes";
import { ImportarBiblioteca } from "../construtos";
import { carregarBibliotecaDelegua, verificarModulosDelegua } from "fontes/mecanismo-importacao-bibliotecas";
import { InformacaoVariavelOuConstante } from "@designliquido/delegua/informacao-variavel-ou-constante";


export class AvaliadorSintaticoComImportacao extends AvaliadorSintatico {
    importador: ImportadorInterface<SimboloInterface>;
    arquivosImportados: string[];
    modoLair: boolean;

    constructor(importador: ImportadorInterface<SimboloInterface>) {
        super();
        this.arquivosImportados = [];
        this.importador = importador;
    }

    override finalizarChamada(entidadeChamada: Construto, tipoPrimitiva?: string | undefined): Chamada {
        const chamadaResolvida = super.finalizarChamada(entidadeChamada, tipoPrimitiva);
        if (chamadaResolvida.entidadeChamada instanceof AcessoMetodo && chamadaResolvida.entidadeChamada.objeto.tipo === 'módulo') {
            // Espera-se que o módulo esteja devidamente registrado.
            const entidadeChamadaResolvida = chamadaResolvida.entidadeChamada as AcessoMetodo;
            const objetoEntidadeChamada = (entidadeChamadaResolvida.objeto as any);
            if (objetoEntidadeChamada && objetoEntidadeChamada.simbolo.lexema in this.primitivasConhecidas) {
                const moduloCorrespondente = this.primitivasConhecidas[objetoEntidadeChamada.simbolo.lexema];
                if (entidadeChamadaResolvida.nomeMetodo in moduloCorrespondente) {
                    chamadaResolvida.tipo = moduloCorrespondente[entidadeChamadaResolvida.nomeMetodo].tipo;
                }
            }
        }

        return chamadaResolvida;
    }

    protected importarBibliotecaNode(literalCaminho: Literal): ImportarBiblioteca {
        const bibliotecaResolvida = verificarModulosDelegua(literalCaminho.valor);
        if (bibliotecaResolvida) {
            const moduloResolvido = carregarBibliotecaDelegua(bibliotecaResolvida as string);

            this.primitivasConhecidas[literalCaminho.valor] = {};
            for (const [nomeComponente, dadosComponente] of Object.entries(moduloResolvido.componentes)) {
                // TODO: Tipar isso corretamente na próxima versão do núcleo.
                const dadosComponenteResolvido = dadosComponente as any;
                const componente = new InformacaoVariavelOuConstante(
                    nomeComponente, 
                    dadosComponenteResolvido.tipoRetorno, 
                    []
                );

                for (const argumento of dadosComponenteResolvido.argumentos) {
                    componente.argumentos.push(new InformacaoVariavelOuConstante(argumento.nome, argumento.tipo));
                }

                this.primitivasConhecidas[literalCaminho.valor][nomeComponente] = componente;
            }
        }

        return new ImportarBiblioteca(
            literalCaminho.hashArquivo,
            literalCaminho.linha,
            literalCaminho.valor
        );
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
            return this.importarBibliotecaNode(literalCaminho);
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
