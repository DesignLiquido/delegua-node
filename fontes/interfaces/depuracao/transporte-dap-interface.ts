import { RequisicaoDap } from './requisicao-dap-interface';

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
