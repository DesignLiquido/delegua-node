import { DeleguaFuncao, DeleguaModulo } from "@designliquido/delegua/interpretador/estruturas";
import { FuncaoDeclaracao } from "@designliquido/delegua/declaracoes";

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

export async function visitarDeclaracaoDefinicaoFuncao(
    interpretador: InterpretadorComImportacaoInterface,
    funcaoDeclaracao: FuncaoDeclaracao
) {
    const funcao = new DeleguaFuncao(funcaoDeclaracao.simbolo.lexema, funcaoDeclaracao.funcao);
    // TODO: Depreciar essa abordagem a favor do uso por referências.
    interpretador.pilhaEscoposExecucao.definirVariavel(funcaoDeclaracao.simbolo.lexema, funcao);
    interpretador.pilhaEscoposExecucao.registrarReferenciaFuncao(funcaoDeclaracao.id, funcao);
    return funcao;
}

export async function visitarDeclaracaoModuloDeclaracoes(
    interpretador: InterpretadorComImportacaoInterface,
    declaracao: ModuloDeclaracoes
) {
    // TODO: Colocar nome em `ModuloDeclaracoes`.
    // O problema é como definir o nome do módulo.
    // Talvez o prefixo do arquivo?
    const modulo = new DeleguaModulo();
    for (const subdeclaracao of declaracao.declaracoes) {
        const componente = await interpretador.avaliar(subdeclaracao);
        if (componente) {
            const classeComponenteResolvida = componente.constructor.name.replaceAll('_', '');
            switch (classeComponenteResolvida) {
                case 'DeleguaFuncao':
                    const componenteDeleguaFuncao = componente as DeleguaFuncao;
                    modulo.componentes[componenteDeleguaFuncao.nome] = componente;
                    break;
                default:
                    console.warn("visitarDeclaracaoModuloDeclaracoes Tratar: ", classeComponenteResolvida);
                    break;
            }           
        }
    }

    return modulo;
}
