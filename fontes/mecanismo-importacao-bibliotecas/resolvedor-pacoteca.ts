import * as caminho from 'path';
import * as sistemaArquivos from 'fs';

/**
 * Diretório onde o cliente `pacote` instala pacotes da Pacoteca, relativo à raiz do projeto.
 * Estrutura: `pacotes/<realizacao>/<nome>/pacoteca.jsonc`.
 */
export const DIRETORIO_PACOTES = 'pacotes';

/** Esta é a realização `node` de Delégua. */
export const REALIZACAO = 'node';

/** Nomes de pacote válidos: apenas letras, números, `-` e `_`. Impede caminhos como `../x`. */
const PADRAO_NOME_PACOTE = /^[\p{L}\p{N}_-]+$/u;

/**
 * Remove comentários de linha (`//`) e de bloco (`/* *\/`) de um documento JSONC,
 * preservando o conteúdo de textos literais.
 */
export function removerComentariosJsonc(texto: string): string {
    let saida = '';
    let i = 0;
    const n = texto.length;

    while (i < n) {
        const c = texto[i];

        if (c === '"') {
            let j = i + 1;
            while (j < n && texto[j] !== '"') {
                if (texto[j] === '\\') j++;
                j++;
            }
            saida += texto.slice(i, j + 1);
            i = j + 1;
            continue;
        }

        if (c === '/' && texto[i + 1] === '/') {
            while (i < n && texto[i] !== '\n') i++;
            continue;
        }

        if (c === '/' && texto[i + 1] === '*') {
            const fim = texto.indexOf('*/', i + 2);
            if (fim < 0) {
                throw new Error('comentário de bloco não fechado');
            }
            i = fim + 2;
            continue;
        }

        saida += c;
        i++;
    }

    return saida;
}

/**
 * Procura um pacote instalado pela Pacoteca, subindo a árvore de diretórios a partir de
 * `diretorioInicial` (como o Node.js faz com `node_modules`).
 *
 * Um pacote é usado quando `pacotes/node/<nome>/pacoteca.jsonc` existe e declara um
 * `pontoDeEntrada` `.delegua` que existe dentro do diretório do pacote.
 *
 * @returns O caminho absoluto do ponto de entrada, ou `null` se o pacote não estiver instalado.
 */
export function resolverPacotePacoteca(nome: string, diretorioInicial: string): string | null {
    if (!PADRAO_NOME_PACOTE.test(nome)) {
        return null;
    }

    let diretorio = caminho.resolve(diretorioInicial);

    while (true) {
        const diretorioPacote = caminho.join(diretorio, DIRETORIO_PACOTES, REALIZACAO, nome);
        const caminhoManifesto = caminho.join(diretorioPacote, 'pacoteca.jsonc');

        if (sistemaArquivos.existsSync(caminhoManifesto)) {
            return lerPontoDeEntrada(diretorioPacote, caminhoManifesto);
        }

        const diretorioPai = caminho.dirname(diretorio);
        if (diretorioPai === diretorio) {
            return null;
        }
        diretorio = diretorioPai;
    }
}

function lerPontoDeEntrada(diretorioPacote: string, caminhoManifesto: string): string | null {
    let manifesto: any;
    try {
        manifesto = JSON.parse(removerComentariosJsonc(sistemaArquivos.readFileSync(caminhoManifesto, 'utf-8')));
    } catch (erro: any) {
        throw new Error(`Erro ao analisar ${caminhoManifesto}: ${erro?.message ?? erro}`);
    }

    const pontoDeEntrada = manifesto?.pontoDeEntrada;
    if (typeof pontoDeEntrada !== 'string' || !pontoDeEntrada.endsWith('.delegua')) {
        // Pacote sem fonte Delégua (por exemplo, apenas `pacoteNpm`): resolução segue para o NPM.
        return null;
    }

    const caminhoEntrada = caminho.resolve(diretorioPacote, pontoDeEntrada);
    const relativo = caminho.relative(diretorioPacote, caminhoEntrada);
    if (relativo.startsWith('..') || caminho.isAbsolute(relativo)) {
        throw new Error(`pontoDeEntrada '${pontoDeEntrada}' em ${caminhoManifesto} aponta para fora do pacote.`);
    }

    if (!sistemaArquivos.existsSync(caminhoEntrada)) {
        throw new Error(`pontoDeEntrada '${pontoDeEntrada}' declarado em ${caminhoManifesto} não existe.`);
    }

    return caminhoEntrada;
}
