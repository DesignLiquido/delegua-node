import {
    RequisicaoDap,
    RuntimeBridgeDepuracao,
    SessaoDepuracaoDap,
    TransporteDap,
} from './interfaces';

export class SessaoDepuracaoDapPadrao implements SessaoDepuracaoDap {
    private lancamentoConfigurado = false;
    private sessaoEncerrada = false;
    private filaRequisicoes = Promise.resolve();

    constructor(
        private readonly transporteDap: TransporteDap,
        private readonly runtimeBridgeDepuracao: RuntimeBridgeDepuracao
    ) {}

    iniciar(): void {
        this.transporteDap.on('requisicao', this.aoReceberRequisicao.bind(this));
        this.transporteDap.on('erro', this.aoReceberErro.bind(this));
        this.transporteDap.iniciar();
    }

    encerrar(): void {
        this.transporteDap.encerrar();
    }

    private aoReceberErro(erro: Error): void {
        process.stderr.write(`[DAP] ${erro.message}\n`);
    }

    private aoReceberRequisicao(requisicao: RequisicaoDap): void {
        this.filaRequisicoes = this.filaRequisicoes
            .then(async () => {
                await this.processarRequisicao(requisicao);
            })
            .catch((erro: any) => {
                this.transporteDap.enviarResposta(
                    requisicao,
                    false,
                    undefined,
                    String(erro?.message ?? erro)
                );
            });
    }

    private async processarRequisicao(requisicao: RequisicaoDap): Promise<void> {
        if (this.sessaoEncerrada && requisicao.command !== 'disconnect') {
            this.transporteDap.enviarResposta(
                requisicao,
                false,
                undefined,
                'Sessao DAP encerrada.'
            );
            return;
        }

        switch (requisicao.command) {
            case 'initialize':
                this.tratarInitialize(requisicao);
                return;
            case 'launch':
                await this.tratarLaunch(requisicao);
                return;
            case 'setBreakpoints':
                await this.tratarSetBreakpoints(requisicao);
                return;
            case 'configurationDone':
                await this.tratarConfigurationDone(requisicao);
                return;
            case 'threads':
                await this.tratarThreads(requisicao);
                return;
            case 'stackTrace':
                await this.tratarStackTrace(requisicao);
                return;
            case 'scopes':
                await this.tratarScopes(requisicao);
                return;
            case 'variables':
                await this.tratarVariables(requisicao);
                return;
            case 'continue':
                await this.tratarContinue(requisicao);
                return;
            case 'next':
                await this.tratarNext(requisicao);
                return;
            case 'stepIn':
                await this.tratarStepIn(requisicao);
                return;
            case 'stepOut':
                await this.tratarStepOut(requisicao);
                return;
            case 'disconnect':
                await this.tratarDisconnect(requisicao);
                return;
            default:
                this.transporteDap.enviarResposta(
                    requisicao,
                    false,
                    undefined,
                    `Comando DAP nao suportado no MVP: ${requisicao.command}`
                );
        }
    }

    private tratarInitialize(requisicao: RequisicaoDap): void {
        this.transporteDap.enviarResposta(requisicao, true, {
            supportsConfigurationDoneRequest: true,
            supportTerminateDebuggee: true,
            supportsTerminateRequest: false,
            supportsSetVariable: false,
            supportsStepBack: false,
        });

        this.transporteDap.enviarEvento('initialized');
    }

    private async tratarLaunch(requisicao: RequisicaoDap): Promise<void> {
        try {
            await this.runtimeBridgeDepuracao.prepararLancamento(requisicao.arguments);
            this.lancamentoConfigurado = true;
            this.transporteDap.enviarResposta(requisicao, true, {});
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
        }
    }

    private async tratarSetBreakpoints(requisicao: RequisicaoDap): Promise<void> {
        try {
            const caminhoArquivo = String((requisicao.arguments?.source as any)?.path ?? '');
            const pontosParadaBrutos = ((requisicao.arguments?.breakpoints as any[]) ?? [])
                .map((pontoParada) => Number(pontoParada?.line))
                .filter((linha) => Number.isInteger(linha));

            const linhasVerificadas = await this.runtimeBridgeDepuracao.definirPontosParada(
                caminhoArquivo,
                pontosParadaBrutos
            );

            const breakpoints = pontosParadaBrutos.map((linha) => ({
                verified: linhasVerificadas.includes(linha),
                line: linha,
            }));

            this.transporteDap.enviarResposta(requisicao, true, { breakpoints });
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
        }
    }

    private async tratarConfigurationDone(requisicao: RequisicaoDap): Promise<void> {
        if (!this.lancamentoConfigurado) {
            this.transporteDap.enviarResposta(
                requisicao,
                false,
                undefined,
                'launch deve ser executado antes de configurationDone.'
            );
            return;
        }

        this.transporteDap.enviarResposta(requisicao, true, {});

        try {
            const parada = await this.runtimeBridgeDepuracao.executarAtePrimeiroPontoParada();
            if (parada) {
                this.transporteDap.enviarEvento('stopped', {
                    reason: 'breakpoint',
                    threadId: 1,
                    allThreadsStopped: true,
                    hitBreakpointIds: [1],
                    description: `${parada.caminhoArquivo}:${parada.linha}`,
                });
            }
        } catch (erro: any) {
            this.transporteDap.enviarEvento('output', {
                category: 'stderr',
                output: `[DAP] ${String(erro?.message ?? erro)}\n`,
            });
        }
    }

