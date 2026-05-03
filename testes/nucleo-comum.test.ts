import { NucleoComum } from "../fontes/nucleo-comum";
import { RetornoLexadorInterface, RetornoAvaliadorSintaticoInterface, SimboloInterface } from "@designliquido/delegua/interfaces";
import { Declaracao } from "@designliquido/delegua";
import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/delegua';

// Classe concreta para testar a classe abstrata NucleoComum
class NucleoComumTeste extends NucleoComum {
    public chamarAfericaoErrosLexador(retornoLexador: RetornoLexadorInterface<SimboloInterface>): boolean {
        return this.afericaoErrosLexador(retornoLexador);
    }

    public chamarAfericaoErrosAvaliadorSintatico(retornoAvaliadorSintatico: RetornoAvaliadorSintaticoInterface<Declaracao>): boolean {
        return this.afericaoErrosAvaliadorSintatico(retornoAvaliadorSintatico);
    }

    public chamarReportar(linha: number, onde: any, mensagem: string): void {
        return this.reportar(linha, onde, mensagem);
    }

    public chamarErro(simbolo: SimboloInterface, mensagemDeErro: string): void {
        return this.erro(simbolo, mensagemDeErro);
    }
}

describe('Núcleo Comum', () => {
    let nucleoComum: NucleoComumTeste;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        nucleoComum = new NucleoComumTeste();
        consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('afericaoErrosLexador', () => {
        it('Deve retornar verdadeiro quando há erros no lexador', () => {
            const retornoLexador: RetornoLexadorInterface<SimboloInterface> = {
                simbolos: [],
                erros: [
                    {
                        linha: 1,
                        caractere: 'x',
                        mensagem: 'Caractere inválido'
                    }
                ]
            };

            const resultado = nucleoComum.chamarAfericaoErrosLexador(retornoLexador);

            expect(resultado).toBe(true);
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('Deve retornar falso quando não há erros no lexador', () => {
            const retornoLexador: RetornoLexadorInterface<SimboloInterface> = {
                simbolos: [],
                erros: []
            };

            const resultado = nucleoComum.chamarAfericaoErrosLexador(retornoLexador);

            expect(resultado).toBe(false);
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it('Deve reportar múltiplos erros do lexador', () => {
            const retornoLexador: RetornoLexadorInterface<SimboloInterface> = {
                simbolos: [],
                erros: [
                    {
                        linha: 1,
                        caractere: 'x',
                        mensagem: 'Primeiro erro'
                    },
                    {
                        linha: 2,
                        caractere: 'y',
                        mensagem: 'Segundo erro'
                    }
                ]
            };

            const resultado = nucleoComum.chamarAfericaoErrosLexador(retornoLexador);

            expect(resultado).toBe(true);
            expect(consoleSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('afericaoErrosAvaliadorSintatico', () => {
        it('Deve retornar verdadeiro quando há erros no avaliador sintático', () => {
            const simbolo: SimboloInterface = {
                tipo: tiposDeSimbolos.IDENTIFICADOR,
                lexema: 'teste',
                literal: 'teste',
                linha: 1, 
                hashArquivo: -1
            };

            const retornoAvaliadorSintatico: RetornoAvaliadorSintaticoInterface<Declaracao> = {
                declaracoes: [],
                erros: [
                    {
                        simbolo: simbolo,
                        message: 'Erro de sintaxe',
                        hashArquivo: -1,
                        linha: 1, 
                        name: '123',
                        simboloRelacionado: simbolo,
                        codigoDiagnostico: 'QUALQUER'
                    }
                ]
            };

            const resultado = nucleoComum.chamarAfericaoErrosAvaliadorSintatico(retornoAvaliadorSintatico);

            expect(resultado).toBe(true);
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('Deve retornar falso quando não há erros no avaliador sintático', () => {
            const retornoAvaliadorSintatico: RetornoAvaliadorSintaticoInterface<Declaracao> = {
                declaracoes: [],
                erros: []
            };

            const resultado = nucleoComum.chamarAfericaoErrosAvaliadorSintatico(retornoAvaliadorSintatico);

            expect(resultado).toBe(false);
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it('Deve reportar múltiplos erros do avaliador sintático', () => {
            const simbolo1: SimboloInterface = {
                tipo: tiposDeSimbolos.IDENTIFICADOR,
                lexema: 'teste1',
                literal: 'teste1',
                linha: 1,
                hashArquivo: -1
            };

            const simbolo2: SimboloInterface = {
                tipo: tiposDeSimbolos.IDENTIFICADOR,
                lexema: 'teste2',
                literal: 'teste2',
                linha: 2,
                hashArquivo: -1
            };

            const retornoAvaliadorSintatico: RetornoAvaliadorSintaticoInterface<Declaracao> = {
                declaracoes: [],
                erros: [
                    {
                        simbolo: simbolo1,
                        message: 'Primeiro erro',
                        hashArquivo: -1,
                        linha: 1, 
                        name: '123',
                        simboloRelacionado: simbolo1,
                        codigoDiagnostico: 'QUALQUER'
                    },
                    {
                        simbolo: simbolo2,
                        message: 'Segundo erro',
                        hashArquivo: -1,
                        linha: 1, 
                        name: '123',
                        simboloRelacionado: simbolo2,
                        codigoDiagnostico: 'QUALQUER'
                    }
                ]
            };

            const resultado = nucleoComum.chamarAfericaoErrosAvaliadorSintatico(retornoAvaliadorSintatico);

            expect(resultado).toBe(true);
            expect(consoleSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('reportar', () => {
        it('Deve reportar erro com formatação correta', () => {
            nucleoComum.chamarReportar(10, " no 'teste'", 'Mensagem de erro');

            expect(consoleSpy).toHaveBeenCalled();
            const chamada = consoleSpy.mock.calls[0][0];
            expect(chamada).toContain('[Linha: 10]');
            expect(chamada).toContain("Erro no 'teste': Mensagem de erro");
        });
    });

    describe('erro', () => {
        it('Deve reportar erro quando símbolo não é EOF', () => {
            const simbolo: SimboloInterface = {
                tipo: tiposDeSimbolos.IDENTIFICADOR,
                lexema: 'variavel',
                literal: 'variavel',
                linha: 5,
                hashArquivo: -1
            };

            nucleoComum.chamarErro(simbolo, 'Erro na variável');

            expect(consoleSpy).toHaveBeenCalled();
            const chamada = consoleSpy.mock.calls[0][0];
            expect(chamada).toContain('[Linha: 5]');
            expect(chamada).toContain("no 'variavel'");
        });

        it('Deve reportar erro quando símbolo é EOF', () => {
            const simbolo: SimboloInterface = {
                tipo: tiposDeSimbolos.EOF,
                lexema: '\0',
                literal: '',
                linha: 20,
                hashArquivo: -1
            };

            nucleoComum.chamarErro(simbolo, 'Fim inesperado do arquivo');

            expect(consoleSpy).toHaveBeenCalled();
            const chamada = consoleSpy.mock.calls[0][0];
            expect(chamada).toContain('[Linha: 20]');
            expect(chamada).toContain('no final do código');
        });

        it('Deve usar valores padrão quando símbolo é indefinido', () => {
            nucleoComum.chamarErro(null as any, 'Erro com símbolo indefinido');

            expect(consoleSpy).toHaveBeenCalled();
            const chamada = consoleSpy.mock.calls[0][0];
            expect(chamada).toContain('[Linha: -1]');
        });
    });
});
