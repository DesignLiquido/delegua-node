import * as caminho from 'path';

import { lerDelprops } from './leitor-delprops';

export type TipoReportador = 'texto' | 'texto-sumario' | 'lcov' | 'sumario-json';

export interface ConfiguracaoTestes {
    cobertura: {
        reportadores: TipoReportador[];
    };
}

const REPORTADORES_PADRAO: TipoReportador[] = ['texto'];

export function carregarConfiguracaoTestes(diretorioBase: string): ConfiguracaoTestes {
    const caminhoArquivo = caminho.join(diretorioBase, 'configuracao.delprops');
    const props = lerDelprops(caminhoArquivo);

    const valorReportadores = props.get('testes.cobertura.reportadores');
    const reportadores: TipoReportador[] = valorReportadores
        ? valorReportadores
              .split(',')
              .map((r) => r.trim() as TipoReportador)
              .filter(Boolean)
        : REPORTADORES_PADRAO;

    return { cobertura: { reportadores } };
}
