import {
    RequisicaoDap,
    RuntimeBridgeDepuracao,
    SessaoDepuracaoDap,
    TransporteDap,
} from './interfaces';

export class SessaoDepuracaoDapPadrao implements SessaoDepuracaoDap {
    private lancamentoConfigurado = false;
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
}
