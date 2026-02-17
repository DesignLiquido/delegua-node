import fetch, { RequestInit, Response } from 'node-fetch';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

import { InterpretadorInterface } from '@designliquido/delegua/interfaces';

let timeout: number = 2000;

export async function definir_tempo_limite(interpretador: InterpretadorInterface, time: number): Promise<void> {
    timeout = time;
}

async function fetch_com_timeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const { signal } = controller;
    try {
        return await fetch(url, { ...options, signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function obter_texto(interpretador: InterpretadorInterface, caminho: string): Promise<string> {
    try {
        const response = await fetch_com_timeout(caminho, { method: 'GET' });

        const conteudo = await response.text();
        if (!conteudo) {
            throw new Error(`O caminho ${caminho} não tem nenhum conteúdo`);
        }

        return conteudo;
    } catch (error) {
        throw new Error(`Não foi possível obter o conteúdo de ${caminho}: ${error.message}`);
    }
}

export async function baixar_imagem(
    interpretador: InterpretadorInterface,
    endereco: string,
    caminho: string
): Promise<string> {
    let tipoDaImagem: string;
    let headerDaRequisicao: string;
    let imagemObtida: Buffer;
    let arquivo: string;

    try {
        tipoDaImagem = 'png';
        const responseHead = await fetch_com_timeout(endereco, { method: 'HEAD' });
        headerDaRequisicao = responseHead.headers.get('content-type') || '';
        if (headerDaRequisicao.includes('image/png')) {
            tipoDaImagem = 'png';
        } else if (headerDaRequisicao.includes('image/jpeg') || headerDaRequisicao.includes('image/jpg')) {
            tipoDaImagem = 'jpg';
        }

        const responseImage = await fetch_com_timeout(endereco, { method: 'GET' });
        const arrayBuffer = await responseImage.arrayBuffer();
        imagemObtida = Buffer.from(arrayBuffer);
    } catch (error) {
        throw new Error(`Não foi possível obter o conteúdo de ${endereco}`);
    }

    arquivo = resolve(caminho + `.${tipoDaImagem}`);
    try {
        await new Promise((resolve, reject) => {
            const stream = createWriteStream(arquivo);
            stream.on('finish', resolve as () => void);
            stream.on('error', reject);
            stream.write(imagemObtida);
            stream.end();
        });
    } catch (error) {
        throw new Error(
            `Não foi possível salvar a imagem em ${arquivo}\nGaranta que o caminho é válido e todas as pastas existem`
        );
    }

    return tipoDaImagem;
}

export async function endereco_disponivel(interpretador: InterpretadorInterface, endereco: string): Promise<boolean> {
    try {
        const response = await fetch_com_timeout(endereco, { method: 'HEAD' });
        const status = response.status;

        if (status === 404 || status === 0) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}
