import { ImportadorInterface } from '../interfaces/importador-interface';

import { SimboloInterface } from '@designliquido/delegua/interfaces';
import { Interpretador } from '@designliquido/delegua/interpretador';
import { InterpretadorComImportacaoInterface } from '../interfaces/interpretador-com-importacao-interface';
import { ModuloDeclaracoes } from '../declaracoes';

import * as comum from './comum';
import { ImportarBiblioteca } from '../construtos';


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

    async visitarConstrutoImportarBiblioteca(importarBiblioteca: ImportarBiblioteca) {
        return comum.visitarConstrutoImportarBiblioteca(this, importarBiblioteca);
    }

    async visitarDeclaracaoModuloDeclaracoes(declaracao: ModuloDeclaracoes) {
        return comum.visitarDeclaracaoModuloDeclaracoes(this, declaracao);
    }
}
