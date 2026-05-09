import { SimboloInterface } from '@designliquido/delegua/interfaces';

import { ImportadorInterface } from '../interfaces/importador-interface';
import { InterpretadorComImportacao } from './interpretador-com-importacao';
import { DadosCobertura, TipoRamo } from '../interfaces/cobertura';

export class InterpretadorComCobertura extends InterpretadorComImportacao {
    readonly cobertura: DadosCobertura = {
        ramos: [],
        linhasExpressoes: new Set(),
    };

    constructor(
        importador: ImportadorInterface<SimboloInterface>,
        diretorioBase: string,
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        super(importador, diretorioBase, false, funcaoDeRetorno, funcaoDeRetornoMesmaLinha);
    }

    protected override registrarRamo(
        _hashArquivo: number,
        linha: number,
        ramo: TipoRamo
    ): void {
        this.cobertura.ramos.push({ linha, ramo });
    }

    protected override registrarExpressao(_hashArquivo: number, linha: number): void {
        this.cobertura.linhasExpressoes.add(linha);
    }
}