    private async tratarThreads(requisicao: RequisicaoDap): Promise<void> {
        try {
            const threadsRuntime = await this.runtimeBridgeDepuracao.obterThreads();
            const threads = threadsRuntime.map((thread) => ({
                id: thread.id,
                name: thread.nome,
            }));
            this.transporteDap.enviarResposta(requisicao, true, { threads });
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
        }
    }

    private async tratarStackTrace(requisicao: RequisicaoDap): Promise<void> {
        try {
            const threadId = Number(requisicao.arguments?.threadId ?? 1);
            const stackFrames = await this.runtimeBridgeDepuracao.obterPilhaExecucao(threadId);
            this.transporteDap.enviarResposta(requisicao, true, {
                stackFrames: stackFrames.map((quadro) => ({
                    id: quadro.id,
                    name: quadro.nome,
                    line: quadro.linha,
                    column: quadro.coluna,
                    source: {
                        name: quadro.caminhoArquivo.split(/[/\\]/).pop(),
                        path: quadro.caminhoArquivo,
                    },
                })),
                totalFrames: stackFrames.length,
            });
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
        }
    }

    private async tratarScopes(requisicao: RequisicaoDap): Promise<void> {
        try {
            const frameId = Number(requisicao.arguments?.frameId ?? 0);
            const escopos = await this.runtimeBridgeDepuracao.obterEscopos(frameId);
            const scopes = escopos.map((escopo) => ({
                name: escopo.nome,
                variablesReference: escopo.variablesReference,
                expensive: escopo.expensive,
            }));
            this.transporteDap.enviarResposta(requisicao, true, { scopes });
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
        }
    }

    private async tratarVariables(requisicao: RequisicaoDap): Promise<void> {
        try {
            const variablesReference = Number(requisicao.arguments?.variablesReference ?? 0);
            const variaveis = await this.runtimeBridgeDepuracao.obterVariaveis(variablesReference);
            const variables = variaveis.map((variavel) => ({
                name: variavel.nome,
                value: variavel.valor,
                type: variavel.tipo,
                variablesReference: variavel.variablesReference,
            }));
            this.transporteDap.enviarResposta(requisicao, true, { variables });
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
        }
    }

    private async tratarContinue(requisicao: RequisicaoDap): Promise<void> {
        await this.tratarComandoFluxoExecucao(
            requisicao,
            () => this.runtimeBridgeDepuracao.continuar(Number(requisicao.arguments?.threadId ?? 1)),
            'breakpoint'
        );
    }

    private async tratarNext(requisicao: RequisicaoDap): Promise<void> {
        await this.tratarComandoFluxoExecucao(
            requisicao,
            () => this.runtimeBridgeDepuracao.proximo(Number(requisicao.arguments?.threadId ?? 1)),
            'step'
        );
    }

    private async tratarStepIn(requisicao: RequisicaoDap): Promise<void> {
        await this.tratarComandoFluxoExecucao(
            requisicao,
            () => this.runtimeBridgeDepuracao.adentrarEscopo(Number(requisicao.arguments?.threadId ?? 1)),
            'step'
        );
    }

    private async tratarStepOut(requisicao: RequisicaoDap): Promise<void> {
        await this.tratarComandoFluxoExecucao(
            requisicao,
            () => this.runtimeBridgeDepuracao.sairEscopo(Number(requisicao.arguments?.threadId ?? 1)),
            'step'
        );
    }

    private async tratarComandoFluxoExecucao(
        requisicao: RequisicaoDap,
        executador: () => Promise<{ caminhoArquivo: string; linha: number; motivo?: 'breakpoint' | 'step' } | null>,
        motivoPadrao: 'breakpoint' | 'step'
    ): Promise<void> {
        let parada: { caminhoArquivo: string; linha: number; motivo?: 'breakpoint' | 'step' } | null = null;
        try {
            parada = await executador();
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
            return;
        }

        this.transporteDap.enviarResposta(requisicao, true, { allThreadsContinued: true });
        this.transporteDap.enviarEvento('continued', {
            threadId: 1,
            allThreadsContinued: true,
        });

        if (parada) {
            this.transporteDap.enviarEvento('stopped', {
                reason: parada.motivo ?? motivoPadrao,
                threadId: 1,
                allThreadsStopped: true,
                description: `${parada.caminhoArquivo}:${parada.linha}`,
            });
        } else {
            this.emitirEventosEncerramento(0);
        }
    }

    private async tratarDisconnect(requisicao: RequisicaoDap): Promise<void> {
        try {
            await this.runtimeBridgeDepuracao.encerrarSessao();
            this.sessaoEncerrada = true;
            this.transporteDap.enviarResposta(requisicao, true, {});
            this.emitirEventosEncerramento(0);
            this.encerrar();
        } catch (erro: any) {
            this.transporteDap.enviarResposta(requisicao, false, undefined, String(erro?.message ?? erro));
        }
    }

    private emitirEventosEncerramento(codigoSaida: number): void {
        this.transporteDap.enviarEvento('terminated', {});
        this.transporteDap.enviarEvento('exited', { exitCode: codigoSaida });
    }
}
