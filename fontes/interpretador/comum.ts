import { DeleguaFuncao, DeleguaModulo } from "@designliquido/delegua/interpretador/estruturas";
import { FuncaoDeclaracao } from "@designliquido/delegua/declaracoes";

import { ImportarBiblioteca } from "../construtos";
import { ModuloDeclaracoes } from "../declaracoes";
import { InterpretadorComImportacaoInterface } from "../interfaces/interpretador-com-importacao-interface";

import carregarBibliotecaNode from '../mecanismo-importacao-bibliotecas';

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

export function visitarDeclaracaoDefinicaoFuncao(
    interpretador: InterpretadorComImportacaoInterface,
    funcaoDeclaracao: FuncaoDeclaracao
) {
    const funcao = new DeleguaFuncao(funcaoDeclaracao.simbolo.lexema, funcaoDeclaracao.funcao);
    // TODO: Depreciar essa abordagem a favor do uso por referências.
    interpretador.pilhaEscoposExecucao.definirVariavel(funcaoDeclaracao.simbolo.lexema, funcao);
    interpretador.pilhaEscoposExecucao.registrarReferenciaFuncao(funcaoDeclaracao.id, funcao);
    return {
        id: funcaoDeclaracao.id,
        nome: funcaoDeclaracao.simbolo.lexema,
        operacao: 'DefinicaoFuncao',
        tipo: `função<${funcao.declaracao.tipo || 'qualquer'}>`,
        tipoExplicito: funcao.declaracao.tipoExplicito,
    };
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
            if (componente.hasOwnProperty('operacao')) {
                switch (componente.operacao) {
                    case 'DefinicaoFuncao':
                        const definicaoFuncaoCorrespondente: DeleguaFuncao = interpretador.pilhaEscoposExecucao.obterReferenciaFuncao(componente.id);
                        modulo.componentes[componente.nome] = definicaoFuncaoCorrespondente;
                        break;
                    default:
                        console.warn("visitarDeclaracaoModuloDeclaracoes Tratar: ", componente);
                        break;
                }
            }

            // TODO: Casos em que não tenha `operacao` definida na resolução do componente.
        }
    }

    return modulo;
}
