import { Const, FuncaoDeclaracao } from "@designliquido/delegua/declaracoes";
import { DeleguaFuncao, DeleguaModulo } from "@designliquido/delegua/interpretador/estruturas";
import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/delegua';

import { ImportarBiblioteca, ModuloDeclaracoes } from "../../fontes/construtos";
import { InterpretadorComImportacaoInterface } from "../../fontes/interfaces/interpretador-com-importacao-interface";
import {
    visitarConstrutoImportarBiblioteca,
    visitarDeclaracaoConst,
    visitarDeclaracaoDefinicaoFuncao,
    visitarExpressaoModuloDeclaracoes
} from "../../fontes/interpretador/comum";

// Mock do mecanismo de importação de bibliotecas
jest.mock('../../fontes/mecanismo-importacao-bibliotecas', () => {
    return jest.fn();
});

describe('Interpretador Comum', () => {
    let interpretadorMock: InterpretadorComImportacaoInterface;

    beforeEach(() => {
        interpretadorMock = {
            erros: [],
            pilhaEscoposExecucao: {
                definirConstante: jest.fn(),
                definirVariavel: jest.fn(),
                registrarReferenciaFuncao: jest.fn(),
                obterValorVariavel: jest.fn(),
                obterReferenciaFuncao: jest.fn()
            },
            avaliar: jest.fn()
        } as any;
    });

    describe('visitarConstrutoImportarBiblioteca', () => {
        it('Deve importar biblioteca com sucesso', async () => {
            const carregarBibliotecaNode = require('../../fontes/mecanismo-importacao-bibliotecas');
            const bibliotecaMock = { funcao: () => 'teste' };
            carregarBibliotecaNode.mockResolvedValue(bibliotecaMock);

            const importarBiblioteca = new ImportarBiblioteca(-1, 1, 'fs');

            const resultado = await visitarConstrutoImportarBiblioteca(
                interpretadorMock,
                importarBiblioteca
            );

            expect(resultado).toBe(bibliotecaMock);
            expect(carregarBibliotecaNode).toHaveBeenCalledWith('fs');
        });

        it('Deve adicionar erro quando importação falha', async () => {
            const carregarBibliotecaNode = require('../../fontes/mecanismo-importacao-bibliotecas');
            const erroMock = new Error('Biblioteca não encontrada');
            carregarBibliotecaNode.mockRejectedValue(erroMock);

            const importarBiblioteca = new ImportarBiblioteca(-1, 1, 'biblioteca-inexistente');

            const resultado = await visitarConstrutoImportarBiblioteca(
                interpretadorMock,
                importarBiblioteca
            );

            expect(resultado).toBeNull();
            expect(interpretadorMock.erros).toContain(erroMock);
        });

        it('Deve tratar erro genérico na importação', async () => {
            const carregarBibliotecaNode = require('../../fontes/mecanismo-importacao-bibliotecas');
            const erroMock = { mensagem: 'Erro desconhecido' };
            carregarBibliotecaNode.mockRejectedValue(erroMock);

            const importarBiblioteca = new ImportarBiblioteca(-1, 1, 'outra-biblioteca');

            const resultado = await visitarConstrutoImportarBiblioteca(
                interpretadorMock,
                importarBiblioteca
            );

            expect(resultado).toBeNull();
            expect(interpretadorMock.erros.length).toBe(1);
        });
    });

    describe('visitarDeclaracaoConst', () => {
        it('Deve definir constante com valor simples', async () => {
            const simbolo = {
                tipo: tiposDeSimbolos.CONSTANTE,
                lexema: 'PI',
                literal: '',
                linha: 1,
                hashArquivo: -1
            };

            const declaracao = new Const(
                simbolo,
                null as any,
                'número'
            );

            (interpretadorMock as any).avaliacaoDeclaracaoVarOuConst = jest.fn().mockResolvedValue(3.14);
            (interpretadorMock.pilhaEscoposExecucao.obterValorVariavel as jest.Mock).mockReturnValue({ valor: 3.14, tipo: 'número' });

            const resultado = await visitarDeclaracaoConst(interpretadorMock, declaracao);

            expect(interpretadorMock.pilhaEscoposExecucao.definirConstante).toHaveBeenCalledWith(
                'PI',
                3.14,
                'número'
            );
            expect(resultado).toEqual({ valor: 3.14, tipo: 'número' });
        });

        it('Deve definir constante com definição de função', async () => {
            const simbolo = {
                tipo: tiposDeSimbolos.CONSTANTE,
                lexema: 'somar',
                literal: '',
                linha: 1,
                hashArquivo: -1
            };

            const declaracaoFuncao = { nome: 'somar' };
            const valorFuncao = {
                operacao: 'DefinicaoFuncao',
                declaracao: declaracaoFuncao
            };

            const declaracao = new Const(
                simbolo,
                null as any,
                'função'
            );

            (interpretadorMock as any).avaliacaoDeclaracaoVarOuConst = jest.fn().mockResolvedValue(valorFuncao);
            (interpretadorMock.pilhaEscoposExecucao.obterValorVariavel as jest.Mock).mockReturnValue(declaracaoFuncao);

            const resultado = await visitarDeclaracaoConst(interpretadorMock, declaracao);

            expect(interpretadorMock.pilhaEscoposExecucao.definirConstante).toHaveBeenCalledWith(
                'somar',
                declaracaoFuncao,
                'função'
            );
            expect(resultado).toBe(declaracaoFuncao);
        });

        it('Deve retornar valor da constante após definição', async () => {
            const simbolo = {
                tipo: tiposDeSimbolos.CONSTANTE,
                lexema: 'nome',
                literal: '',
                linha: 1,
                hashArquivo: -1
            };

            const declaracao = new Const(
                simbolo,
                null as any,
                'texto'
            );

            const valorEsperado = { valor: 'João', tipo: 'texto' };
            (interpretadorMock as any).avaliacaoDeclaracaoVarOuConst = jest.fn().mockResolvedValue('João');
            (interpretadorMock.pilhaEscoposExecucao.obterValorVariavel as jest.Mock).mockReturnValue(valorEsperado);

            const resultado = await visitarDeclaracaoConst(interpretadorMock, declaracao);

            expect(interpretadorMock.pilhaEscoposExecucao.obterValorVariavel).toHaveBeenCalledWith(simbolo);
            expect(resultado).toEqual(valorEsperado);
        });
    });

    describe('visitarDeclaracaoDefinicaoFuncao', () => {
        it('Deve definir função corretamente', async () => {
            const simbolo = {
                tipo: tiposDeSimbolos.FUNCAO,
                lexema: 'teste',
                literal: '',
                linha: 1,
                hashArquivo: -1
            };

            const funcaoDeclaracao = new FuncaoDeclaracao(
                simbolo,
                { tipo: 'número', tipoExplicito: true } as any
            );

            const resultado = await visitarDeclaracaoDefinicaoFuncao(
                interpretadorMock,
                funcaoDeclaracao
            );

            expect(interpretadorMock.pilhaEscoposExecucao.definirVariavel).toHaveBeenCalled();
            expect(interpretadorMock.pilhaEscoposExecucao.registrarReferenciaFuncao).toHaveBeenCalled();
            expect(resultado).toHaveProperty('nome', 'teste');
            expect(resultado).toHaveProperty('operacao', 'DefinicaoFuncao');
            expect(resultado).toHaveProperty('tipo', 'função<número>');
            expect(resultado).toHaveProperty('tipoExplicito', true);
            expect(resultado).toHaveProperty('declaracao');
        });

        it('Deve registrar função com tipo "qualquer" quando não especificado', async () => {
            const simbolo = {
                tipo: tiposDeSimbolos.FUNCAO,
                lexema: 'funcaoSemTipo',
                literal: '',
                linha: 1,
                hashArquivo: -1
            };

            const funcaoDeclaracao = new FuncaoDeclaracao(
                simbolo,
                { tipo: undefined } as any
            );

            const resultado = await visitarDeclaracaoDefinicaoFuncao(
                interpretadorMock,
                funcaoDeclaracao
            );

            expect(resultado.tipo).toBe('função<qualquer>');
        });

        it('Deve criar DeleguaFuncao com nome correto', async () => {
            const simbolo = {
                tipo: tiposDeSimbolos.FUNCAO,
                lexema: 'minhaFuncao',
                literal: '',
                linha: 1,
                hashArquivo: -1
            };

            const funcaoDeclaracao = new FuncaoDeclaracao(
                simbolo,
                { tipo: 'texto' } as any
            );

            await visitarDeclaracaoDefinicaoFuncao(
                interpretadorMock,
                funcaoDeclaracao
            );

            const chamadaDefinirVariavel = (interpretadorMock.pilhaEscoposExecucao.definirVariavel as jest.Mock).mock.calls[0];
            expect(chamadaDefinirVariavel[0]).toBe('minhaFuncao');
            expect(chamadaDefinirVariavel[1]).toBeInstanceOf(DeleguaFuncao);
        });
    });

    describe('visitarExpressaoModuloDeclaracoes', () => {
        it('Deve criar módulo vazio quando não há declarações', async () => {
            const moduloDeclaracoes = new ModuloDeclaracoes(1, -1, []);

            const resultado = await visitarExpressaoModuloDeclaracoes(
                interpretadorMock,
                moduloDeclaracoes
            );

            expect(resultado).toBeInstanceOf(DeleguaModulo);
            expect(Object.keys(resultado.componentes)).toHaveLength(0);
        });

        it('Deve adicionar função ao módulo', async () => {
            const funcaoMock = new DeleguaFuncao('teste', {} as any);
            const declaracaoMock = { id: 1 };

            (interpretadorMock.avaliar as jest.Mock).mockResolvedValue({
                operacao: 'DefinicaoFuncao',
                nome: 'teste',
                id: 1
            });

            (interpretadorMock.pilhaEscoposExecucao.obterReferenciaFuncao as jest.Mock).mockReturnValue(funcaoMock);

            const moduloDeclaracoes = new ModuloDeclaracoes(1, -1, [declaracaoMock as any]);

            const resultado = await visitarExpressaoModuloDeclaracoes(
                interpretadorMock,
                moduloDeclaracoes
            );

            expect(resultado).toBeInstanceOf(DeleguaModulo);
            expect(resultado.componentes['teste']).toBe(funcaoMock);
        });

        it('Deve processar múltiplas funções no módulo', async () => {
            const funcao1 = new DeleguaFuncao('funcao1', {} as any);
            const funcao2 = new DeleguaFuncao('funcao2', {} as any);

            (interpretadorMock.avaliar as jest.Mock)
                .mockResolvedValueOnce({
                    operacao: 'DefinicaoFuncao',
                    nome: 'funcao1',
                    id: 1
                })
                .mockResolvedValueOnce({
                    operacao: 'DefinicaoFuncao',
                    nome: 'funcao2',
                    id: 2
                });

            (interpretadorMock.pilhaEscoposExecucao.obterReferenciaFuncao as jest.Mock)
                .mockReturnValueOnce(funcao1)
                .mockReturnValueOnce(funcao2);

            const moduloDeclaracoes = new ModuloDeclaracoes(1, -1, [
                { id: 1 } as any,
                { id: 2 } as any
            ]);

            const resultado = await visitarExpressaoModuloDeclaracoes(
                interpretadorMock,
                moduloDeclaracoes
            );

            expect(resultado.componentes['funcao1']).toBe(funcao1);
            expect(resultado.componentes['funcao2']).toBe(funcao2);
        });

        it('Deve ignorar componentes nulos', async () => {
            (interpretadorMock.avaliar as jest.Mock).mockResolvedValue(null);

            const moduloDeclaracoes = new ModuloDeclaracoes(1, -1, [
                { id: 1 } as any
            ]);

            const resultado = await visitarExpressaoModuloDeclaracoes(
                interpretadorMock,
                moduloDeclaracoes
            );

            expect(resultado).toBeInstanceOf(DeleguaModulo);
            expect(Object.keys(resultado.componentes)).toHaveLength(0);
        });

        it('Deve emitir warning para operações não tratadas', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            (interpretadorMock.avaliar as jest.Mock).mockResolvedValue({
                operacao: 'OperacaoDesconhecida',
                nome: 'teste'
            });

            const moduloDeclaracoes = new ModuloDeclaracoes(1, -1, [
                { id: 1 } as any
            ]);

            await visitarExpressaoModuloDeclaracoes(
                interpretadorMock,
                moduloDeclaracoes
            );

            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });

        it('Deve processar componente sem propriedade operacao', async () => {
            (interpretadorMock.avaliar as jest.Mock).mockResolvedValue({
                nome: 'semOperacao'
            });

            const moduloDeclaracoes = new ModuloDeclaracoes(1, -1, [
                { id: 1 } as any
            ]);

            const resultado = await visitarExpressaoModuloDeclaracoes(
                interpretadorMock,
                moduloDeclaracoes
            );

            // Não deve adicionar ao módulo, mas também não deve dar erro
            expect(resultado).toBeInstanceOf(DeleguaModulo);
        });
    });
});
