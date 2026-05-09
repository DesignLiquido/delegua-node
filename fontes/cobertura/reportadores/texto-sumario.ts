import chalk from 'chalk';

import { ContextoRelatorio } from './contexto-relatorio';

const SEPARADOR = '='.repeat(70);

export function relatarTextoSumario({ resultadosPorArquivo }: ContextoRelatorio): void {
    const arquivosComCobertura = resultadosPorArquivo.filter((r) => !r.erroCarga);
    if (arquivosComCobertura.length === 0) return;

    let totalLinhas = 0;
    let totalRamos = 0;

    for (const r of arquivosComCobertura) {
        totalLinhas += r.cobertura.linhasExpressoes.size;
        totalRamos += r.cobertura.ramos.length;
    }

    const nArquivos = arquivosComCobertura.length;

    console.log('\n' + SEPARADOR);
    console.log(chalk.bold('COBERTURA — SUMÁRIO'));
    console.log(SEPARADOR);
    console.log(
        `  ${nArquivos} ${nArquivos === 1 ? 'arquivo' : 'arquivos'}: ` +
        chalk.green(`${totalLinhas} ${totalLinhas === 1 ? 'linha atingida' : 'linhas atingidas'}`) +
        ', ' +
        chalk.cyan(`${totalRamos} ${totalRamos === 1 ? 'ramo atingido' : 'ramos atingidos'}`)
    );
}
