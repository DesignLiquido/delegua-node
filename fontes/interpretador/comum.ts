import { ImportarBiblioteca } from "../construtos";
import { ModuloDeclaracoes } from "../declaracoes";
import { InterpretadorComImportacaoInterface } from "../interfaces/interpretador-com-importacao-interface";

import carregarBibliotecaNode from './mecanismo-importacao-bibliotecas';

export async function visitarConstrutoImportarBiblioteca(
    _: InterpretadorComImportacaoInterface,
    importarBiblioteca: ImportarBiblioteca
) {
    try {
        return await carregarBibliotecaNode(importarBiblioteca.nomeBiblioteca);
    } catch (erro: any) {
        this.erros.push(erro);
        return null;
    }
}

export async function visitarDeclaracaoModuloDeclaracoes(
    interpretador: InterpretadorComImportacaoInterface,
    declaracao: ModuloDeclaracoes
) {
    for (const subdeclaracao of declaracao.declaracoes) {
        await interpretador.avaliar(subdeclaracao);
    }
}
