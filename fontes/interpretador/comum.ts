import { DeleguaFuncao, DeleguaModulo, MetodoPrimitiva, ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { Const, FuncaoDeclaracao } from "@designliquido/delegua/declaracoes";
import { AcessoMetodoOuPropriedade } from "@designliquido/delegua/construtos";
import { VariavelInterface } from "@designliquido/delegua/interfaces";
import { RetornoQuebra } from "@designliquido/delegua/quebras";
import { ErroEmTempoDeExecucao } from "@designliquido/delegua/excecoes";
import { inferirTipoVariavel } from "@designliquido/delegua/inferenciador";

import primitivasDicionario from '@designliquido/delegua/bibliotecas/primitivas-dicionario';
import primitivasNumero from '@designliquido/delegua/bibliotecas/primitivas-numero';
import primitivasTexto from '@designliquido/delegua/bibliotecas/primitivas-texto';
import primitivasVetor from '@designliquido/delegua/bibliotecas/primitivas-vetor';

import tipoDeDadosDelegua from '@designliquido/delegua/tipos-de-dados/delegua';

import { ImportarBiblioteca } from "../construtos";
import { ModuloDeclaracoes } from "../declaracoes";
import { InterpretadorComImportacaoInterface } from "../interfaces/interpretador-com-importacao-interface";

import carregarBibliotecaNode from '../mecanismo-importacao-bibliotecas';

export async function visitarConstrutoImportarBiblioteca(
    interpretador: InterpretadorComImportacaoInterface,
    importarBiblioteca: ImportarBiblioteca
) {
    try {
        return await carregarBibliotecaNode(importarBiblioteca.nomeBiblioteca);
    } catch (erro: any) {
        interpretador.erros.push(erro);
        return null;
    }
}

/**
 * Executa expressão de definição de constante.
 * @param declaracao A declaração `Const`.
 * @returns Um descritor de informações importantes para o retorno externo.
 */
export async function visitarDeclaracaoConst(
    interpretador: InterpretadorComImportacaoInterface,
    declaracao: Const
): Promise<any> {
    const valorFinal = await (interpretador as any).avaliacaoDeclaracaoVarOuConst(declaracao);
    if (valorFinal && valorFinal.hasOwnProperty('operacao') && valorFinal.operacao === 'DefinicaoFuncao') {
        interpretador.pilhaEscoposExecucao.definirConstante(
            declaracao.simbolo.lexema,
            valorFinal.declaracao,
            declaracao.tipo
        );
    } else {
        interpretador.pilhaEscoposExecucao.definirConstante(
            declaracao.simbolo.lexema,
            valorFinal,
            declaracao.tipo
        );
    }

    return {
        tipo: declaracao.tipo,
        tipoExplicito: declaracao.tipoExplicito,
    };
}

export async function visitarDeclaracaoDefinicaoFuncao(
    interpretador: InterpretadorComImportacaoInterface,
    funcaoDeclaracao: FuncaoDeclaracao
): Promise<any> {
    const funcao = new DeleguaFuncao(funcaoDeclaracao.simbolo.lexema, funcaoDeclaracao.funcao);
    // TODO: Depreciar essa abordagem a favor do uso por referências?
    interpretador.pilhaEscoposExecucao.definirVariavel(funcaoDeclaracao.simbolo.lexema, funcao);
    interpretador.pilhaEscoposExecucao.registrarReferenciaFuncao(funcaoDeclaracao.id, funcao);

    return Promise.resolve({
        id: funcaoDeclaracao.id,
        nome: funcaoDeclaracao.simbolo.lexema,
        operacao: 'DefinicaoFuncao',
        tipo: `função<${funcao.declaracao.tipo || 'qualquer'}>`,
        tipoExplicito: funcao.declaracao.tipoExplicito,
        declaracao: funcao
    });
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

/**
 * Casos que ocorrem aqui:
 *
 * - Quando o método ou propriedade é ou 'qualquer', ou vetor
 *   de 'qualquer' ('qualquer[]'), e uma primitiva é usada.
 * - Quando o objeto é uma classe definida em código.
 * @param {AcessoMetodoOuPropriedade} expressao A expressão de acesso a método ou propriedade.
 * @returns A primitiva encontrada.
 */
export async function visitarExpressaoAcessoMetodoOuPropriedade(
    interpretador: InterpretadorComImportacaoInterface,
    expressao: AcessoMetodoOuPropriedade
): Promise<any> {
    const nomeObjeto = (interpretador as any).resolverNomeObjectoAcessado(expressao.objeto);
    let variavelObjeto: VariavelInterface = await interpretador.avaliar(expressao.objeto);

    // Este caso acontece quando há encadeamento de métodos.
    // Por exemplo, `objeto1.metodo1().metodo2()`.
    // Como `RetornoQuebra` também possui `valor`, precisamos extrair o
    // valor dele primeiro.
    if (variavelObjeto.constructor === RetornoQuebra) {
        const retornoQuebra = variavelObjeto as RetornoQuebra;
        variavelObjeto = retornoQuebra.valor;
    }

    const objeto = (interpretador as any).resolverValor(variavelObjeto, true);

    if (objeto.constructor === ObjetoDeleguaClasse) {
        return (objeto as ObjetoDeleguaClasse).obter(expressao.simbolo);
    }

    // Objeto simples do JavaScript, ou dicionário de Delégua.
    if (objeto.constructor === Object) {
        if (expressao.simbolo.lexema in primitivasDicionario) {
            if (!(expressao.simbolo.lexema in primitivasNumero)) {
                throw new ErroEmTempoDeExecucao(expressao.simbolo, `Método de primitiva '${expressao.simbolo.lexema}' não existe para o tipo dicionário.`);
            }

            const metodoDePrimitivaDicionario: Function =
                primitivasDicionario[expressao.simbolo.lexema].implementacao;
            return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaDicionario);
        }

        return objeto[expressao.simbolo.lexema];
    }

    // String do JavaScript, ou seja, primitiva de texto.
    if (objeto.constructor === String) {
        if (!(expressao.simbolo.lexema in primitivasTexto)) {
            throw new ErroEmTempoDeExecucao(expressao.simbolo, `Método de primitiva '${expressao.simbolo.lexema}' não existe para o tipo texto.`);
        }

        const metodoDePrimitivaTexto: Function =
            primitivasTexto[expressao.simbolo.lexema].implementacao;
        return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaTexto);
    }

    // A partir daqui, presume-se que o objeto é uma das estruturas
    // de Delégua.
    if (objeto instanceof DeleguaModulo) {
        return objeto.componentes[expressao.simbolo.lexema] || null;
    }

    let tipoObjeto = variavelObjeto.tipo;
    if (tipoObjeto === null || tipoObjeto === undefined) {
        tipoObjeto = inferirTipoVariavel(variavelObjeto as any);
    }

    // Como internamente um dicionário de Delégua é simplesmente um objeto de
    // JavaScript, as primitivas de dicionário, especificamente, são tratadas
    // mais acima.
    switch (tipoObjeto) {
        case tipoDeDadosDelegua.INTEIRO:
        case tipoDeDadosDelegua.NUMERO:
        case tipoDeDadosDelegua.NÚMERO:
            if (!(expressao.simbolo.lexema in primitivasNumero)) {
                throw new ErroEmTempoDeExecucao(expressao.simbolo, `Método de primitiva '${expressao.simbolo.lexema}' não existe para o tipo ${tipoObjeto}.`);
            }

            const metodoDePrimitivaNumero: Function =
                primitivasNumero[expressao.simbolo.lexema].implementacao;
            if (metodoDePrimitivaNumero) {
                return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaNumero);
            }
            break;
        case tipoDeDadosDelegua.TEXTO:
            if (!(expressao.simbolo.lexema in primitivasTexto)) {
                throw new ErroEmTempoDeExecucao(expressao.simbolo, `Método de primitiva '${expressao.simbolo.lexema}' não existe para o tipo ${tipoObjeto}.`);
            }

            const metodoDePrimitivaTexto: Function =
                primitivasTexto[expressao.simbolo.lexema].implementacao;
            if (metodoDePrimitivaTexto) {
                return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaTexto);
            }
            break;
        case tipoDeDadosDelegua.VETOR:
        case tipoDeDadosDelegua.VETOR_INTEIRO:
        case tipoDeDadosDelegua.VETOR_LOGICO:
        case tipoDeDadosDelegua.VETOR_LÓGICO:
        case tipoDeDadosDelegua.VETOR_NUMERO:
        case tipoDeDadosDelegua.VETOR_NÚMERO:
        case tipoDeDadosDelegua.VETOR_QUALQUER:
        case tipoDeDadosDelegua.VETOR_TEXTO:
            if (!(expressao.simbolo.lexema in primitivasVetor)) {
                throw new ErroEmTempoDeExecucao(expressao.simbolo, `Método de primitiva '${expressao.simbolo.lexema}' não existe para o tipo ${tipoObjeto}.`);
            }

            const metodoDePrimitivaVetor: Function =
                primitivasVetor[expressao.simbolo.lexema].implementacao;
            if (metodoDePrimitivaVetor) {
                return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaVetor);
            }
            break;
    }

    // Objeto de uma classe JavaScript regular (ou seja, com construtor e propriedades)
    // que possua a propriedade.
    // Exemplos: classes de LinConEs, como `RetornoComando`, ou bibliotecas globais com objetos próprios.
    if (objeto.hasOwnProperty && objeto.hasOwnProperty(expressao.simbolo.lexema)) {
        return objeto[expressao.simbolo.lexema];
    }

    // Último caso: objeto simples, sem construtor, sem protótipo. Exemplo: {'a': 1, 'b': 2}
    if (typeof objeto[expressao.simbolo.lexema] !== 'undefined') {
        return objeto[expressao.simbolo.lexema];
    }

    return Promise.reject(
        new ErroEmTempoDeExecucao(
            null,
            `Método ou propriedade para objeto ou primitiva não encontrado: ${expressao.simbolo.lexema}.`,
            expressao.linha
        )
    );
}