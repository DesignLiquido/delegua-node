import { InterpretadorComDepuracao } from "@designliquido/delegua/interpretador/depuracao";
import { ResultadoParcialInterpretadorInterface, SimboloInterface } from '@designliquido/delegua/interfaces';
import { Const, Declaracao, FuncaoDeclaracao } from "@designliquido/delegua/declaracoes";
import { DescritorTipoClasse } from "@designliquido/delegua/interpretador/estruturas";
import { inferirTipoVariavel } from "@designliquido/delegua/inferenciador";

import { ImportadorInterface } from "../interfaces";
import { ModuloDeclaracoes } from '../declaracoes';
import { InterpretadorComImportacaoInterface } from '../interfaces/interpretador-com-importacao-interface';
import { ImportarBiblioteca } from '../construtos';

import * as comum from './comum';
import { AcessoMetodoOuPropriedade } from "@designliquido/delegua/construtos";

export class InterpretadorComDepuracaoImportacao 
    extends InterpretadorComDepuracao 
    implements InterpretadorComImportacaoInterface
{
    importador: ImportadorInterface<SimboloInterface>;

    constructor(
        importador: ImportadorInterface<SimboloInterface>,
        diretorioBase: string, 
        funcaoDeRetorno: Function, 
        funcaoDeRetornoMesmaLinha: Function) 
    {
        super(diretorioBase, funcaoDeRetorno, funcaoDeRetornoMesmaLinha);
        this.importador = importador;
    }

    /**
     * Efetivamente executa uma declaração.
     * Reintroduzido aqui porque o método `executar()` não está obedecendo à herança como deveria.
     * 
     * TODO: Remover após resolver o problema com a herança. 
     *
     * @param declaracao A declaração a ser executada.
     * @returns O resultado parcial da execução, normalmente usado por
     *          ferramentas externas.
     */
    override async executar(declaracao: Declaracao): Promise<ResultadoParcialInterpretadorInterface> {
        const resultado: any = await declaracao.aceitar(this);

        // Alguns casos não possuem retorno, como declarações `se`, `enquanto`, etc.,
        // que não satisfazem suas respectivas condições.
        if (resultado === null || resultado === undefined) {
            return null;
        }

        // Se o retorno já possui um `valorRetornado`, apenas retorna o resultado.
        if (resultado.hasOwnProperty('valorRetornado')) {
            return resultado;
        }

        let tipoResultado = resultado.tipo;
        switch (resultado.constructor) {
            case DescritorTipoClasse:
                tipoResultado = resultado.simboloOriginal.lexema;
                break;
            default:
                if (!tipoResultado) {
                    tipoResultado = inferirTipoVariavel(resultado);
                }
                break;
        }

        return {
            hashArquivo: declaracao.hashArquivo,
            linha: declaracao.linha,
            valorRetornado: resultado,
            tipo: tipoResultado,
        } as ResultadoParcialInterpretadorInterface;
    }

    async visitarConstrutoImportarBiblioteca(importarBiblioteca: ImportarBiblioteca) {
        return comum.visitarConstrutoImportarBiblioteca(this, importarBiblioteca);
    }

    override visitarDeclaracaoConst(declaracao: Const): Promise<any> {
        return comum.visitarDeclaracaoConst(this, declaracao);
    }

    override visitarDeclaracaoDefinicaoFuncao(funcaoDeclaracao: FuncaoDeclaracao) {
        return comum.visitarDeclaracaoDefinicaoFuncao(this, funcaoDeclaracao);
    }

    async visitarDeclaracaoModuloDeclaracoes(declaracao: ModuloDeclaracoes) {
        return comum.visitarDeclaracaoModuloDeclaracoes(this, declaracao);
    }

    // TODO: Passar lógica para o núcleo e apagar.
    override async visitarExpressaoAcessoMetodoOuPropriedade(expressao: AcessoMetodoOuPropriedade) {
        return comum.visitarExpressaoAcessoMetodoOuPropriedade(this, expressao);
    }
}
