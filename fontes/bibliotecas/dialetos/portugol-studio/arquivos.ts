import { InterpretadorInterface } from '@designliquido/delegua/interfaces';

import fs from 'fs';
import path from 'path';

const NUMERO_MAXIMO_ARQUIVOS = 10;

const ModoAcesso = {
    LEITURA: 0,
    ESCRITA: 1,
    ACRESCENTAR: 2,
};

const arquivos = new Array(NUMERO_MAXIMO_ARQUIVOS).fill(null);

export async function abrir_arquivo(interpretador: InterpretadorInterface, caminhoArquivo, modoAcesso) {
    if (modoAcesso < 0 || modoAcesso > 2) {
        throw new Error(`Modo de acesso inválido: ${modoAcesso}`);
    }

    if (arquivoAberto(caminhoArquivo)) {
        throw new Error(`O arquivo '${caminhoArquivo}' já está aberto`);
    }

    const indice = obterProximoIndiceLivre();

    if (modoAcesso === ModoAcesso.LEITURA) {
        const conteudo = await fs.promises.readFile(caminhoArquivo, 'utf-8');
        arquivos[indice] = {
            caminho: caminhoArquivo,
            modoAcesso,
            linhas: conteudo.split('\n'),
            linhaAtual: 0,
            fim: false,
        };
    } else {
        if (modoAcesso === ModoAcesso.ESCRITA) {
            await fs.promises.writeFile(caminhoArquivo, '', 'utf-8');
        }
        arquivos[indice] = {
            caminho: caminhoArquivo,
            modoAcesso,
            linhas: null,
            linhaAtual: 0,
            fim: false,
        };
    }

    return indice;
}

export async function fechar_arquivo(interpretador: InterpretadorInterface, endereco) {
    obterArquivo(endereco); // valida que o endereço é válido
    arquivos[endereco] = null;
}

export function fim_arquivo(interpretador: InterpretadorInterface, endereco) {
    const arquivo = obterArquivo(endereco);
    return arquivo.fim;
}

export async function ler_linha(interpretador: InterpretadorInterface, endereco) {
    const arquivo = obterArquivo(endereco);
    if (arquivo.modoAcesso !== ModoAcesso.LEITURA) {
        throw new Error(`O arquivo '${arquivo.caminho}' está aberto em modo de escrita`);
    }
    if (arquivo.fim) {
        return '';
    }
    const linha = arquivo.linhas[arquivo.linhaAtual++];
    if (arquivo.linhaAtual >= arquivo.linhas.length) {
        arquivo.fim = true;
    }
    return linha ?? '';
}

export async function escrever_linha(interpretador: InterpretadorInterface, linha, endereco) {
    const arquivo = obterArquivo(endereco);
    if (arquivo.modoAcesso === ModoAcesso.LEITURA) {
        throw new Error(`O arquivo '${arquivo.caminho}' está aberto em modo de leitura`);
    }
    await fs.promises.appendFile(arquivo.caminho, linha + '\n', 'utf-8');
}

export async function substituir_texto(
    interpretador: InterpretadorInterface,
    endereco,
    textoPesquisa,
    textoSubstituto,
    onlyFirst
) {
    const filePath = path.resolve(endereco);
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const newText = onlyFirst
        ? data.replace(textoPesquisa, textoSubstituto)
        : data.replace(new RegExp(textoPesquisa, 'g'), textoSubstituto);
    await fs.promises.writeFile(filePath, newText, 'utf-8');
}

export async function arquivo_existe(interpretador: InterpretadorInterface, caminhoArquivo) {
    const filePath = path.resolve(caminhoArquivo);
    return fs.promises
        .access(filePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
}

export async function apagar_arquivo(interpretador: InterpretadorInterface, caminhoArquivo) {
    const filePath = path.resolve(caminhoArquivo);
    await fs.promises.unlink(filePath);
}

export async function criar_pasta(interpretador: InterpretadorInterface, caminho) {
    const dirPath = path.resolve(caminho);
    await fs.promises.mkdir(dirPath, { recursive: true });
}

export async function listar_pastas(interpretador: InterpretadorInterface, caminhoPai, vetorPastas) {
    const dirPath = path.resolve(caminhoPai);
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const pastas = items.filter((item) => item.isDirectory()).map((item) => item.name);

    if (pastas.length > vetorPastas.length) {
        throw new Error(
            `Não foi possível listar as pastas pois o vetor passado é muito pequeno. O diretório escolhido possui ${pastas.length} pastas, mas o vetor passado comporta apenas ${vetorPastas.length} elementos.`
        );
    }

    pastas.forEach((pasta, i) => {
        vetorPastas[i] = pasta;
    });

    for (let i = pastas.length; i < vetorPastas.length; i++) {
        vetorPastas[i] = '';
    }
}

export async function listar_arquivos(interpretador: InterpretadorInterface, caminhoPai, vetorArquivos) {
    const dirPath = path.resolve(caminhoPai);
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const arquivos = items.filter((item) => item.isFile()).map((item) => item.name);

    if (arquivos.length > vetorArquivos.length) {
        throw new Error(
            `Não foi possível listar os arquivos pois o vetor passado é muito pequeno. O diretório escolhido possui ${arquivos.length} arquivos, mas o vetor passado comporta apenas ${vetorArquivos.length} elementos.`
        );
    }

    arquivos.forEach((arquivo, i) => {
        vetorArquivos[i] = arquivo;
    });

    for (let i = arquivos.length; i < vetorArquivos.length; i++) {
        vetorArquivos[i] = '';
    }
}

export async function listar_arquivos_por_tipo(
    interpretador: InterpretadorInterface,
    caminhoPai,
    vetorArquivos,
    vetorTipos
) {
    const dirPath = path.resolve(caminhoPai);
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const arquivos = items
        .filter((item) => item.isFile() && vetorTipos.some((tipo) => item.name.endsWith(tipo)))
        .map((item) => item.name);

    if (arquivos.length > vetorArquivos.length) {
        throw new Error(
            `Não foi possível listar os arquivos pois o vetor passado é muito pequeno. O diretório escolhido possui ${arquivos.length} arquivos, mas o vetor passado comporta apenas ${vetorArquivos.length} elementos.`
        );
    }

    arquivos.forEach((arquivo, i) => {
        vetorArquivos[i] = arquivo;
    });

    for (let i = arquivos.length; i < vetorArquivos.length; i++) {
        vetorArquivos[i] = '';
    }
}

function obterProximoIndiceLivre() {
    const indice = arquivos.findIndex((arquivo) => arquivo === null);
    if (indice === -1) {
        throw new Error('O número máximo de arquivos que podem ser abertos ao mesmo tempo foi atingido');
    }
    return indice;
}

function obterArquivo(endereco) {
    const arquivo = arquivos[endereco];
    if (!arquivo) {
        throw new Error('O endereço de memória especificado não aponta para um arquivo');
    }
    return arquivo;
}

function arquivoAberto(caminho) {
    return arquivos.some((arquivo) => arquivo && arquivo.caminho === caminho);
}
