import chalk from 'chalk';

import { DadosCobertura } from '../../interfaces/cobertura';
import { ContextoRelatorio } from './contexto-relatorio';

const SEPARADOR = '='.repeat(70);

function formatarLinhas(cobertura: DadosCobertura): string {
    if (cobertura.linhasExpressoes.size === 0) return chalk.dim('nenhuma');
    return [...cobertura.linhasExpressoes].sort((a, b) => a - b).join(', ');
}

function formatarRamos(cobertura: DadosCobertura): string {
    if (cobertura.ramos.length === 0) return chalk.dim('nenhum');
    const contagem = new Map<string, number>();
    for (const { ramo } of cobertura.ramos) {
        contagem.set(ramo, (contagem.get(ramo) ?? 0) + 1);
    }
    return [...contagem.entries()]
        .map(([ramo, n]) => `${ramo}×${n}`)
        .join('  ');
}

export function relatarTexto({ resultadosPorArquivo }: ContextoRelatorio): void {
    const arquivosComCobertura = resultadosPorArquivo.filter((r) => !r.erroCarga);
    if (arquivosComCobertura.length === 0) return;

    console.log('\n' + SEPARADOR);
    console.log(chalk.bold('COBERTURA'));
    console.log(SEPARADOR);

    for (const r of arquivosComCobertura) {
        console.log(chalk.dim(`\n  ${r.caminhoRelativo}`));
        console.log(`    Linhas: ${formatarLinhas(r.cobertura)}`);
        console.log(`    Ramos:  ${formatarRamos(r.cobertura)}`);
    }
}
