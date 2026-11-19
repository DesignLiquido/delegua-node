import * as koffi from 'koffi';

import { DeleguaModulo, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

/**
 * Módulo `memoria`: memória bruta para FFI (parâmetros de saída, buffers, campos C).
 * Mesma interface do módulo `memoria` do delegua-llvm. Deslocamentos em bytes.
 *
 * Ponteiros são os endereços usados pelo koffi (BigInt); `nulo` é o ponteiro NULL. Podem
 * ser passados a funções de `classe estrangeira` com parâmetros do tipo `ponteiro`.
 *
 *   var memoria = importar("memoria")
 *   var saida = memoria.alocar(memoria.tamanhoPonteiro())   // void** para T** saida
 *   Biblioteca.criar(saida)
 *   var objeto = memoria.lerPonteiro(saida, 0)
 *   memoria.liberar(saida)
 */

type Ponteiro = bigint | null;

function ehPonteiro(valor: any): valor is bigint {
    return typeof valor === 'bigint' && valor !== BigInt(0);
}

function bytesDe(ponteiro: bigint, quantidade: number): Uint8Array {
    return new Uint8Array(koffi.view(ponteiro as any, quantidade));
}

export function criarModuloMemoria(): DeleguaModulo {
    const modulo = new DeleguaModulo('memoria');

    const ler = (tipo: string) => async (_interpretador: any, base: Ponteiro, deslocamento: number) => {
        if (!ehPonteiro(base)) return tipo === 'void *' ? null : 0;
        const valor = koffi.decode(base as any, Number(deslocamento ?? 0), tipo);
        if (tipo === 'void *') return valor ?? null;
        return typeof valor === 'bigint' ? Number(valor) : valor;
    };

    const escrever = (tipo: string, converter: (valor: any) => any) =>
        async (_interpretador: any, base: Ponteiro, deslocamento: number, valor: any) => {
            if (!ehPonteiro(base)) return;
            koffi.encode(base as any, Number(deslocamento ?? 0), tipo, converter(valor));
        };

    const textoDe = (ponteiro: Ponteiro, quantidade: number = -1): string | null => {
        if (!ehPonteiro(ponteiro)) return null;
        return koffi.decode(ponteiro as any, 0, 'char', quantidade);
    };

    const funcoes: { [nome: string]: [number, (...args: any[]) => any] } = {
        alocar: [
            1,
            async (_interpretador: any, bytes: number) => {
                const quantidade = Number(bytes);
                if (!(quantidade > 0)) return null;
                const ponteiro = koffi.alloc('uint8_t', quantidade) as unknown as bigint;
                bytesDe(ponteiro, quantidade).fill(0);
                return ponteiro;
            },
        ],
        liberar: [
            1,
            async (_interpretador: any, ponteiro: Ponteiro) => {
                if (ehPonteiro(ponteiro)) koffi.free(ponteiro as any);
            },
        ],
        tamanhoPonteiro: [0, async () => koffi.sizeof('void *')],
        deslocar: [
            2,
            async (_interpretador: any, ponteiro: Ponteiro, bytes: number) =>
                ehPonteiro(ponteiro) ? ponteiro + BigInt(Math.trunc(Number(bytes ?? 0))) : null,
        ],
        copiar: [
            3,
            async (_interpretador: any, destino: Ponteiro, origem: Ponteiro, bytes: number) => {
                const quantidade = Number(bytes);
                if (!ehPonteiro(destino) || !ehPonteiro(origem) || !(quantidade > 0)) return;
                // slice(): copia antes de escrever, como memmove (áreas podem se sobrepor).
                bytesDe(destino, quantidade).set(bytesDe(origem, quantidade).slice());
            },
        ],

        lerPonteiro: [2, ler('void *')],
        lerInteiro: [2, ler('int32_t')],
        lerLongo: [2, ler('int64_t')],
        lerNumero: [2, ler('double')],
        lerByte: [2, ler('uint8_t')],
        lerTexto: [
            2,
            async (_interpretador: any, base: Ponteiro, deslocamento: number) => {
                if (!ehPonteiro(base)) return null;
                return textoDe(koffi.decode(base as any, Number(deslocamento ?? 0), 'void *') as Ponteiro);
            },
        ],

        escreverPonteiro: [3, escrever('void *', (valor) => (ehPonteiro(valor) ? valor : null))],
        escreverInteiro: [3, escrever('int32_t', (valor) => Math.trunc(Number(valor ?? 0)) | 0)],
        escreverLongo: [3, escrever('int64_t', (valor) => BigInt(Math.trunc(Number(valor ?? 0))))],
        escreverNumero: [3, escrever('double', (valor) => Number(valor ?? 0))],
        escreverByte: [3, escrever('uint8_t', (valor) => Math.trunc(Number(valor ?? 0)) & 0xff)],

        textoDe: [1, async (_interpretador: any, ponteiro: Ponteiro) => textoDe(ponteiro)],
        textoDeTamanho: [
            2,
            async (_interpretador: any, ponteiro: Ponteiro, bytes: number) => {
                const quantidade = Number(bytes);
                if (!(quantidade >= 0)) return null;
                if (!ehPonteiro(ponteiro)) return null;
                // Como em C, o texto termina no primeiro byte nulo.
                const conteudo = Buffer.from(bytesDe(ponteiro, quantidade));
                const fim = conteudo.indexOf(0);
                return (fim >= 0 ? conteudo.subarray(0, fim) : conteudo).toString('utf-8');
            },
        ],
    };

    for (const [nome, [aridade, funcao]] of Object.entries(funcoes)) {
        modulo.componentes[nome] = new FuncaoPadrao(aridade, funcao);
    }
    return modulo;
}
