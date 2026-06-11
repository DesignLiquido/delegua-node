import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/delegua';
import { Literal, Variavel } from '@designliquido/delegua/construtos';
import { SimboloInterface } from '@designliquido/delegua/interfaces';

import { MicroAvaliadorAjuda } from '../../fontes/avaliador-sintatico/micro-avaliador-ajuda';

function criarSimbolo(tipo: string, lexema: string, literal: any = null): SimboloInterface {
    return { tipo, lexema, literal, linha: 1, hashArquivo: -1 };
}

describe('MicroAvaliadorAjuda', () => {
    describe('converterSimboloParaTopico', () => {
        it('Deve retornar Literal para símbolo de texto', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.TEXTO, '"escreva"', 'escreva');
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Literal);
        });

        it('Deve retornar Literal com tipo número para símbolo numérico', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.NUMERO, '42', 42);
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Literal);
        });

        it('Deve retornar Literal para VERDADEIRO', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.VERDADEIRO, 'verdadeiro', true);
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Literal);
        });

        it('Deve retornar Literal para FALSO', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.FALSO, 'falso', false);
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Literal);
        });

        it('Deve retornar Literal para NULO', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.NULO, 'nulo', null);
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Literal);
        });

        it('Deve retornar Variavel para palavra-chave PARA', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.PARA, 'para');
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Variavel);
        });

        it('Deve retornar Variavel para palavra-chave SE', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.SE, 'se');
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Variavel);
        });

        it('Deve retornar Variavel para IDENTIFICADOR', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.IDENTIFICADOR, 'minhaFuncao');
            const resultado = MicroAvaliadorAjuda.converterSimboloParaTopico(simbolo);
            expect(resultado).toBeInstanceOf(Variavel);
        });
    });

    describe('ehTopicoValido', () => {
        it('Deve retornar verdadeiro para IDENTIFICADOR', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.IDENTIFICADOR, 'escreva');
            expect(MicroAvaliadorAjuda.ehTopicoValido(simbolo)).toBe(true);
        });

        it('Deve retornar verdadeiro para TEXTO', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.TEXTO, '"ajuda"', 'ajuda');
            expect(MicroAvaliadorAjuda.ehTopicoValido(simbolo)).toBe(true);
        });

        it('Deve retornar verdadeiro para palavra-chave SE', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.SE, 'se');
            expect(MicroAvaliadorAjuda.ehTopicoValido(simbolo)).toBe(true);
        });

        it('Deve retornar verdadeiro para palavra-chave ENQUANTO', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.ENQUANTO, 'enquanto');
            expect(MicroAvaliadorAjuda.ehTopicoValido(simbolo)).toBe(true);
        });

        it('Deve retornar falso para NUMERO (não é identificador nem keyword válida)', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.NUMERO, '42', 42);
            expect(MicroAvaliadorAjuda.ehTopicoValido(simbolo)).toBe(false);
        });

        it('Deve retornar falso para EOF', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.EOF, '\0');
            expect(MicroAvaliadorAjuda.ehTopicoValido(simbolo)).toBe(false);
        });
    });

    describe('extrairNomeTopico', () => {
        it('Deve retornar o literal para símbolo de texto', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.TEXTO, '"escreva"', 'escreva');
            expect(MicroAvaliadorAjuda.extrairNomeTopico(simbolo)).toBe('escreva');
        });

        it('Deve retornar o lexema para IDENTIFICADOR', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.IDENTIFICADOR, 'minhaFuncao');
            expect(MicroAvaliadorAjuda.extrairNomeTopico(simbolo)).toBe('minhaFuncao');
        });

        it('Deve retornar o lexema para palavra-chave', () => {
            const simbolo = criarSimbolo(tiposDeSimbolos.PARA, 'para');
            expect(MicroAvaliadorAjuda.extrairNomeTopico(simbolo)).toBe('para');
        });
    });
});
