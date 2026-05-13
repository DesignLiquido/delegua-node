export interface TotaisAst {
    totalRamos: number;
    totalFuncoes: number;
    funcoesCorpoLinhas: number[];
}

const IGNORAR_CHAVES = new Set(['simbolo', 'operador', 'hashArquivo']);

function passeiarGenerico(no: any, totais: TotaisAst, visitados: WeakSet<object>): void {
    for (const chave of Object.keys(no)) {
        if (IGNORAR_CHAVES.has(chave)) continue;
        const val = (no as any)[chave];
        if (Array.isArray(val)) {
            for (const item of val) passeiarNo(item, totais, visitados);
        } else if (val && typeof val === 'object') {
            passeiarNo(val, totais, visitados);
        }
    }
}

function passeiarNo(no: any, totais: TotaisAst, visitados: WeakSet<object>): void {
    if (!no || typeof no !== 'object' || visitados.has(no)) return;
    visitados.add(no);

    const nomeTipo: string = no.constructor?.name ?? '';

    switch (nomeTipo) {
        case 'Se': {
            totais.totalRamos += 2 + 2 * (no.caminhosSeSenao?.length ?? 0);
            passeiarNo(no.condicao, totais, visitados);
            passeiarNo(no.caminhoEntao, totais, visitados);
            for (const ss of no.caminhosSeSenao ?? []) {
                passeiarNo(ss.condicao, totais, visitados);
                passeiarNo(ss.caminho, totais, visitados);
            }
            if (no.caminhoSenao) passeiarNo(no.caminhoSenao, totais, visitados);
            break;
        }
        case 'Escolha': {
            totais.totalRamos += (no.caminhos?.length ?? 0) + (no.caminhoPadrao ? 1 : 0);
            passeiarNo(no.identificadorOuLiteral, totais, visitados);
            for (const c of no.caminhos ?? []) {
                for (const d of c.declaracoes ?? []) passeiarNo(d, totais, visitados);
            }
            if (no.caminhoPadrao) {
                for (const d of no.caminhoPadrao.declaracoes ?? []) passeiarNo(d, totais, visitados);
            }
            break;
        }
        case 'Tente': {
            totais.totalRamos += 2;
            for (const d of no.caminhoTente ?? []) passeiarNo(d, totais, visitados);
            if (Array.isArray(no.caminhoPegue)) {
                for (const d of no.caminhoPegue) passeiarNo(d, totais, visitados);
            } else {
                passeiarNo(no.caminhoPegue, totais, visitados);
            }
            for (const d of no.caminhoSenao ?? []) passeiarNo(d, totais, visitados);
            for (const d of no.caminhoFinalmente ?? []) passeiarNo(d, totais, visitados);
            break;
        }
        case 'Enquanto':
        case 'Para':
        case 'ParaCada':
        case 'Fazer': {
            totais.totalRamos += 2;
            passeiarGenerico(no, totais, visitados);
            break;
        }
        case 'FuncaoDeclaracao': {
            totais.totalFuncoes++;
            totais.funcoesCorpoLinhas.push(no.funcao?.corpo?.[0]?.linha ?? no.linha);
            for (const d of no.funcao?.corpo ?? []) passeiarNo(d, totais, visitados);
            for (const p of no.funcao?.parametros ?? []) {
                if (p.valorPadrao) passeiarNo(p.valorPadrao, totais, visitados);
            }
            break;
        }
        case 'FuncaoConstruto': {
            totais.totalFuncoes++;
            totais.funcoesCorpoLinhas.push(no.corpo?.[0]?.linha ?? no.linha);
            for (const d of no.corpo ?? []) passeiarNo(d, totais, visitados);
            break;
        }
        case 'Classe': {
            for (const m of no.metodos ?? []) passeiarNo(m, totais, visitados);
            for (const p of no.propriedades ?? []) passeiarGenerico(p, totais, visitados);
            break;
        }
        default: {
            passeiarGenerico(no, totais, visitados);
            break;
        }
    }
}

export function contarTotaisAst(declaracoes: any[]): TotaisAst {
    const totais: TotaisAst = { totalRamos: 0, totalFuncoes: 0, funcoesCorpoLinhas: [] };
    const visitados = new WeakSet<object>();
    for (const d of declaracoes) {
        passeiarNo(d, totais, visitados);
    }
    return totais;
}
