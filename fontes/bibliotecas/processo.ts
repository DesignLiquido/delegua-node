import * as processoFilho from 'child_process';
import * as caminho from 'path';
import * as sistemaArquivos from 'fs';

import { DeleguaModulo, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

/**
 * Módulo `processo`: informações e controle do processo atual e execução de programas.
 * Mesma interface do módulo `processo` do delegua-llvm.
 *
 *   var processo = importar("processo")
 *   processo.sair(1)
 *   processo.escreverErro("falhou")
 *   processo.sistemaOperacional()           // "windows" | "darwin" | "linux" | ...
 *   processo.arquitetura()                  // "amd64" | "arm64" | ...
 *   processo.variavelAmbiente("HOME")       // texto ou nulo
 *   processo.executar("git", ["status"], "./repo")             // código de saída
 *   processo.executarCapturando("git", ["rev-parse", "HEAD"])  // stdout
 *   processo.ultimoCodigoSaida()
 */

export function nomeSistemaOperacional(plataforma: string = process.platform): string {
    switch (plataforma) {
        case 'win32':
            return 'windows';
        case 'darwin':
        case 'linux':
        case 'freebsd':
            return plataforma;
        default:
            return 'desconhecido';
    }
}

export function nomeArquitetura(arquitetura: string = process.arch): string {
    switch (arquitetura) {
        case 'x64':
            return 'amd64';
        case 'arm64':
            return 'arm64';
        case 'ia32':
            return '386';
        case 'arm':
            return 'arm';
        case 'riscv64':
            return 'riscv64';
        default:
            return 'desconhecida';
    }
}

/**
 * Acrescenta um argumento à linha de comando seguindo as regras de CommandLineToArgvW /
 * do CRT da Microsoft (aspas quando necessário; barras invertidas duplicadas antes de aspas).
 */
export function citarArgumentoWindows(argumento: string): string {
    if (argumento.length > 0 && !/[ \t\n\v"]/.test(argumento)) return argumento;
    let resultado = '"';
    let barras = 0;
    for (const caractere of argumento) {
        if (caractere === '\\') {
            barras++;
            continue;
        }
        if (caractere === '"') {
            resultado += '\\'.repeat(barras * 2 + 1) + '"';
        } else {
            resultado += '\\'.repeat(barras) + caractere;
        }
        barras = 0;
    }
    return resultado + '\\'.repeat(barras * 2) + '"';
}

/**
 * Localiza o programa no PATH testando as extensões usuais do Windows (programa.exe,
 * programa.cmd...), para que `executar("npm", ...)` funcione como em sistemas Unix.
 */
export function resolverProgramaWindows(
    programa: string,
    caminhoSistema: string = process.env.PATH ?? process.env.Path ?? '',
    existe: (arquivo: string) => boolean = (arquivo) => sistemaArquivos.existsSync(arquivo)
): string {
    if (/[\\/]/.test(programa) || caminho.extname(programa)) return programa;
    for (const diretorio of caminhoSistema.split(';').filter(Boolean)) {
        for (const extensao of ['.exe', '.cmd', '.bat', '.com']) {
            const candidato = caminho.join(diretorio, programa + extensao);
            if (existe(candidato)) return candidato;
        }
    }
    return programa;
}

interface ComandoPreparado {
    programa: string;
    argumentos: string[];
    opcoes: processoFilho.SpawnSyncOptions;
}

/**
 * Prepara a execução sem shell. No Windows, arquivos de lote (.cmd/.bat) só podem ser
 * executados pelo cmd.exe, que expande %VAR% e trata aspas de forma própria: argumentos
 * com esses caracteres são recusados, para evitar injeção de comandos.
 */
export function prepararExecucao(
    programa: string,
    argumentos: string[],
    diretorio: string | null,
    plataforma: string = process.platform,
    resolver: (programa: string) => string = (p) => resolverProgramaWindows(p)
): ComandoPreparado {
    const opcoes: processoFilho.SpawnSyncOptions = { cwd: diretorio || undefined, shell: false };
    if (plataforma !== 'win32') {
        return { programa, argumentos, opcoes };
    }

    const resolvido = resolver(programa);
    if (!/\.(cmd|bat)$/i.test(resolvido)) {
        return { programa: resolvido, argumentos, opcoes };
    }
    for (const argumento of argumentos) {
        if (/[%"\r\n]/.test(argumento)) {
            throw new Error(`argumento inseguro para arquivo de lote: ${argumento}`);
        }
    }
    const linha = [resolvido, ...argumentos].map(citarArgumentoWindows).join(' ');
    return {
        programa: process.env.ComSpec || 'cmd.exe',
        argumentos: ['/d', '/s', '/c', `"${linha}"`],
        opcoes: { ...opcoes, windowsVerbatimArguments: true },
    };
}

export function criarModuloProcesso(): DeleguaModulo {
    const modulo = new DeleguaModulo('processo');
    let ultimoCodigoSaida = 0;

    const executar = (programa: string, argumentos: any, diretorio: string | null, capturar: boolean): string | number => {
        const listaArgumentos: string[] = Array.isArray(argumentos) ? argumentos.map((a) => String(a ?? '')) : [];
        if (!programa) {
            ultimoCodigoSaida = -1;
            return capturar ? '' : -1;
        }
        let comando: ComandoPreparado;
        try {
            comando = prepararExecucao(String(programa), listaArgumentos, diretorio);
        } catch (erro: any) {
            process.stderr.write(`[DELEGUA ERRO] processo.executar: ${erro.message}\n`);
            ultimoCodigoSaida = -1;
            return capturar ? '' : -1;
        }
        const resultado = processoFilho.spawnSync(comando.programa, comando.argumentos, {
            ...comando.opcoes,
            stdio: capturar ? ['inherit', 'pipe', 'inherit'] : 'inherit',
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024 * 1024,
        });
        ultimoCodigoSaida = resultado.error || resultado.status === null ? -1 : resultado.status;
        if (resultado.status === null && resultado.signal) {
            // Encerrado por sinal: mesma convenção dos shells (128 + número do sinal).
            const numero = (require('os').constants.signals as any)[resultado.signal];
            if (numero) ultimoCodigoSaida = 128 + numero;
        }
        return capturar ? String(resultado.stdout ?? '') : ultimoCodigoSaida;
    };

    const funcoes: { [nome: string]: [number, (...args: any[]) => any] } = {
        sair: [
            1,
            async (_interpretador: any, codigo: number) => {
                // Garante que o que já foi escrito chegue ao destino antes de encerrar.
                await new Promise<void>((resolver) => process.stdout.write('', () => resolver()));
                await new Promise<void>((resolver) => process.stderr.write('', () => resolver()));
                process.exit(Number(codigo ?? 0));
            },
        ],
        escreverErro: [
            1,
            async (_interpretador: any, texto: string) => {
                process.stderr.write(`${texto ?? ''}\n`);
            },
        ],
        sistemaOperacional: [0, async () => nomeSistemaOperacional()],
        arquitetura: [0, async () => nomeArquitetura()],
        variavelAmbiente: [1, async (_interpretador: any, nome: string) => (nome ? process.env[nome] ?? null : null)],
        definirVariavelAmbiente: [
            2,
            async (_interpretador: any, nome: string, valor: string) => {
                if (!nome) return false;
                process.env[nome] = valor ?? '';
                return true;
            },
        ],
        executar: [
            3,
            async (_interpretador: any, programa: string, argumentos: any, diretorio: string) =>
                executar(programa, argumentos, diretorio, false),
        ],
        executarCapturando: [
            3,
            async (_interpretador: any, programa: string, argumentos: any, diretorio: string) =>
                executar(programa, argumentos, diretorio, true),
        ],
        ultimoCodigoSaida: [0, async () => ultimoCodigoSaida],
    };

    for (const [nome, [aridade, funcao]] of Object.entries(funcoes)) {
        modulo.componentes[nome] = new FuncaoPadrao(aridade, funcao);
    }
    return modulo;
}
