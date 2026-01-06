import { Ajuda, Const, Declaracao, FuncaoDeclaracao, Var } from '@designliquido/delegua/declaracoes';
import { SimboloInterface } from '@designliquido/delegua/interfaces';
import { Interpretador } from '@designliquido/delegua/interpretador';

import tipoDeDadosPrimitivos from '@designliquido/delegua/tipos-de-dados/primitivos';

import { InterpretadorComImportacaoInterface } from '../interfaces/interpretador-com-importacao-interface';
import { ImportadorInterface } from '../interfaces/importador-interface';
import { ImportarBiblioteca, ModuloDeclaracoes } from '../construtos';

import * as comum from './comum';

/**
 * O Interpretador visita todos os elementos complexos gerados pelo avaliador sintático (_parser_),
 * e de fato executa a lógica de programação descrita no código.
 */
export class InterpretadorComImportacao 
    extends Interpretador 
    implements InterpretadorComImportacaoInterface
{
    importador: ImportadorInterface<SimboloInterface>;

    constructor(
        importador: ImportadorInterface<SimboloInterface>,
        diretorioBase: string,
        performance = false,
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        super(diretorioBase, performance, funcaoDeRetorno, funcaoDeRetornoMesmaLinha);
        this.importador = importador;
    }

    override async executar(declaracao: Declaracao, mostrarResultado = false): Promise<any> {
        const resultado = await super.executar(declaracao);

        if (mostrarResultado) {
            this.funcaoDeRetorno(this.paraTexto(resultado));
        }

        if (resultado || typeof resultado === tipoDeDadosPrimitivos.BOOLEANO) {
            this.resultadoInterpretador.push(resultado);
        }

        return resultado;
    }

    async visitarConstrutoImportarBiblioteca(importarBiblioteca: ImportarBiblioteca) {
        return comum.visitarConstrutoImportarBiblioteca(this, importarBiblioteca);
    }

    override async visitarDeclaracaoVar(declaracao: Var): Promise<any> {
        // Chama o método da classe base para fazer a declaração
        await super.visitarDeclaracaoVar(declaracao);

        // Retorna o valor da variável para o modo LAIR
        return this.pilhaEscoposExecucao.obterValorVariavel(declaracao.simbolo);
    }

    override visitarDeclaracaoConst(declaracao: Const): Promise<any> {
        return comum.visitarDeclaracaoConst(this, declaracao);
    }

    override visitarDeclaracaoDefinicaoFuncao(funcaoDeclaracao: FuncaoDeclaracao) {
        return comum.visitarDeclaracaoDefinicaoFuncao(this, funcaoDeclaracao);
    }

    async visitarDeclaracaoModuloDeclaracoes(declaracao: ModuloDeclaracoes) {
        return comum.visitarExpressaoModuloDeclaracoes(this, declaracao);
    }

    /**
     * Override do método visitarDeclaracaoAjuda para suportar modo de ajuda interativo.
     * - Se chamado como função com argumentos: ajuda(topico) -> retorna ajuda sobre o tópico
     * - Se chamado sem argumentos: ajuda() -> entra no modo de ajuda interativo
     */
    override async visitarDeclaracaoAjuda(declaracao: Ajuda): Promise<any> {
        return comum.visitarDeclaracaoAjuda(this, declaracao);
    }
}
