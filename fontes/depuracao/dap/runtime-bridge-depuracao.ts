import * as caminho from 'path';
import * as fs from 'fs';

import { cyrb53 } from '@designliquido/delegua/geracao-identificadores';
import { InterpretadorComDepuracaoInterface } from '@designliquido/delegua/interfaces';

import { NucleoExecucao } from '../../nucleo-execucao';
import { ParadaDepuracao, RuntimeBridgeDepuracao } from './interfaces';

interface ConfiguracaoLancamento {
    programa: string;
    dialeto: string;
}

export class RuntimeBridgeDepuracaoDelegua implements RuntimeBridgeDepuracao {
    private readonly versaoDelegua: string;

    private configuracaoLancamento: ConfiguracaoLancamento | null = null;
    private pontosParadaPendentes = new Map<string, number[]>();

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
}
