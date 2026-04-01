import { RequisicaoDap, SessaoDepuracaoDap, TransporteDap } from './interfaces';

export class SessaoDepuracaoDapPadrao implements SessaoDepuracaoDap {
    constructor(private readonly transporteDap: TransporteDap) {}

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
        switch (requisicao.command) {
            case 'initialize':
                this.tratarInitialize(requisicao);
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
            supportsSetVariable: false,
            supportsStepBack: false,
        });

        this.transporteDap.enviarEvento('initialized');
    }
}
