import { DeleguaModulo, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

function analisarArgumentosNomeados(argumentosRaw: string[]): { [chave: string]: string | boolean } {
    const nomeados: { [chave: string]: string | boolean } = {};
    let i = 0;
    while (i < argumentosRaw.length) {
        const arg = argumentosRaw[i];
        if (arg.startsWith('--')) {
            const semPrefixo = arg.slice(2);
            const indiceSinal = semPrefixo.indexOf('=');
            if (indiceSinal !== -1) {
                nomeados[semPrefixo.slice(0, indiceSinal)] = semPrefixo.slice(indiceSinal + 1);
            } else if (i + 1 < argumentosRaw.length && !argumentosRaw[i + 1].startsWith('-')) {
                nomeados[semPrefixo] = argumentosRaw[++i];
            } else {
                nomeados[semPrefixo] = true;
            }
        } else if (arg.startsWith('-') && arg.length === 2) {
            const chave = arg.slice(1);
            if (i + 1 < argumentosRaw.length && !argumentosRaw[i + 1].startsWith('-')) {
                nomeados[chave] = argumentosRaw[++i];
            } else {
                nomeados[chave] = true;
            }
        }
        i++;
    }
    return nomeados;
}

export function criarModuloArgumentos(argumentosRaw: string[]): DeleguaModulo {
    const nomeados = analisarArgumentosNomeados(argumentosRaw);

    const modulo = new DeleguaModulo('argumentos');

    modulo.componentes['argumentos'] = [...argumentosRaw] as any;
    modulo.componentes['argumentosNomeados'] = { ...nomeados } as any;
    modulo.componentes['quantidade'] = argumentosRaw.length as any;

    modulo.componentes['temArgumento'] = new FuncaoPadrao(
        1,
        async (_interpretador: any, nome: string) => nome in nomeados
    );

    modulo.componentes['obterArgumento'] = new FuncaoPadrao(
        2,
        async (_interpretador: any, nome: string, padrao: any = null) =>
            nome in nomeados ? nomeados[nome] : padrao
    );

    return modulo;
}
