import { InterpretadorComDepuracao } from "@designliquido/delegua/interpretador/depuracao";
import { SimboloInterface } from '@designliquido/delegua/interfaces';
import { FuncaoDeclaracao } from "@designliquido/delegua/declaracoes";

import { ImportadorInterface } from "../interfaces";
import { ModuloDeclaracoes } from '../declaracoes';
import { InterpretadorComImportacaoInterface } from '../interfaces/interpretador-com-importacao-interface';
import { ImportarBiblioteca } from '../construtos';

import * as comum from './comum';

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

    async visitarConstrutoImportarBiblioteca(importarBiblioteca: ImportarBiblioteca) {
        return comum.visitarConstrutoImportarBiblioteca(this, importarBiblioteca);
    }

    override visitarDeclaracaoDefinicaoFuncao(funcaoDeclaracao: FuncaoDeclaracao) {
        return comum.visitarDeclaracaoDefinicaoFuncao(this, funcaoDeclaracao);
    }

    async visitarDeclaracaoModuloDeclaracoes(declaracao: ModuloDeclaracoes) {
        return comum.visitarDeclaracaoModuloDeclaracoes(this, declaracao);
    }
}
