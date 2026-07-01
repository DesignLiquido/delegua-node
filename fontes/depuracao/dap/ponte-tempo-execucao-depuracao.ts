import * as caminho from 'path';
import * as sistemaArquivos from 'fs';

import { cyrb53 } from '@designliquido/delegua/geracao-identificadores';
import { InterpretadorComDepuracaoInterface } from '@designliquido/delegua/interfaces';
import { VariavelInterface } from '@designliquido/delegua/interfaces/variavel-interface';

import { NucleoExecucao } from '../../nucleo-execucao';
import {
    ConfiguracaoLancamento,
    EscopoDepuracao,
    ParadaDepuracao,
    QuadroPilhaDepuracao,
    PonteTempoExecucaoDepuracaoInterface,
    ThreadDepuracao,
    VariavelDepuracao,
} from '../../interfaces/depuracao';
import { EscopoExecucaoInterface } from '@designliquido/delegua/interfaces/escopo-execucao';
import { formatarValor, obterDeclaracaoAtual, RegistroReferencias } from '../referencias-depuracao';

export class PonteTempoExecucaoDepuracaoDelegua implements PonteTempoExecucaoDepuracaoInterface {
    private readonly versaoDelegua: string;
    private readonly threadPrincipalId = 1;

    private configuracaoLancamento: ConfiguracaoLancamento | null = null;
    private pontosParadaPendentes = new Map<string, number[]>();
    private registroFrames = new RegistroReferencias<number>();
    private registroVariaveis = new RegistroReferencias<{ [nome: string]: VariavelInterface }>();

    private nucleoExecucao: NucleoExecucao | null = null;
    private interpretador: InterpretadorComDepuracaoInterface | null = null;

    constructor(versaoDelegua: string) {
        this.versaoDelegua = versaoDelegua;
    }

    async prepararLancamento(argumentos?: Record<string, unknown>): Promise<void> {
        const programa = String(argumentos?.program ?? '').trim();
        const dialeto = String(argumentos?.dialeto ?? 'delegua').trim() || 'delegua';

        if (!programa) {
            throw new Error('Argumento `program` e obrigatorio para launch.');
        }

        const caminhoPrograma = caminho.resolve(programa);
        if (!sistemaArquivos.existsSync(caminhoPrograma)) {
            throw new Error(`Arquivo de programa nao encontrado: ${caminhoPrograma}`);
        }

        this.configuracaoLancamento = {
            programa: caminhoPrograma,
            dialeto,
        };
        this.registroFrames.limpar();
        this.registroVariaveis.limpar();
    }

    async definirPontosParada(caminhoArquivo: string, linhas: number[]): Promise<number[]> {
        const caminhoAbsoluto = caminho.resolve(caminhoArquivo);
        if (!sistemaArquivos.existsSync(caminhoAbsoluto)) {
            this.pontosParadaPendentes.set(caminhoAbsoluto, []);
            return [];
        }

        const quantidadeLinhasArquivo = sistemaArquivos.readFileSync(caminhoAbsoluto, 'utf8').split(/\r?\n/).length;
        const linhasValidadas = linhas
            .filter((linha) => Number.isInteger(linha) && linha > 0 && linha <= quantidadeLinhasArquivo)
            .sort((a, b) => a - b);

        this.pontosParadaPendentes.set(caminhoAbsoluto, [...new Set(linhasValidadas)]);
        return this.pontosParadaPendentes.get(caminhoAbsoluto) ?? [];
    }

    async executarAtePrimeiroPontoParada(): Promise<ParadaDepuracao | null> {
        if (!this.configuracaoLancamento) {
            throw new Error('launch deve ser executado antes de configurationDone.');
        }

        this.nucleoExecucao = new NucleoExecucao(this.versaoDelegua);
        this.nucleoExecucao.configurarDialeto(
            this.configuracaoLancamento.dialeto,
            false,
            true,
            false
        );

        this.interpretador = this.nucleoExecucao.interpretador as InterpretadorComDepuracaoInterface;
        this.interpretador.pontoDeParadaAtivo = false;

        await this.nucleoExecucao.carregarEExecutarArquivo(this.configuracaoLancamento.programa);
        this.aplicarPontosParadaNoInterpretador();

        let houveParada = false;
        this.interpretador.avisoPontoParadaAtivado = () => {
            houveParada = true;
        };

        await this.interpretador.instrucaoContinuarInterpretacao();

        if (!houveParada && !this.interpretador.pontoDeParadaAtivo) {
            return null;
        }

        return this.obterParadaAtual();
    }

