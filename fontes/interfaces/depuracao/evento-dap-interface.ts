import { MensagemDap } from './mensagem-dap-interface';

export interface EventoDap extends MensagemDap {
    event: string;
    body?: Record<string, unknown>;
    type: 'event';
}
