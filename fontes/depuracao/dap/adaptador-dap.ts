import { Delegua } from '../../delegua';
import { PonteTempoExecucaoDepuracaoDelegua } from './ponte-tempo-execucao-depuracao';
import { SessaoDepuracaoDapPadrao } from './sessao-depuracao-dap';
import { TransporteDapStdio } from './transporte-dap-stdio';

export class AdaptadorDapDelegua {
    private readonly transporte = new TransporteDapStdio();
    private readonly runtimeBridge = new PonteTempoExecucaoDepuracaoDelegua(new Delegua().versao());
    private readonly sessao = new SessaoDepuracaoDapPadrao(this.transporte, this.runtimeBridge);

    iniciar(): void {
        this.sessao.iniciar();
    }

    encerrar(): void {
        this.sessao.encerrar();
    }
}
