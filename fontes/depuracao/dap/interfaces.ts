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
    prepararLancamento(argumentos?: Record<string, unknown>): Promise<void>;
    definirPontosParada(caminhoArquivo: string, linhas: number[]): Promise<number[]>;
    executarAtePrimeiroPontoParada(): Promise<ParadaDepuracao | null>;
    obterThreads(): Promise<ThreadDepuracao[]>;
    obterPilhaExecucao(threadId: number): Promise<QuadroPilhaDepuracao[]>;
    obterEscopos(frameId: number): Promise<EscopoDepuracao[]>;
    obterVariaveis(variablesReference: number): Promise<VariavelDepuracao[]>;
    continuar(threadId: number): Promise<ParadaDepuracao | null>;
    proximo(threadId: number): Promise<ParadaDepuracao | null>;
    adentrarEscopo(threadId: number): Promise<ParadaDepuracao | null>;
    sairEscopo(threadId: number): Promise<ParadaDepuracao | null>;
    encerrarSessao(): Promise<void>;
}

export interface ParadaDepuracao {
    caminhoArquivo: string;
    linha: number;
    motivo?: 'breakpoint' | 'step';
}

export interface ThreadDepuracao {
    id: number;
    nome: string;
}

export interface QuadroPilhaDepuracao {
    id: number;
    nome: string;
    caminhoArquivo: string;
    linha: number;
    coluna: number;
}

export interface EscopoDepuracao {
    nome: string;
    variablesReference: number;
    expensive: boolean;
}

export interface VariavelDepuracao {
    nome: string;
    valor: string;
    tipo?: string;
    variablesReference: number;
}

export interface SessaoDepuracaoDap {
    iniciar(): void;
    encerrar(): void;
}
