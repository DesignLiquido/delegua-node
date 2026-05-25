import fs from 'fs';

import { InterpretadorPotigolInterface } from '@designliquido/potigol/interfaces';

/**
 * Lê um arquivo e retorna suas linhas como uma lista de textos.
 * Equivale a `Arquivo.leia(caminho)` do Potigol original.
 *
 * @param interpretador O interpretador Potigol.
 * @param caminho O caminho do arquivo a ser lido.
 * @returns Uma lista de linhas do arquivo.
 */
export async function leia(interpretador: InterpretadorPotigolInterface, caminho: string): Promise<string[]> {
    const conteudo = await fs.promises.readFile(caminho, 'utf-8');
    return conteudo.split('\n');
}

/**
 * Salva um texto em um arquivo.
 * Equivale a `Arquivo.salve(caminho, conteúdo, anexar)` do Potigol original.
 *
 * @param interpretador O interpretador Potigol.
 * @param caminho O caminho do arquivo a ser salvo.
 * @param conteudo O conteúdo a ser salvo.
 * @param anexar Se verdadeiro, o conteúdo é adicionado ao fim do arquivo; caso contrário, o arquivo é sobrescrito.
 */
export async function salve(
    interpretador: InterpretadorPotigolInterface,
    caminho: string,
    conteudo: string,
    anexar: boolean = false
): Promise<void> {
    if (anexar) {
        await fs.promises.appendFile(caminho, conteudo, 'utf-8');
    } else {
        await fs.promises.writeFile(caminho, conteudo, 'utf-8');
    }
}
