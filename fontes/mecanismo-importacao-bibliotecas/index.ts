import * as processoFilho from 'child_process';
import * as caminho from 'path';
import * as sistemaArquivos from 'fs';

import { ErroEmTempoDeExecucao } from '@designliquido/delegua/excecoes';
import { DeleguaModulo, ClassePadrao, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

export const carregarBibliotecaDelegua = (nome: string) => {
    try {
        const dadosDoManifesto = require(nome + '/delegua-modulo');
        const primeiroManifesto = Object.entries(dadosDoManifesto)[0];
        return modularizarBibliotecaPorManifesto(primeiroManifesto[1] as any, nome);
    } catch (erro: any) {
        // Biblioteca não existe localmente. Tentar importação global.
        try {
            const dadosDoModulo = importarPacoteDeleguaCompleto(nome);
            return modularizarBibliotecaNpmPadrao(dadosDoModulo, nome);
        } catch (erro2: any) {
            throw new ErroEmTempoDeExecucao(null, `Biblioteca ${nome} não encontrada para importação, nem por referência local, nem por instalação global.`);
        }
    }
};

const carregarBiblioteca = async (nomeDaBiblioteca: string, caminhoDaBiblioteca: any) => {
    let dadosDoModulo: any;

    try {
        dadosDoModulo = require(caminhoDaBiblioteca);
    } catch (erro: any) {
        try {
            dadosDoModulo = await importarPacoteExternoCompleto(nomeDaBiblioteca);
        } catch (erro2: any) {
            throw new ErroEmTempoDeExecucao(
                null,
                `Biblioteca ${nomeDaBiblioteca} não encontrada para importação. Informações adicionais: ${erro2?.message || '(nenhuma)'
                }`
            );
        }
    }

    return modularizarBibliotecaNpmPadrao(dadosDoModulo, nomeDaBiblioteca);
};

const modularizarBibliotecaPorManifesto = (
    manifestoModulo: { [nomeMetodo: string]: { 
        documentacao?: string,
        tipoRetorno: string, 
        funcao: Function, 
        argumentos: { nome: string, tipo: string }[] 
    } }, 
    nome: string
) => {
    const novoModulo = new DeleguaModulo(nome);

    for (const [metodo, dadosMetodo] of Object.entries(manifestoModulo)) {
        const funcaoPadrao = new FuncaoPadrao(dadosMetodo.argumentos.length, dadosMetodo.funcao);
        // TODO: Remover cast para any pós lançamento de versão do núcleo.
        (funcaoPadrao as any).descartarPrimeiroArgumento = false;
        (funcaoPadrao as any).argumentos = dadosMetodo.argumentos;
        (funcaoPadrao as any).tipoRetorno = dadosMetodo.tipoRetorno;
        // (funcaoPadrao as any).documentacao = dadosMetodo.documentacao;
        novoModulo.componentes[metodo] = funcaoPadrao;
    }

    return novoModulo;
}

const modularizarBibliotecaNpmPadrao = (dadosDoModulo: any, nome: string) => {
    const novoModulo = new DeleguaModulo(nome);

    const chaves = Object.keys(dadosDoModulo);
    for (let i = 0; i < chaves.length; i++) {
        const moduloAtual = dadosDoModulo[chaves[i]];

        if (typeof moduloAtual === 'function') {
            // Por definição, funções tradicionais e classes são identificadas em JavaScript como "functions".
            // A primeira heurística era verificando a propriedade `prototype`, mas isso não funciona bem
            // porque classes e funções avulsas todas possuem prototype.
            // Uma heurística nova é converter `moduloAtual` para `string` e verificar se a declaração começa com `class`.
            // Se sim, podemos dizer que a "function" é uma classe padrão.
            // Caso contrário, é uma função (`FuncaoPadrao`).
            if (String(moduloAtual).startsWith('class')) {
                const classePadrao = new ClassePadrao(chaves[i], moduloAtual);
                novoModulo.componentes[chaves[i]] = classePadrao;
            } else {
                novoModulo.componentes[chaves[i]] = new FuncaoPadrao(moduloAtual.length, moduloAtual);
            }
        } else {
            novoModulo.componentes[chaves[i]] = moduloAtual;
        }
    }

    return novoModulo;
};

const importarPacoteCaminhoBase = async (caminhoRelativo: string) => {
    let resultado = null;
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const comandoDescobertaDiretorioGlobal = processoFilho.spawnSync(npm, ['root', '--location=global']);
    const diretorioGlobal = comandoDescobertaDiretorioGlobal.output[1].toString().trim();

    const caminhoAbsolutoPacote = caminho.join(diretorioGlobal, caminhoRelativo);
    const caminhoAbsolutoPackageJson = caminho.join(caminhoAbsolutoPacote, 'package.json');

    let arquivoInicio = JSON.parse(sistemaArquivos.readFileSync(caminhoAbsolutoPackageJson, 'utf-8')).main || 'index.js';

    const resposta = await import(
        caminho.join('file:///' + diretorioGlobal) +
        `\\${caminhoRelativo}\\${arquivoInicio.replace('./', '')}`
    );

    resultado = resposta;
    return resultado;
};

const importarPacoteDeleguaCompleto = async (nome: string) => {
    return await importarPacoteCaminhoBase(`delegua\\node_modules\\${nome}`);
};

const importarPacoteExternoCompleto = async (nome: string) => {
    return await importarPacoteCaminhoBase(nome);
};

export const verificarModulosDelegua = (nome: string): string | boolean => {
    const modulos = {
        estatistica: '@designliquido/delegua-estatistica',
        estatística: '@designliquido/delegua-estatistica',
        fisica: '@designliquido/delegua-fisica',
        física: '@designliquido/delegua-fisica',
        http: '@designliquido/delegua-http',
        json: '@designliquido/delegua-json',
        matematica: '@designliquido/delegua-matematica',
        matemática: '@designliquido/delegua-matematica',
        tempo: '@designliquido/delegua-tempo',
    };

    if (Object.keys(modulos).includes(nome)) {
        return modulos[nome].toString();
    }

    return false;
};

export default async function (nome: string) {
    const nomeBibliotecaResolvido: string | boolean = verificarModulosDelegua(nome);
    return nomeBibliotecaResolvido
        ? carregarBibliotecaDelegua(String(nomeBibliotecaResolvido))
        : await carregarBiblioteca(nome, nome);
}
