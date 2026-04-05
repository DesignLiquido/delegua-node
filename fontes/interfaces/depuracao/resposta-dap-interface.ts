import { MensagemDap } from './mensagem-dap-interface';

export interface RespostaDap extends MensagemDap {
    request_seq: number;
    success: boolean;
    command: string;
    message?: string;
    body?: Record<string, unknown>;
    type: 'response';
}
