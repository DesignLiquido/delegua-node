import { EscopoDepuracao } from './escopo-depuracao-interface';
import { ParadaDepuracao } from './parada-depuracao-interface';
import { QuadroPilhaDepuracao } from './quadro-pilha-depuracao-interface';
import { ThreadDepuracao } from './thread-depuracao-interface';
import { VariavelDepuracao } from './variavel-depuracao-interface';

export interface PonteTempoExecucaoDepuracaoInterface {
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
