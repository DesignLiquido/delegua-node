import * as processoFilho from 'child_process';
import * as caminho from 'path';
import * as sistemaArquivos from 'fs';
import { pathToFileURL } from 'url';

import { ErroEmTempoDeExecucao } from '@designliquido/delegua/excecoes';
import { DeleguaModulo, ClassePadrao, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

import { ClasseDeModulo } from '../interpretador/estruturas';

// Cache de pacotes em memória
const cachePacotes = {
    diretorioGlobal: '' as string,
    modulos: new Map<string, any>()
};

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

const montarFuncaoPadraoDeManifesto = (dadosMetodo: {
    documentacao?: string,
    tipoRetorno: string,
    funcao: Function,
    argumentos: { nome: string, tipo: string }[]
}): FuncaoPadrao => {
    const funcaoPadrao = new FuncaoPadrao(dadosMetodo.argumentos.length, dadosMetodo.funcao);
    funcaoPadrao.descartarPrimeiroArgumento = false;
    funcaoPadrao.argumentos = dadosMetodo.argumentos;
    funcaoPadrao.tipoRetorno = dadosMetodo.tipoRetorno;
    // funcaoPadrao.documentacao = dadosMetodo.documentacao;
    return funcaoPadrao;
}

const modularizarBibliotecaPorManifesto = (
    manifestoModulo: {
        [nomeMetodo: string]: {
            documentacao?: string,
            tipoRetorno: string,
            funcao: Function,
            argumentos: { nome: string, tipo: string }[]
        } | {
            implementacao: any,
            propriedades?: {
                [nomePropriedade: string]: any,
                metodos?: { [nomeMetodo: string]: any }
            }
        }
    },
    nome: string
) => {
    const novoModulo = new DeleguaModulo(nome);

    for (const [metodoOuClasse, dadosMetodoOuClasse] of Object.entries(manifestoModulo)) {
        if ('funcao' in dadosMetodoOuClasse && typeof (dadosMetodoOuClasse as any).funcao === 'function') {
            const funcaoPadrao = montarFuncaoPadraoDeManifesto(dadosMetodoOuClasse as any);
            novoModulo.componentes[metodoOuClasse] = funcaoPadrao;
            continue;
        }

        if ('implementacao' in dadosMetodoOuClasse) {
            const implementacao = (dadosMetodoOuClasse as any).implementacao;
            if (typeof implementacao === 'function' &&
                String(implementacao).startsWith('class')
            ) {
                const metadados: {implementacao: any, propriedades: {[nome: string]: any}, metodos: {[nome: string]: any}} = dadosMetodoOuClasse as any;
                // TODO: Deixar isso melhor.
                const nomeCurtoModulo = novoModulo.nome.replace(/@designliquido\/delegua-/, '');
                const classeDeModulo = new ClasseDeModulo(
                    metodoOuClasse, 
                    nomeCurtoModulo,
                    metadados.implementacao, 
                    metadados.metodos, 
                    metadados.propriedades
                );
                
                novoModulo.componentes[metodoOuClasse] = classeDeModulo;
                continue;
            }
        }

        // TODO: Levantar erro aqui?
    }

    return novoModulo;
}

const carregarBiblioteca = async (nomeDaBiblioteca: string, caminhoDaBiblioteca: string) => {
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

const modularizarBibliotecaNpmPadrao = (dadosDoModulo: any, nome: string) => {
    const novoModulo = new DeleguaModulo(nome);

    const chaves = Object.keys(dadosDoModulo);
    for (let i = 0; i < chaves.length; i++) {
        const moduloAtual = dadosDoModulo[chaves[i]];

        if (typeof moduloAtual === 'function') {
            // Por definição, funções tradicionais e classes são identificadas em JavaScript como "functions".
            // A primeira heurística era verificando a propriedade `prototype`, mas isso não funciona bem
            // porque classes e funções avulsas todas possuem `prototype`.
            // Uma heurística nova é converter `moduloAtual` para `string` e verificar se a declaração começa com `class`.
            // Se sim, podemos dizer que a `function` é uma classe padrão.
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

async function importarModulo(caminhoModulo: string) {
    try {
        // tenta como ESM
        const resposta = await import(pathToFileURL(caminhoModulo).href);
        return resposta.default ?? resposta;
    } catch (err: any) {
        if (err.code === 'MODULE_NOT_FOUND' || err instanceof SyntaxError) {
            // fallback para CommonJS
            return require(caminhoModulo);
        }
        throw err;
    }
}

const importarPacoteCaminhoBase = async (caminhoRelativo: string) => {
    // Se já temos o módulo em cache, retorna direto
    if (cachePacotes.modulos.has(caminhoRelativo)) {
        return cachePacotes.modulos.get(caminhoRelativo);
    }

    // Descobre diretório global do npm apenas uma vez
    if (!cachePacotes.diretorioGlobal) {
        const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        cachePacotes.diretorioGlobal = processoFilho.execSync(`${npm} root -g`, { encoding: 'utf-8' }).trim();
    }

    const diretorioGlobal = cachePacotes.diretorioGlobal;

    // Primeiro tenta direto no global
    let caminhoAbsolutoPacote = caminho.resolve(diretorioGlobal, caminhoRelativo);

    // Se não existir, tenta dentro do pacote 'delegua'
    if (!sistemaArquivos.existsSync(caminhoAbsolutoPacote)) {
        caminhoAbsolutoPacote = caminho.resolve(diretorioGlobal, 'delegua', 'node_modules', caminhoRelativo);
    }

    const caminhoAbsolutoPackageJson = caminho.join(caminhoAbsolutoPacote, 'package.json');

    const packageJson = JSON.parse(
        sistemaArquivos.readFileSync(caminhoAbsolutoPackageJson, 'utf-8')
    );

    const arquivoInicio = packageJson.main || 'index.js';
    const caminhoModulo = caminho.resolve(caminhoAbsolutoPacote, arquivoInicio.replace('./', ''));

    // Converte para URL válida (independente de sistema operacional)
    const resposta = await importarModulo(caminhoModulo);

    // Normaliza exportação (default ou nomeada)
    const modulo = resposta.default ?? resposta;

    // Armazena em cache
    cachePacotes.modulos.set(caminhoRelativo, modulo);

    return modulo;
};

const importarPacoteDeleguaCompleto = async (nome: string) => {
    return await importarPacoteCaminhoBase(`delegua\\node_modules\\${nome}`);
};

const importarPacoteExternoCompleto = async (nome: string) => {
    return await importarPacoteCaminhoBase(nome);
};

export const verificarModulosDelegua = (nome: string): string | boolean => {
    const modulos = {
        arquivos: '@designliquido/delegua-arquivos',
        criptografia: '@designliquido/delegua-criptografia',
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
