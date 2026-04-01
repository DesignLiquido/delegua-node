export interface MensagemDap {
    seq?: number;
    type: 'request' | 'response' | 'event';
}

export interface RequisicaoDap extends MensagemDap {
    command: string;
    arguments?: Record<string, unknown>;
    type: 'request';
}

export interface RespostaDap extends MensagemDap {
    request_seq: number;
    success: boolean;
    command: string;
    message?: string;
    body?: Record<string, unknown>;
    type: 'response';
}

export interface EventoDap extends MensagemDap {
    event: string;
    body?: Record<string, unknown>;
    type: 'event';
}

export interface TransporteDap {
    iniciar(): void;
    encerrar(): void;
    enviarEvento(nomeEvento: string, corpo?: Record<string, unknown>): void;
    enviarResposta(
        requisicao: RequisicaoDap,
        sucesso: boolean,
        corpo?: Record<string, unknown>,
        mensagemErro?: string
    ): void;
    on(evento: 'requisicao', callback: (requisicao: RequisicaoDap) => void): this;
    on(evento: 'erro', callback: (erro: Error) => void): this;
}

export interface RuntimeBridgeDepuracao {
    iniciarPrograma(argumentos?: Record<string, unknown>): Promise<void>;
}

export interface SessaoDepuracaoDap {
    iniciar(): void;
    encerrar(): void;
}
