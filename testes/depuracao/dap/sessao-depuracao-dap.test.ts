import { PassThrough } from 'stream';

import {
    EscopoDepuracao,
    ParadaDepuracao,
    QuadroPilhaDepuracao,
    SessaoDepuracaoDapPadrao,
    ThreadDepuracao,
    TransporteDapStdio,
    VariavelDepuracao,
} from '../../../fontes/depuracao/dap';

class RuntimeBridgeDepuracaoFalso {
    argumentosLancamentoRecebidos: Record<string, unknown> | undefined;
    pontosParadaPorArquivo = new Map<string, number[]>();
    paradaSimulada: ParadaDepuracao | null = null;
    threadsSimuladas: ThreadDepuracao[] = [{ id: 1, nome: 'thread-principal' }];
    quadrosSimulados: QuadroPilhaDepuracao[] = [
        {
            id: 101,
            nome: 'principal',
            caminhoArquivo: 'D:/Delegua/codeblocks/exemplo.delegua',
            linha: 3,
            coluna: 1,
        },
    ];
    escoposSimulados: EscopoDepuracao[] = [
        {
            nome: 'Locais',
            variablesReference: 201,
            expensive: false,
        },
    ];
    variaveisSimuladas: VariavelDepuracao[] = [
        {
            nome: 'x',
            valor: '42',
            tipo: 'numero',
            variablesReference: 0,
        },
    ];
    paradaContinueSimulada: ParadaDepuracao | null = null;
    paradaNextSimulada: ParadaDepuracao | null = null;
    paradaStepInSimulada: ParadaDepuracao | null = null;
    paradaStepOutSimulada: ParadaDepuracao | null = null;

    async prepararLancamento(argumentos?: Record<string, unknown>): Promise<void> {
        this.argumentosLancamentoRecebidos = argumentos;
    }

    async definirPontosParada(caminhoArquivo: string, linhas: number[]): Promise<number[]> {
        this.pontosParadaPorArquivo.set(caminhoArquivo, linhas.filter((linha) => linha > 0));
        return this.pontosParadaPorArquivo.get(caminhoArquivo) ?? [];
    }

    async executarAtePrimeiroPontoParada(): Promise<ParadaDepuracao | null> {
        return this.paradaSimulada;
    }

    async obterThreads(): Promise<ThreadDepuracao[]> {
        return this.threadsSimuladas;
    }

    async obterPilhaExecucao(): Promise<QuadroPilhaDepuracao[]> {
        return this.quadrosSimulados;
    }

    async obterEscopos(): Promise<EscopoDepuracao[]> {
        return this.escoposSimulados;
    }

    async obterVariaveis(): Promise<VariavelDepuracao[]> {
        return this.variaveisSimuladas;
    }

    async continuar(): Promise<ParadaDepuracao | null> {
        return this.paradaContinueSimulada;
    }

    async proximo(): Promise<ParadaDepuracao | null> {
        return this.paradaNextSimulada;
    }

    async adentrarEscopo(): Promise<ParadaDepuracao | null> {
        return this.paradaStepInSimulada;
    }

    async sairEscopo(): Promise<ParadaDepuracao | null> {
        return this.paradaStepOutSimulada;
    }
}

const enveloparMensagemDap = (mensagem: Record<string, unknown>): string => {
    const corpo = JSON.stringify(mensagem);
    return `Content-Length: ${Buffer.byteLength(corpo, 'utf8')}\r\n\r\n${corpo}`;
};

const extrairMensagensDap = (dados: string): Array<Record<string, unknown>> => {
    const mensagens: Array<Record<string, unknown>> = [];
    let cursor = 0;

    while (cursor < dados.length) {
        const separador = dados.indexOf('\r\n\r\n', cursor);
        if (separador === -1) {
            break;
        }

        const cabecalho = dados.slice(cursor, separador);
        const correspondencia = /Content-Length:\s*(\d+)/i.exec(cabecalho);
        if (!correspondencia) {
            break;
        }

        const tamanhoCorpo = Number(correspondencia[1]);
        const inicioCorpo = separador + 4;
        const fimCorpo = inicioCorpo + tamanhoCorpo;
        const corpo = dados.slice(inicioCorpo, fimCorpo);
        mensagens.push(JSON.parse(corpo));

        cursor = fimCorpo;
    }

    return mensagens;
};

