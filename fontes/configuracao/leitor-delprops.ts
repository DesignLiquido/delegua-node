import * as fs from 'fs';

export function lerDelprops(caminhoArquivo: string): Map<string, string> {
    const resultado = new Map<string, string>();
    if (!fs.existsSync(caminhoArquivo)) return resultado;

    const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
    for (const linha of conteudo.split(/\r?\n/)) {
        const trimada = linha.trim();
        if (!trimada || trimada.startsWith('//')) continue;

        const idx = trimada.indexOf('=');
        if (idx === -1) continue;

        const chave = trimada.substring(0, idx).trim();
        let valor = trimada.substring(idx + 1).trim();

        if (valor.startsWith("'") && valor.endsWith("'")) {
            valor = valor.slice(1, -1).trim();
        }

        resultado.set(chave, valor);
    }

    return resultado;
}
