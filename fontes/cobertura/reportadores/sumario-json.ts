import * as fs from 'fs';
import * as caminho from 'path';

import { ContextoRelatorio } from './contexto-relatorio';

export function relatarSumarioJson({ resultadosPorArquivo, diretorioBase }: ContextoRelatorio): void {
    const arquivosComCobertura = resultadosPorArquivo.filter((r) => !r.erroCarga);
    if (arquivosComCobertura.length === 0) return;

    const sumario = {
        arquivos: arquivosComCobertura.map((r) => ({
            arquivo: r.caminhoRelativo,
            linhasAtingidas: [...r.cobertura.linhasExpressoes].sort((a, b) => a - b),
            ramos: r.cobertura.ramos.map((e) => ({ linha: e.linha, ramo: e.ramo })),
        })),
    };

    const diretorioCoverage = caminho.join(diretorioBase, 'coverage');
    fs.mkdirSync(diretorioCoverage, { recursive: true });
    const destino = caminho.join(diretorioCoverage, 'cobertura-sumario.json');
    fs.writeFileSync(destino, JSON.stringify(sumario, null, 2), 'utf-8');
    console.log(`\nSumário JSON gravado em: ${destino}`);
}