describe('Sessao DAP', () => {
    it('deve responder initialize e emitir initialized', async () => {
        const entrada = new PassThrough();
        const saida = new PassThrough();
        const transporte = new TransporteDapStdio(entrada, saida);
        const runtimeBridgeFalso = new RuntimeBridgeDepuracaoFalso();
        const sessao = new SessaoDepuracaoDapPadrao(transporte, runtimeBridgeFalso as any);

        let bufferSaida = '';
        saida.on('data', (dado) => {
            bufferSaida += dado.toString('utf8');
        });

        sessao.iniciar();
        entrada.write(
            enveloparMensagemDap({
                seq: 7,
                type: 'request',
                command: 'initialize',
                arguments: {
                    clientID: 'codeblocks',
                },
            })
        );

        await new Promise((resolve) => setImmediate(resolve));

        const mensagens = extrairMensagensDap(bufferSaida);
        expect(mensagens).toHaveLength(2);

        const resposta = mensagens[0];
        const evento = mensagens[1];

        expect(resposta.type).toBe('response');
        expect(resposta.request_seq).toBe(7);
        expect(resposta.command).toBe('initialize');
        expect(resposta.success).toBe(true);

        expect(evento.type).toBe('event');
        expect(evento.event).toBe('initialized');
    });

    it('deve executar fluxo launch, setBreakpoints e configurationDone com stopped', async () => {
        const entrada = new PassThrough();
        const saida = new PassThrough();
        const transporte = new TransporteDapStdio(entrada, saida);
        const runtimeBridgeFalso = new RuntimeBridgeDepuracaoFalso();
        runtimeBridgeFalso.paradaSimulada = {
            caminhoArquivo: 'D:/Delegua/codeblocks/exemplo.delegua',
            linha: 3,
        };
        const sessao = new SessaoDepuracaoDapPadrao(transporte, runtimeBridgeFalso as any);

        let bufferSaida = '';
        saida.on('data', (dado) => {
            bufferSaida += dado.toString('utf8');
        });

        sessao.iniciar();
        entrada.write(enveloparMensagemDap({ seq: 1, type: 'request', command: 'initialize' }));
        entrada.write(
            enveloparMensagemDap({
                seq: 2,
                type: 'request',
                command: 'launch',
                arguments: {
                    program: 'D:/Delegua/codeblocks/exemplo.delegua',
                    dialeto: 'delegua',
                },
            })
        );
        entrada.write(
            enveloparMensagemDap({
                seq: 3,
                type: 'request',
                command: 'setBreakpoints',
                arguments: {
                    source: {
                        path: 'D:/Delegua/codeblocks/exemplo.delegua',
                    },
                    breakpoints: [{ line: 3 }],
                },
            })
        );
        entrada.write(enveloparMensagemDap({ seq: 4, type: 'request', command: 'configurationDone' }));

        await new Promise((resolve) => setImmediate(resolve));

        const mensagens = extrairMensagensDap(bufferSaida);
        expect(mensagens.find((m) => m.type === 'response' && m.command === 'launch')).toBeTruthy();
        expect(mensagens.find((m) => m.type === 'response' && m.command === 'setBreakpoints')).toBeTruthy();
        expect(mensagens.find((m) => m.type === 'response' && m.command === 'configurationDone')).toBeTruthy();

        const eventoParada = mensagens.find((m) => m.type === 'event' && m.event === 'stopped');
        expect(eventoParada).toBeTruthy();
        expect((eventoParada as any).body.reason).toBe('breakpoint');
    });

    it('deve responder comandos de estado e navegacao da fase 2', async () => {
        const entrada = new PassThrough();
        const saida = new PassThrough();
        const transporte = new TransporteDapStdio(entrada, saida);
        const runtimeBridgeFalso = new RuntimeBridgeDepuracaoFalso();
        runtimeBridgeFalso.paradaContinueSimulada = {
            caminhoArquivo: 'D:/Delegua/codeblocks/exemplo.delegua',
            linha: 7,
            motivo: 'breakpoint',
        };
        runtimeBridgeFalso.paradaNextSimulada = {
            caminhoArquivo: 'D:/Delegua/codeblocks/exemplo.delegua',
            linha: 8,
            motivo: 'step',
        };
        runtimeBridgeFalso.paradaStepInSimulada = {
            caminhoArquivo: 'D:/Delegua/codeblocks/exemplo.delegua',
            linha: 9,
            motivo: 'step',
        };
        runtimeBridgeFalso.paradaStepOutSimulada = {
            caminhoArquivo: 'D:/Delegua/codeblocks/exemplo.delegua',
            linha: 10,
            motivo: 'step',
        };

        const sessao = new SessaoDepuracaoDapPadrao(transporte, runtimeBridgeFalso as any);

        let bufferSaida = '';
        saida.on('data', (dado) => {
            bufferSaida += dado.toString('utf8');
        });

        sessao.iniciar();
        entrada.write(enveloparMensagemDap({ seq: 1, type: 'request', command: 'threads' }));
        entrada.write(
            enveloparMensagemDap({
                seq: 2,
                type: 'request',
                command: 'stackTrace',
                arguments: { threadId: 1 },
            })
        );
        entrada.write(
            enveloparMensagemDap({
                seq: 3,
                type: 'request',
                command: 'scopes',
                arguments: { frameId: 101 },
            })
        );
        entrada.write(
            enveloparMensagemDap({
                seq: 4,
                type: 'request',
                command: 'variables',
                arguments: { variablesReference: 201 },
            })
        );
        entrada.write(
            enveloparMensagemDap({
                seq: 5,
                type: 'request',
                command: 'continue',
                arguments: { threadId: 1 },
            })
        );
        entrada.write(
            enveloparMensagemDap({
                seq: 6,
                type: 'request',
                command: 'next',
                arguments: { threadId: 1 },
            })
        );
        entrada.write(
            enveloparMensagemDap({
                seq: 7,
                type: 'request',
                command: 'stepIn',
                arguments: { threadId: 1 },
            })
        );
        entrada.write(
            enveloparMensagemDap({
                seq: 8,
                type: 'request',
                command: 'stepOut',
                arguments: { threadId: 1 },
            })
        );

        await new Promise((resolve) => setImmediate(resolve));

        const mensagens = extrairMensagensDap(bufferSaida);
        expect(mensagens.find((m) => m.type === 'response' && m.command === 'threads')).toBeTruthy();
        expect(mensagens.find((m) => m.type === 'response' && m.command === 'stackTrace')).toBeTruthy();
        expect(mensagens.find((m) => m.type === 'response' && m.command === 'scopes')).toBeTruthy();
        expect(mensagens.find((m) => m.type === 'response' && m.command === 'variables')).toBeTruthy();

        const eventosContinued = mensagens.filter((m) => m.type === 'event' && m.event === 'continued');
        const eventosStopped = mensagens.filter((m) => m.type === 'event' && m.event === 'stopped');
        expect(eventosContinued.length).toBe(4);
        expect(eventosStopped.length).toBe(4);
    });
});
