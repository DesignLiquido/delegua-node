import * as fs from 'fs';
import * as net from 'net';

import { DeleguaModulo, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

/**
 * Módulo `rede`: soquetes TCP com tempo limite (em milissegundos; negativo = sem limite).
 * Mesma interface do módulo `rede` do delegua-llvm. Soquetes são valores opacos; `nulo`
 * indica falha, com o motivo em ultimoErro().
 *
 * O interpretador é assíncrono: cada chamada espera pelos eventos do soquete (conexão,
 * dados, fim) até o tempo limite, o que dá a mesma semântica bloqueante do delegua-llvm.
 */

const TEMPO_ESGOTADO = 'tempo esgotado';

/** Espera `evento` ou o tempo limite. Resolve com o resultado de `evento`, ou `undefined` no tempo esgotado. */
function comTempoLimite<T>(tempoLimiteMs: number, evento: (concluir: (valor: T) => void) => () => void): Promise<T | undefined> {
    return new Promise((resolver) => {
        let temporizador: NodeJS.Timeout | undefined;
        let concluido = false;
        let desinscrever: () => void = () => {};
        const concluir = (valor: T | undefined) => {
            if (concluido) return;
            concluido = true;
            if (temporizador) clearTimeout(temporizador);
            desinscrever();
            resolver(valor);
        };
        desinscrever = evento((valor) => concluir(valor));
        if (tempoLimiteMs >= 0 && !concluido) {
            temporizador = setTimeout(() => concluir(undefined), tempoLimiteMs);
        }
    });
}

/** Servidor: guarda as conexões que chegam até serem aceitas (já acumulando os dados recebidos). */
export class SoqueteServidor {
    pendentes: SoqueteConexao[] = [];
    private ouvintes: Array<() => void> = [];

    constructor(public servidor: net.Server) {
        servidor.on('connection', (socket) => {
            this.pendentes.push(new SoqueteConexao(socket));
            for (const ouvinte of this.ouvintes.splice(0)) ouvinte();
        });
    }

    aguardarConexao(ouvinte: () => void): () => void {
        this.ouvintes.push(ouvinte);
        return () => {
            this.ouvintes = this.ouvintes.filter((o) => o !== ouvinte);
        };
    }
}

/** Conexão: acumula os bytes recebidos até serem lidos. */
export class SoqueteConexao {
    recebido: Buffer = Buffer.alloc(0);
    terminou = false;
    erro: string | null = null;
    private ouvintes: Array<() => void> = [];

    constructor(public socket: net.Socket) {
        socket.on('data', (dados: Buffer) => {
            this.recebido = Buffer.concat([this.recebido, dados]);
            this.notificar();
        });
        socket.on('end', () => {
            this.terminou = true;
            this.notificar();
        });
        socket.on('close', () => {
            this.terminou = true;
            this.notificar();
        });
        socket.on('error', (erro: Error) => {
            this.erro = erro.message;
            this.terminou = true;
            this.notificar();
        });
    }

    private notificar() {
        for (const ouvinte of this.ouvintes.splice(0)) ouvinte();
    }

    aguardarMudanca(ouvinte: () => void): () => void {
        this.ouvintes.push(ouvinte);
        return () => {
            this.ouvintes = this.ouvintes.filter((o) => o !== ouvinte);
        };
    }

    retirar(quantidade: number): string {
        const parte = this.recebido.subarray(0, quantidade);
        this.recebido = this.recebido.subarray(quantidade);
        return parte.toString('utf-8');
    }
}

/** Codificação percentual de componentes de URL (RFC 3986: mantém A-Z a-z 0-9 - _ . ~). */
export function codificarComponenteUrl(texto: string): string {
    let resultado = '';
    for (const byte of Buffer.from(texto, 'utf-8')) {
        const caractere = String.fromCharCode(byte);
        resultado += /[A-Za-z0-9\-_.~]/.test(caractere) ? caractere : '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
    return resultado;
}

/** Decodifica %XX e '+' (como espaço). Sequências inválidas ficam como estão. */
export function decodificarComponenteUrl(texto: string): string {
    const bytes: number[] = [];
    const entrada = Buffer.from(texto, 'utf-8');
    for (let i = 0; i < entrada.length; i++) {
        const atual = entrada[i];
        if (atual === 0x25 && i + 2 < entrada.length) {
            const hexadecimal = String.fromCharCode(entrada[i + 1], entrada[i + 2]);
            if (/^[0-9A-Fa-f]{2}$/.test(hexadecimal)) {
                bytes.push(parseInt(hexadecimal, 16));
                i += 2;
                continue;
            }
        }
        bytes.push(atual === 0x2b ? 0x20 : atual);
    }
    return Buffer.from(bytes).toString('utf-8');
}

export function criarModuloRede(): DeleguaModulo {
    const modulo = new DeleguaModulo('rede');
    let ultimoErro = '';

    const tempoLimite = (valor: any): number => (valor === null || valor === undefined ? -1 : Number(valor));

    const funcoes: { [nome: string]: [number, (...args: any[]) => any] } = {
        escutar: [
            2,
            async (_interpretador: any, endereco: string, porta: number) => {
                const numeroPorta = Number(porta ?? 0);
                if (!Number.isInteger(numeroPorta) || numeroPorta < 0 || numeroPorta > 65535) {
                    ultimoErro = 'porta inválida';
                    return null;
                }
                const servidor = net.createServer({ pauseOnConnect: false });
                const resultado = await new Promise<SoqueteServidor | null>((resolver) => {
                    servidor.once('error', (erro: Error) => {
                        ultimoErro = `falha ao escutar: ${erro.message}`;
                        resolver(null);
                    });
                    servidor.listen({ host: endereco || undefined, port: numeroPorta, backlog: 16 }, () =>
                        resolver(new SoqueteServidor(servidor))
                    );
                });
                return resultado;
            },
        ],
        portaLocal: [
            1,
            async (_interpretador: any, soquete: any) => {
                if (soquete instanceof SoqueteServidor) {
                    const endereco = soquete.servidor.address();
                    return endereco && typeof endereco === 'object' ? endereco.port : -1;
                }
                if (soquete instanceof SoqueteConexao) return soquete.socket.localPort ?? -1;
                return -1;
            },
        ],
        aceitar: [
            2,
            async (_interpretador: any, servidor: any, limite: number) => {
                if (!(servidor instanceof SoqueteServidor)) {
                    ultimoErro = 'soquete inválido';
                    return null;
                }
                if (servidor.pendentes.length === 0) {
                    const chegou = await comTempoLimite<boolean>(tempoLimite(limite), (concluir) =>
                        servidor.aguardarConexao(() => concluir(true))
                    );
                    if (!chegou) {
                        ultimoErro = TEMPO_ESGOTADO;
                        return null;
                    }
                }
                return servidor.pendentes.shift();
            },
        ],
        conectar: [
            3,
            async (_interpretador: any, host: string, porta: number, limite: number) => {
                const numeroPorta = Number(porta);
                if (!host || !Number.isInteger(numeroPorta) || numeroPorta <= 0 || numeroPorta > 65535) {
                    ultimoErro = 'host ou porta inválidos';
                    return null;
                }
                const socket = net.connect({ host, port: numeroPorta });
                const conexao = new SoqueteConexao(socket);
                const resultado = await comTempoLimite<boolean>(tempoLimite(limite), (concluir) => {
                    const aoConectar = () => concluir(true);
                    const aoFalhar = (erro: Error) => {
                        ultimoErro = `conexão recusada ou inalcançável: ${erro.message}`;
                        concluir(false);
                    };
                    socket.once('connect', aoConectar);
                    socket.once('error', aoFalhar);
                    return () => {
                        socket.off('connect', aoConectar);
                        socket.off('error', aoFalhar);
                    };
                });
                if (resultado === undefined) ultimoErro = TEMPO_ESGOTADO;
                if (!resultado) {
                    socket.destroy();
                    return null;
                }
                conexao.erro = null;
                return conexao;
            },
        ],
        ler: [
            3,
            async (_interpretador: any, conexao: any, maxBytes: number, limite: number) => {
                if (!(conexao instanceof SoqueteConexao) || !(Number(maxBytes) > 0)) {
                    ultimoErro = 'argumentos inválidos';
                    return null;
                }
                if (conexao.recebido.length === 0 && !conexao.terminou) {
                    const mudou = await comTempoLimite<boolean>(tempoLimite(limite), (concluir) =>
                        conexao.aguardarMudanca(() => concluir(true))
                    );
                    if (!mudou) {
                        ultimoErro = TEMPO_ESGOTADO;
                        return null;
                    }
                }
                if (conexao.recebido.length === 0 && conexao.erro) {
                    ultimoErro = `falha ao ler: ${conexao.erro}`;
                    return null;
                }
                return conexao.retirar(Number(maxBytes));
            },
        ],
        lerAte: [
            4,
            async (_interpretador: any, conexao: any, delimitador: string, maxBytes: number, limite: number) => {
                if (!(conexao instanceof SoqueteConexao) || !(Number(maxBytes) > 0)) {
                    ultimoErro = 'argumentos inválidos';
                    return null;
                }
                const maximo = Number(maxBytes);
                const fim = delimitador ? Buffer.from(delimitador, 'utf-8') : null;
                const limiteMs = tempoLimite(limite);
                const prazo = limiteMs >= 0 ? Date.now() + limiteMs : -1;

                for (;;) {
                    if (fim) {
                        const posicao = conexao.recebido.indexOf(fim);
                        if (posicao >= 0 && posicao + fim.length <= maximo) {
                            return conexao.retirar(posicao + fim.length);
                        }
                    }
                    if (conexao.recebido.length >= maximo) return conexao.retirar(maximo);
                    if (conexao.terminou) {
                        if (conexao.erro && conexao.recebido.length === 0) {
                            ultimoErro = `falha ao ler: ${conexao.erro}`;
                            return null;
                        }
                        return conexao.retirar(conexao.recebido.length);
                    }
                    const restante = prazo < 0 ? -1 : prazo - Date.now();
                    if (prazo >= 0 && restante <= 0) {
                        ultimoErro = TEMPO_ESGOTADO;
                        return null;
                    }
                    const mudou = await comTempoLimite<boolean>(restante, (concluir) =>
                        conexao.aguardarMudanca(() => concluir(true))
                    );
                    if (!mudou) {
                        ultimoErro = TEMPO_ESGOTADO;
                        return null;
                    }
                }
            },
        ],
        escrever: [
            2,
            async (_interpretador: any, conexao: any, texto: string) => {
                if (!(conexao instanceof SoqueteConexao) || texto === null || texto === undefined) {
                    ultimoErro = 'argumentos inválidos';
                    return false;
                }
                return await new Promise<boolean>((resolver) => {
                    conexao.socket.write(String(texto), 'utf-8', (erro?: Error | null) => {
                        if (erro) ultimoErro = `falha ao escrever: ${erro.message}`;
                        resolver(!erro);
                    });
                });
            },
        ],
        escreverArquivo: [
            2,
            async (_interpretador: any, conexao: any, caminhoArquivo: string) => {
                // Envia o conteúdo bruto (bytes) de um arquivo pela conexão, sem conversão de texto.
                if (!(conexao instanceof SoqueteConexao) || !caminhoArquivo) {
                    ultimoErro = 'argumentos inválidos';
                    return false;
                }
                let conteudo: Buffer;
                try {
                    conteudo = await fs.promises.readFile(String(caminhoArquivo));
                } catch (erro: any) {
                    ultimoErro = `falha ao ler arquivo: ${erro.message}`;
                    return false;
                }
                return await new Promise<boolean>((resolver) => {
                    conexao.socket.write(conteudo, (erro?: Error | null) => {
                        if (erro) ultimoErro = `falha ao escrever: ${erro.message}`;
                        resolver(!erro);
                    });
                });
            },
        ],
        fechar: [
            1,
            async (_interpretador: any, soquete: any) => {
                if (soquete instanceof SoqueteServidor) {
                    for (const pendente of soquete.pendentes.splice(0)) pendente.socket.destroy();
                    await new Promise<void>((resolver) => soquete.servidor.close(() => resolver()));
                } else if (soquete instanceof SoqueteConexao) {
                    await new Promise<void>((resolver) => soquete.socket.end(() => resolver()));
                    soquete.socket.destroy();
                }
            },
        ],
        ultimoErro: [0, async () => ultimoErro],
        codificarComponenteUrl: [
            1,
            async (_interpretador: any, texto: string) => (texto === null || texto === undefined ? null : codificarComponenteUrl(String(texto))),
        ],
        decodificarComponenteUrl: [
            1,
            async (_interpretador: any, texto: string) => (texto === null || texto === undefined ? null : decodificarComponenteUrl(String(texto))),
        ],
    };

    for (const [nome, [aridade, funcao]] of Object.entries(funcoes)) {
        modulo.componentes[nome] = new FuncaoPadrao(aridade, funcao);
    }
    return modulo;
}