    async obterThreads(): Promise<ThreadDepuracao[]> {
        this.garantirSessaoInicializada();

        return [{ id: this.threadPrincipalId, nome: 'thread-principal' }];
    }

    async obterPilhaExecucao(threadId: number): Promise<QuadroPilhaDepuracao[]> {
        this.garantirSessaoInicializada();
        if (threadId !== this.threadPrincipalId || !this.nucleoExecucao || !this.interpretador) {
            return [];
        }

        this.registroFrames.limpar();
        this.registroVariaveis.limpar();

        const pilhaEscopos = this.obterPilhaEscopos();
        const quadros: QuadroPilhaDepuracao[] = [];
        for (let indice = pilhaEscopos.length - 1; indice >= 0; indice--) {
            const escopo = pilhaEscopos[indice];
            const declaracaoAtual = obterDeclaracaoAtual(escopo);
            if (!declaracaoAtual) {
                continue;
            }

            const caminhoArquivo = this.nucleoExecucao.arquivosAbertos[declaracaoAtual.hashArquivo];
            if (!caminhoArquivo) {
                continue;
            }

            const frameId = this.registroFrames.registrar(indice);
            quadros.push({
                id: frameId,
                nome: declaracaoAtual.assinaturaMetodo || `escopo-${indice}`,
                caminhoArquivo,
                linha: declaracaoAtual.linha,
                coluna: 1,
            });
        }

        return quadros;
    }

    async obterEscopos(frameId: number): Promise<EscopoDepuracao[]> {
        this.garantirSessaoInicializada();
        const indiceEscopo = this.registroFrames.obter(frameId);
        if (indiceEscopo === undefined || !this.interpretador) {
            return [];
        }

        const pilhaEscopos = this.obterPilhaEscopos();
        const escopo = pilhaEscopos[indiceEscopo];
        const variaveis = escopo?.espacoMemoria?.valores || {};

        const variablesReference = this.registroVariaveis.registrar(variaveis);

        return [
            {
                nome: 'Locais',
                variablesReference,
                expensive: false,
            },
        ];
    }

    async obterVariaveis(variablesReference: number): Promise<VariavelDepuracao[]> {
        this.garantirSessaoInicializada();
        const variaveis = this.registroVariaveis.obter(variablesReference);
        if (!variaveis) {
            return [];
        }

        return Object.entries(variaveis).map(([nome, variavel]) => ({
            nome,
            valor: formatarValor(variavel?.valor),
            tipo: variavel?.tipo,
            variablesReference: 0,
        }));
    }

    async continuar(threadId: number): Promise<ParadaDepuracao | null> {
        this.garantirSessaoInicializada();
        if (!this.interpretador || threadId !== this.threadPrincipalId) {
            return null;
        }

        return this.executarInstrucao(async () => {
            this.interpretador.comando = 'continuar';
            this.interpretador.pontoDeParadaAtivo = false;
            await this.interpretador.instrucaoContinuarInterpretacao();
        }, 'breakpoint');
    }

    async proximo(threadId: number): Promise<ParadaDepuracao | null> {
        this.garantirSessaoInicializada();
        if (!this.interpretador || threadId !== this.threadPrincipalId) {
            return null;
        }

        return this.executarInstrucao(async () => {
            this.interpretador.comando = 'proximo';
            this.interpretador.pontoDeParadaAtivo = false;
            await this.interpretador.instrucaoPasso();
        }, 'step');
    }

