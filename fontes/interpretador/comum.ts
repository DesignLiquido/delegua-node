import { DeleguaFuncao, DeleguaModulo, FuncaoPadrao } from "@designliquido/delegua/interpretador/estruturas";
import { Const, FuncaoDeclaracao, Ajuda } from "@designliquido/delegua/declaracoes";
import { pontoEntradaAjuda } from "@designliquido/delegua/interpretador/comum";

import { ImportarBiblioteca, ModuloDeclaracoes } from "../construtos";
import { InterpretadorComImportacaoInterface } from "../interfaces/interpretador-com-importacao-interface";
import { buscarConteudoAjuda } from "./conteudo-ajuda";
import { aplicarRealceSintaxe } from "./realcador-sintaxe-ajuda";

import carregarBibliotecaNode from '../mecanismo-importacao-bibliotecas';

export async function visitarConstrutoImportarBiblioteca(
    interpretador: InterpretadorComImportacaoInterface,
    importarBiblioteca: ImportarBiblioteca
) {
    try {
        const retornoCargaBiblioteca = await carregarBibliotecaNode(importarBiblioteca.nomeBiblioteca);
        return retornoCargaBiblioteca;
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

    // Retorna o valor da constante para o modo LAIR
    return interpretador.pilhaEscoposExecucao.obterValorVariavel(declaracao.simbolo);
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

export async function visitarExpressaoModuloDeclaracoes(
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
 * Obtém ajuda para um tópico específico pelo nome.
 * Esta função é usada pelo modo de ajuda interativo.
 *
 * @param interpretador - O interpretador atual
 * @param nomeTopico - Nome do tópico a buscar
 * @returns String com a ajuda formatada ou null se não encontrado
 */
export function obterAjudaPorNome(
    interpretador: InterpretadorComImportacaoInterface,
    nomeTopico: string
): string | null {
    // Primeiro, tenta buscar no banco de dados de ajuda
    const conteudoDocs = buscarConteudoAjuda(nomeTopico);
    if (conteudoDocs) {
        return conteudoDocs;
    }

    // Se não encontrou na documentação, tenta buscar no escopo de execução
    try {
        const variavel = interpretador.pilhaEscoposExecucao.obterValorVariavel({
            lexema: nomeTopico
        } as any);

        if (!variavel) {
            return null;
        }

        const tipo = variavel.tipo || 'desconhecido';
        const valor = variavel.valor;

        // Se for uma FuncaoPadrao, usa o sistema de ajuda padrão
        if (valor instanceof FuncaoPadrao || valor.constructor?.name === 'FuncaoPadrao') {
            return pontoEntradaAjuda(true, valor);
        }

        // Se for uma DeleguaFuncao, retorna informações básicas
        if (valor instanceof DeleguaFuncao || valor.constructor?.name === 'DeleguaFuncao') {
            const funcao = valor as DeleguaFuncao;
            const parametros = funcao.declaracao.parametros
                .map((p: any) => p.abrangencia?.lexema || 'parametro')
                .join(', ');

            return `
# ${nomeTopico}(${parametros})

Função definida pelo usuário.

**Tipo de retorno:** ${funcao.declaracao.tipo || 'qualquer'}
**Número de parâmetros:** ${funcao.declaracao.parametros.length}
`;
        }

        // Se for uma variável primitiva (número, texto, lógico, vetor, dicionário)
        if (tipo === 'número' || tipo === 'texto' || tipo === 'lógico' ||
            tipo === 'vetor' || tipo === 'dicionário') {

            // Formata o valor para exibição
            let valorFormatado: string;
            if (tipo === 'texto') {
                valorFormatado = `"${valor}"`;
            } else if (tipo === 'vetor') {
                valorFormatado = JSON.stringify(valor);
            } else if (tipo === 'dicionário') {
                valorFormatado = JSON.stringify(valor, null, 2);
            } else {
                valorFormatado = String(valor);
            }

            // Busca ajuda do tipo usando prefixo 'tipo:'
            const ajudaTipo = buscarConteudoAjuda(`tipo:${tipo}`);
            const metodosDisponiveis = ajudaTipo || `\nNenhuma documentação disponível para o tipo ${tipo}.`;

            return `
# ${nomeTopico}

Variável definida pelo usuário.

**Tipo:** ${tipo}
**Valor atual:** ${valorFormatado}

---

${metodosDisponiveis}
`;
        }

        // Se chegou aqui, não conseguiu identificar o tipo
        return null;
    } catch (erro) {
        return null;
    }
}

/**
 * Extrai o nome do tópico a partir do elemento da declaração de ajuda.
 */
function extrairNomeTopico(elemento: any): string | null {
    if (!elemento) {
        return null;
    }

    // Se tem símbolo com lexema (Variavel)
    if (elemento.simbolo && elemento.simbolo.lexema) {
        return elemento.simbolo.lexema;
    }

    // Se for um Literal de texto
    if (elemento.valor !== undefined && typeof elemento.valor === 'string') {
        return elemento.valor;
    }

    // Se tem lexema diretamente
    if (elemento.lexema) {
        return elemento.lexema;
    }

    // Debug: log para ver o que recebemos
    console.log('[DEBUG] extrairNomeTopico - elemento não reconhecido:', {
        constructor: elemento.constructor?.name,
        keys: Object.keys(elemento),
        elemento: JSON.stringify(elemento, null, 2)
    });

    return null;
}

/**
 * Gera ajuda para um literal (número, texto, lógico, etc.)
 */
function gerarAjudaParaLiteral(elemento: any): string | null {
    // Verifica se é um Literal pelo nome do construtor ou pela presença de 'valor'
    const ehLiteral = elemento.constructor?.name === 'Literal' ||
                      (elemento.valor !== undefined && !elemento.simbolo);

    if (!ehLiteral) {
        return null;
    }

    const valor = elemento.valor;
    let tipo: string;
    let valorFormatado: string;

    // Infere o tipo a partir do valor
    if (typeof valor === 'number') {
        tipo = 'número';
        valorFormatado = String(valor);
    } else if (typeof valor === 'string') {
        tipo = 'texto';
        valorFormatado = `"${valor}"`;
    } else if (typeof valor === 'boolean') {
        tipo = 'lógico';
        valorFormatado = valor ? 'verdadeiro' : 'falso';
    } else if (valor === null || valor === undefined) {
        tipo = 'nulo';
        valorFormatado = 'nulo';
    } else if (Array.isArray(valor)) {
        tipo = 'vetor';
        valorFormatado = JSON.stringify(valor);
    } else if (typeof valor === 'object') {
        tipo = 'dicionário';
        valorFormatado = JSON.stringify(valor, null, 2);
    } else {
        return null;
    }

    // Busca ajuda do tipo
    const ajudaTipo = buscarConteudoAjuda(`tipo:${tipo}`);
    const metodosDisponiveis = ajudaTipo || `\nNenhuma documentação disponível para o tipo ${tipo}.`;

    return `
# Literal: ${valorFormatado}

Valor literal do tipo ${tipo}.

**Tipo:** ${tipo}
**Valor:** ${valorFormatado}

---

${metodosDisponiveis}
`;
}

/**
 * Função auxiliar para processar declarações de ajuda no modo interativo.
 * - ajuda() sem argumentos: entra no modo interativo
 * - ajuda(topico) com argumento: exibe ajuda do tópico diretamente
 *
 * @param declaracao - A declaração de ajuda
 * @returns Texto de ajuda ou objeto para entrar em modo interativo
 */
export async function visitarDeclaracaoAjuda(
    interpretador: InterpretadorComImportacaoInterface,
    declaracao: Ajuda
): Promise<any> {
    // Se a ajuda foi chamada como função (com argumentos)
    if (declaracao.funcao && declaracao.elemento) {
        // Primeiro, verifica se é um literal
        const ajudaLiteral = gerarAjudaParaLiteral(declaracao.elemento);
        if (ajudaLiteral) {
            const conteudoComRealce = aplicarRealceSintaxe(ajudaLiteral);
            return Promise.resolve({
                __conteudoAjuda: true,
                conteudo: conteudoComRealce
            });
        }

        // Se não é literal, tenta extrair o nome do tópico
        const nomeTopico = extrairNomeTopico(declaracao.elemento);

        if (nomeTopico) {
            // Busca o conteúdo de ajuda
            const conteudo = obterAjudaPorNome(interpretador, nomeTopico);

            if (conteudo) {
                // Aplica realce de sintaxe e retorna com flag especial
                const conteudoComRealce = aplicarRealceSintaxe(conteudo);
                return Promise.resolve({
                    __conteudoAjuda: true,
                    conteudo: conteudoComRealce
                });
            }
        }

        // Fallback para o sistema de ajuda padrão
        const ajudaPadrao = pontoEntradaAjuda(declaracao.funcao, declaracao.elemento);
        return Promise.resolve({
            __conteudoAjuda: true,
            conteudo: ajudaPadrao
        });
    }

    // Se ajuda foi chamada sem argumentos, sinaliza entrada no modo interativo
    // Retorna um objeto especial que o REPL reconhece
    return Promise.resolve({
        __modoAjuda: true,
        tipo: 'modo-ajuda',
        mensagem: 'Entrando no modo de ajuda interativo...'
    });
}
