import * as fs from 'fs';
import * as caminho from 'path';

import chalk from 'chalk';

import { ContextoRelatorio } from './contexto-relatorio';

const COL_PCT_PAD = 8;   // padStart width: 7 content + 1 leading space
const COL_UNCOV = 49;    // uncovered lines column content width

function lerLinhasExecutaveis(caminhoArquivo: string): Set<number> {
    try {
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
        const linhas = conteudo.split('\n');
        const executaveis = new Set<number>();
        for (let i = 0; i < linhas.length; i++) {
            const l = linhas[i].trim();
            if (l.length > 0 && !l.startsWith('//')) {
                executaveis.add(i + 1);
            }
        }
        return executaveis;
    } catch {
        return new Set();
    }
}

function comprimirLinhas(linhas: number[]): string {
    if (linhas.length === 0) return '';
    const sorted = linhas.slice().sort((a, b) => a - b);
    const partes: string[] = [];
    let inicio = sorted[0];
    let fim = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === fim + 1) {
            fim = sorted[i];
        } else {
            partes.push(inicio === fim ? `${inicio}` : `${inicio}-${fim}`);
            inicio = fim = sorted[i];
        }
    }
    partes.push(inicio === fim ? `${inicio}` : `${inicio}-${fim}`);
    return partes.join(',');
}

function truncarParaDireita(s: string, maxLen: number): string {
    if (s.length <= maxLen) return s;
    const cauda = s.slice(s.length - (maxLen - 4));
    const primeiraVirgula = cauda.indexOf(',');
    return primeiraVirgula > 0 ? '...' + cauda.slice(primeiraVirgula) : '...' + cauda;
}

function colorirPct(s: string, v: number | null): string {
    if (v === null) return chalk.dim(s);
    if (v >= 80) return chalk.green(s);
    if (v >= 50) return chalk.yellow(s);
    return chalk.red(s);
}

function celulaPct(valor: number | null): string {
    const s = valor === null ? '-' : valor.toFixed(2);
    const padded = s.padStart(COL_PCT_PAD);
    return colorirPct(padded, valor);
}

function celulaArquivo(nome: string, largura: number, dimmed: boolean): string {
    const padded = nome.padEnd(largura);
    return dimmed ? chalk.dim(padded) : padded;
}

function separador(larguraArquivo: number): string {
    const segPct = '-'.repeat(COL_PCT_PAD + 1);
    return (
        '-'.repeat(larguraArquivo + 1) +
        `|${segPct}`.repeat(4) +
        `|${'-'.repeat(COL_UNCOV + 1)}`
    );
}

function cabecalho(larguraArquivo: number): string {
    const headers = ['% Expr.', '% Ramos', '% Func.', '% Lin.'];
    const cols = headers.map((h) => `|${h.padStart(COL_PCT_PAD)} `).join('');
    return `${'Arquivo'.padEnd(larguraArquivo + 1)}${cols}| ${'Linhas Não Cobertas'.padEnd(COL_UNCOV - 1)}`;
}

function renderizarLinha(
    nome: string,
    larguraArquivo: number,
    pctExpr: number | null,
    pctRamo: number | null,
    pctFunc: number | null,
    pctLin: number | null,
    naoCobertas: string,
    dimNome = true
): string {
    const arquivo = celulaArquivo(nome, larguraArquivo + 1, dimNome);
    const p1 = celulaPct(pctExpr);
    const p2 = celulaPct(pctRamo);
    const p3 = celulaPct(pctFunc);
    const p4 = celulaPct(pctLin);
    const uncov = truncarParaDireita(naoCobertas, COL_UNCOV);
    return `${arquivo}|${p1} |${p2} |${p3} |${p4} | ${uncov}`;
}

export function relatarTexto({ resultadosPorArquivo, diretorioBase }: ContextoRelatorio): void {
    const arquivosComCobertura = resultadosPorArquivo.filter((r) => !r.erroCarga);
    if (arquivosComCobertura.length === 0) return;

    type Metrica = {
        nome: string;
        pctExpr: number | null;
        pctRamo: number | null;
        pctFunc: number | null;
        pctLin: number | null;
        naoCobertas: string;
    };

    const metricas: Metrica[] = [];
    let totalLinhasCobertas = 0;
    let totalLinhas = 0;
    let totalRamosCobertos = 0;
    let totalRamos = 0;
    let totalFuncoesCobertas = 0;
    let totalFuncoes = 0;

    for (const r of arquivosComCobertura) {
        const caminhoAbsoluto = caminho.join(diretorioBase, r.caminhoRelativo);
        const linhasExec = lerLinhasExecutaveis(caminhoAbsoluto);
        const cobertas = r.cobertura.linhasExpressoes;

        const cobertasValidas = [...cobertas].filter((l) => linhasExec.has(l));
        const naoCobertas = [...linhasExec].filter((l) => !cobertas.has(l));

        const totalLin = linhasExec.size;
        const cobertasCount = cobertasValidas.length;
        const pctLin = totalLin > 0 ? (cobertasCount / totalLin) * 100 : 100;

        const ramosCobertos = new Set(r.cobertura.ramos.map((e) => `${e.linha}:${e.ramo}`)).size;
        const pctRamo = r.cobertura.totalRamos > 0
            ? (ramosCobertos / r.cobertura.totalRamos) * 100
            : null;

        const pctFunc = r.cobertura.totalFuncoes > 0
            ? (r.cobertura.funcoesCobertas / r.cobertura.totalFuncoes) * 100
            : null;

        totalLinhasCobertas += cobertasCount;
        totalLinhas += totalLin;
        totalRamosCobertos += ramosCobertos;
        totalRamos += r.cobertura.totalRamos;
        totalFuncoesCobertas += r.cobertura.funcoesCobertas;
        totalFuncoes += r.cobertura.totalFuncoes;

        metricas.push({
            nome: r.caminhoRelativo,
            pctExpr: pctLin,
            pctRamo,
            pctFunc,
            pctLin,
            naoCobertas: comprimirLinhas(naoCobertas),
        });
    }

    const pctLinGlobal = totalLinhas > 0 ? (totalLinhasCobertas / totalLinhas) * 100 : 100;
    const pctRamoGlobal = totalRamos > 0 ? (totalRamosCobertos / totalRamos) * 100 : null;
    const pctFuncGlobal = totalFuncoes > 0 ? (totalFuncoesCobertas / totalFuncoes) * 100 : null;

    const larguraArquivo = Math.max(
        'Todos os arquivos'.length,
        ...metricas.map((m) => m.nome.length)
    ) + 1;

    const sep = separador(larguraArquivo);

    console.log('');
    console.log(sep);
    console.log(cabecalho(larguraArquivo));
    console.log(sep);
    console.log(
        renderizarLinha('Todos os arquivos', larguraArquivo, pctLinGlobal, pctRamoGlobal, pctFuncGlobal, pctLinGlobal, '', false)
    );
    console.log(sep);

    for (const m of metricas) {
        console.log(
            renderizarLinha(m.nome, larguraArquivo, m.pctExpr, m.pctRamo, m.pctFunc, m.pctLin, m.naoCobertas)
        );
    }

    console.log(sep);
}