    async adentrarEscopo(threadId: number): Promise<ParadaDepuracao | null> {
        this.garantirSessaoInicializada();
        if (!this.interpretador || threadId !== this.threadPrincipalId) {
            return null;
        }

        return this.executarInstrucao(async () => {
            this.interpretador.comando = 'adentrarEscopo';
            this.interpretador.pontoDeParadaAtivo = false;
            await this.interpretador.instrucaoPasso();
        }, 'step');
    }

    async sairEscopo(threadId: number): Promise<ParadaDepuracao | null> {
        this.garantirSessaoInicializada();
        if (!this.interpretador || threadId !== this.threadPrincipalId) {
            return null;
        }

        return this.executarInstrucao(async () => {
            this.interpretador.pontoDeParadaAtivo = false;
            await this.interpretador.instrucaoProximoESair();
        }, 'step');
    }

    async encerrarSessao(): Promise<void> {
        try {
            if (this.nucleoExecucao) {
                this.nucleoExecucao.finalizarDepuracao();
            }
        } catch {
            // limpeza defensiva: erros aqui nao devem impedir encerramento da sessao DAP
        }

        this.interpretador = null;
        this.nucleoExecucao = null;
        this.registroFrames.limpar();
        this.registroVariaveis.limpar();
    }

    private aplicarPontosParadaNoInterpretador(): void {
        if (!this.nucleoExecucao || !this.interpretador) {
            return;
        }

        this.interpretador.pontosParada = [];
        for (const [caminhoArquivo, linhas] of this.pontosParadaPendentes.entries()) {
            const hashArquivo = cyrb53(caminhoArquivo.toLowerCase());
            const hashConhecido = Object.prototype.hasOwnProperty.call(this.nucleoExecucao.arquivosAbertos, hashArquivo);
            if (!hashConhecido) {
                continue;
            }

            for (const linha of linhas) {
                this.interpretador.pontosParada.push({
                    hashArquivo,
                    linha,
                });
            }
        }
    }

    private obterParadaAtual(): ParadaDepuracao | null {
        if (!this.nucleoExecucao || !this.interpretador) {
            return null;
        }

        const pilhaEscopos = (this.interpretador as any).pilhaEscoposExecucao?.pilha;
        if (!Array.isArray(pilhaEscopos) || pilhaEscopos.length <= 0) {
            return null;
        }

        for (let indice = pilhaEscopos.length - 1; indice >= 0; indice--) {
            const escopo = pilhaEscopos[indice];
            const declaracaoAtual = obterDeclaracaoAtual(escopo);
            if (!declaracaoAtual) {
                continue;
            }

            const caminhoArquivo = this.nucleoExecucao.arquivosAbertos[declaracaoAtual.hashArquivo];
            if (!caminhoArquivo) {
                continue;
            }

            return {
                caminhoArquivo,
                linha: declaracaoAtual.linha,
            };
        }

        return null;
    }

    private obterPilhaEscopos(): EscopoExecucaoInterface[] {
        const pilhaEscopos = (this.interpretador as any)?.pilhaEscoposExecucao?.pilha;
        if (!Array.isArray(pilhaEscopos)) {
            return [];
        }

        return pilhaEscopos as EscopoExecucaoInterface[];
    }

    private async executarInstrucao(
        acao: () => Promise<void>,
        motivoPadrao: 'breakpoint' | 'step'
    ): Promise<ParadaDepuracao | null> {
        let houveParada = false;
        if (!this.interpretador) {
            return null;
        }

        this.interpretador.avisoPontoParadaAtivado = () => {
            houveParada = true;
        };

        await acao();

        if (!houveParada && !this.interpretador.pontoDeParadaAtivo) {
            return null;
        }

        const paradaAtual = this.obterParadaAtual();
        if (!paradaAtual) {
            return null;
        }

        return {
            ...paradaAtual,
            motivo: paradaAtual.motivo ?? motivoPadrao,
        };
    }

    private garantirSessaoInicializada(): void {
        if (!this.interpretador || !this.nucleoExecucao) {
            throw new Error('Sessao de depuracao ainda nao foi iniciada com configurationDone.');
        }
    }
}
