import { TipoReportador } from '../../configuracao/configuracao-testes';
import { ContextoRelatorio } from './contexto-relatorio';
import { relatarTexto } from './texto';
import { relatarTextoSumario } from './texto-sumario';
import { relatarLcov } from './lcov';
import { relatarSumarioJson } from './sumario-json';

export type FuncaoReportador = (contexto: ContextoRelatorio) => void | Promise<void>;

const MAPA_REPORTADORES: Record<TipoReportador, FuncaoReportador> = {
    'texto': relatarTexto,
    'texto-sumario': relatarTextoSumario,
    'lcov': relatarLcov,
    'sumario-json': relatarSumarioJson,
};

export function resolverReportadores(tipos: TipoReportador[]): FuncaoReportador[] {
    return tipos.map((tipo) => MAPA_REPORTADORES[tipo]).filter(Boolean);
}

export * from './contexto-relatorio';
