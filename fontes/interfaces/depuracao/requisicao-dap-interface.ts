import { MensagemDap } from './mensagem-dap-interface';

export interface RequisicaoDap extends MensagemDap {
    command: string;
    arguments?: Record<string, unknown>;
    type: 'request';
}
