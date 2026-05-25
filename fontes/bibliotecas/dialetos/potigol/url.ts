import fetch from 'node-fetch';

import { InterpretadorPotigolInterface } from '@designliquido/potigol/interfaces';

/**
 * Representa a estrutura de dados retornada por `URL(caminho)` no Potigol.
 * Contém o conteúdo obtido da URL e um indicador de erro.
 */
export class EstruturaURL {
    caminho: string;
    conteudo: string;
    erro: boolean;

    constructor(caminho: string, conteudo: string) {
        this.caminho = caminho;
        this.conteudo = conteudo;
        this.erro = conteudo === '';
    }
}

/**
 * Cria uma `EstruturaURL` com o conteúdo obtido a partir de um endereço.
 * Equivale a `URL(caminho)` do Potigol original.
 * Em caso de erro na requisição, `conteudo` será vazio e `erro` será verdadeiro.
 *
 * @param interpretador O interpretador Potigol.
 * @param caminho O endereço da URL a ser acessada.
 * @returns Uma `EstruturaURL` com `conteudo` e `erro`.
 */
export async function criarURL(
    interpretador: InterpretadorPotigolInterface,
    caminho: string
): Promise<EstruturaURL> {
    try {
        const resposta = await fetch(caminho);
        const conteudo = await resposta.text();
        return new EstruturaURL(caminho, conteudo);
    } catch {
        return new EstruturaURL(caminho, '');
    }
}
