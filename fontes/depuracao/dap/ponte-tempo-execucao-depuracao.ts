import * as caminho from 'path';
import * as fs from 'fs';

import { cyrb53 } from '@designliquido/delegua/geracao-identificadores';
import { InterpretadorComDepuracaoInterface } from '@designliquido/delegua/interfaces';
import { EscopoExecucao } from '@designliquido/delegua/interfaces/escopo-execucao';
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

export class PonteTempoExecucaoDepuracaoDelegua implements PonteTempoExecucaoDepuracaoInterface {
    private readonly versaoDelegua: string;
    private readonly threadPrincipalId = 1;

    private configuracaoLancamento: ConfiguracaoLancamento | null = null;
    private pontosParadaPendentes = new Map<string, number[]>();
    private contadorReferencias = 1;
    private mapeamentoFrames = new Map<number, number>();
    private mapeamentoVariaveis = new Map<number, { [nome: string]: VariavelInterface }>();

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
        if (!fs.existsSync(caminhoPrograma)) {
            throw new Error(`Arquivo de programa nao encontrado: ${caminhoPrograma}`);
        }

        this.configuracaoLancamento = {
            programa: caminhoPrograma,
            dialeto,
        };
        this.contadorReferencias = 1;
        this.mapeamentoFrames.clear();
        this.mapeamentoVariaveis.clear();
    }

    async definirPontosParada(caminhoArquivo: string, linhas: number[]): Promise<number[]> {
        const caminhoAbsoluto = caminho.resolve(caminhoArquivo);
        if (!fs.existsSync(caminhoAbsoluto)) {
            this.pontosParadaPendentes.set(caminhoAbsoluto, []);
            return [];
        }

        const quantidadeLinhasArquivo = fs.readFileSync(caminhoAbsoluto, 'utf8').split(/\r?\n/).length;
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

        this.mapeamentoFrames.clear();
        this.mapeamentoVariaveis.clear();

        const pilhaEscopos = this.obterPilhaEscopos();
        const quadros: QuadroPilhaDepuracao[] = [];
        for (let indice = pilhaEscopos.length - 1; indice >= 0; indice--) {
            const escopo = pilhaEscopos[indice];
            const declaracaoAtual = this.obterDeclaracaoAtual(escopo);
            if (!declaracaoAtual) {
                continue;
            }

            const caminhoArquivo = this.nucleoExecucao.arquivosAbertos[declaracaoAtual.hashArquivo];
            if (!caminhoArquivo) {
                continue;
            }

            const frameId = this.proximaReferencia();
            this.mapeamentoFrames.set(frameId, indice);
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
        const indiceEscopo = this.mapeamentoFrames.get(frameId);
        if (indiceEscopo === undefined || !this.interpretador) {
            return [];
        }

        const pilhaEscopos = this.obterPilhaEscopos();
        const escopo = pilhaEscopos[indiceEscopo];
        const variaveis = escopo?.espacoMemoria?.valores || {};

        const variablesReference = this.proximaReferencia();
        this.mapeamentoVariaveis.set(variablesReference, variaveis);

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
        const variaveis = this.mapeamentoVariaveis.get(variablesReference);
        if (!variaveis) {
            return [];
        }

        return Object.entries(variaveis).map(([nome, variavel]) => ({
            nome,
            valor: this.formatarValor(variavel?.valor),
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
        this.contadorReferencias = 1;
        this.mapeamentoFrames.clear();
        this.mapeamentoVariaveis.clear();
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
            if (!escopo || !Array.isArray(escopo.declaracoes) || escopo.declaracoes.length <= 0) {
                continue;
            }

            const posicaoAtual =
                escopo.declaracaoAtual >= escopo.declaracoes.length
                    ? escopo.declaracoes.length - 1
                    : escopo.declaracaoAtual;
            const declaracaoAtual = escopo.declaracoes[posicaoAtual];
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

    private obterPilhaEscopos(): EscopoExecucao[] {
        const pilhaEscopos = (this.interpretador as any)?.pilhaEscoposExecucao?.pilha;
        if (!Array.isArray(pilhaEscopos)) {
            return [];
        }

        return pilhaEscopos as EscopoExecucao[];
    }

    private obterDeclaracaoAtual(escopo: EscopoExecucao): any {
        if (!escopo || !Array.isArray(escopo.declaracoes) || escopo.declaracoes.length <= 0) {
            return null;
        }

        const posicaoAtual =
            escopo.declaracaoAtual >= escopo.declaracoes.length
                ? escopo.declaracoes.length - 1
                : escopo.declaracaoAtual;
        return escopo.declaracoes[posicaoAtual];
    }

    private proximaReferencia(): number {
        return this.contadorReferencias++;
    }

    private formatarValor(valor: any): string {
        if (valor === null) {
            return 'nulo';
        }

        if (valor === undefined) {
            return 'indefinido';
        }

        if (typeof valor === 'string') {
            return valor;
        }

        if (typeof valor === 'number' || typeof valor === 'boolean') {
            return String(valor);
        }

        try {
            return JSON.stringify(valor);
        } catch {
            return String(valor);
        }
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
