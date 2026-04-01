import { SessaoDepuracaoDapPadrao } from './sessao-depuracao-dap';
import { TransporteDapStdio } from './transporte-dap-stdio';

export class AdaptadorDapDelegua {
    private readonly transporte = new TransporteDapStdio();
    private readonly sessao = new SessaoDepuracaoDapPadrao(this.transporte);

    iniciar(): void {
        this.sessao.iniciar();
    }

    encerrar(): void {
        this.sessao.encerrar();
    }
}
