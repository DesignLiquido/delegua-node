import * as fs from 'fs';
import * as caminho from 'path';

import { EntradaRamo } from '../../interfaces/cobertura';
import { ContextoRelatorio } from './contexto-relatorio';

function ramoParaNumero(ramo: EntradaRamo['ramo']): number {
    const mapa: Record<EntradaRamo['ramo'], number> = {
        'verdadeiro': 0,
        'falso': 1,
        'senao': 2,
        'caso-padrao': 0,
        'iteracao': 0,
    };
    return mapa[ramo];
}

export function relatarLcov({ resultadosPorArquivo, diretorioBase }: ContextoRelatorio): void {
    const arquivosComCobertura = resultadosPorArquivo.filter((r) => !r.erroCarga);
    if (arquivosComCobertura.length === 0) return;

    const linhas: string[] = [];

    for (const r of arquivosComCobertura) {
        linhas.push('TN:');
        linhas.push(`SF:${r.caminhoRelativo}`);

        const linhasOrdenadas = [...r.cobertura.linhasExpressoes].sort((a, b) => a - b);
        for (const linha of linhasOrdenadas) {
            linhas.push(`DA:${linha},1`);
        }

        const ramosPorLinha = new Map<number, EntradaRamo[]>();
        for (const entrada of r.cobertura.ramos) {
            if (!ramosPorLinha.has(entrada.linha)) ramosPorLinha.set(entrada.linha, []);
            ramosPorLinha.get(entrada.linha)!.push(entrada);
        }

        let totalRamos = 0;
        for (const [linha, entradas] of ramosPorLinha) {
            for (const entrada of entradas) {
                linhas.push(`BRDA:${linha},${linha},${ramoParaNumero(entrada.ramo)},1`);
                totalRamos++;
            }
        }

        linhas.push(`BRH:${totalRamos}`);
        linhas.push(`BRF:${totalRamos}`);
        linhas.push(`LH:${linhasOrdenadas.length}`);
        linhas.push(`LF:${linhasOrdenadas.length}`);
        linhas.push('end_of_record');
    }

    const diretorioCoverage = caminho.join(diretorioBase, 'coverage');
    fs.mkdirSync(diretorioCoverage, { recursive: true });
    const destino = caminho.join(diretorioCoverage, 'lcov.info');
    fs.writeFileSync(destino, linhas.join('\n') + '\n', 'utf-8');
    console.log(`\nCobertura LCOV gravada em: ${destino}`);
}
