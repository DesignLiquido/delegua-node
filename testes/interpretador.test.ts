import { Delegua } from '../fontes/delegua';

describe('Interpretador', () => {
    describe('interpretar()', () => {
        let delegua: Delegua;

        beforeEach(() => {
            delegua = new Delegua('delegua');
        });

        describe('Cenários de sucesso', () => {
            describe('Importar', () => {
                it('Importar biblioteca externa', async () => {
                    const retornoLexador = delegua.lexador.mapear(["var commander = importar('commander')"], -1);
                    const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                    const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                    expect(retornoInterpretador.erros).toHaveLength(0);
                });

                describe('Importar bibliotecas delegua', () => {
                    describe('testa importação da biblioteca de estatística', () => {
                        beforeEach(() => {
                            jest.mock('./__mocks__/estatistica.ts');
                        })
                        afterAll(() => {
                            jest.unmock("./__mocks__/estatistica.ts")
                        })
                        it('estatística' , async () => {
                            const retornoLexador = delegua.lexador.mapear(["var estatística = importar('estatística')"], -1);
                            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                            const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                            expect(retornoInterpretador.erros).toHaveLength(0);
                        });

                        it('estatistica' , async () => {
                            const retornoLexador = delegua.lexador.mapear(["var estatistica = importar('estatistica')"], -1);
                            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                            const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                            expect(retornoInterpretador.erros).toHaveLength(0);
                        });
                    })

                    describe('testa importação da biblioteca de física', () => {
                        beforeEach(() => {
                            jest.mock('./__mocks__/fisica.ts');
                        })
                        afterEach(() => {
                            jest.unmock("./__mocks__/fisica.ts")
                        })
                        it('física' , async () => {
                            const retornoLexador = delegua.lexador.mapear(["var física = importar('física')"], -1);
                            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                            const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                            expect(retornoInterpretador.erros).toHaveLength(0);
                        });

                        it('fisica' , async () => {
                            const retornoLexador = delegua.lexador.mapear(["var fisica = importar('fisica')"], -1);
                            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                            const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                            expect(retornoInterpretador.erros).toHaveLength(0);
                        });
                    })

                    describe('testa importação da biblioteca de matemática', () => {
                        beforeEach(() => {
                            jest.mock('./__mocks__/matematica.ts');
                        })
                        afterAll(() => {
                            jest.unmock("./__mocks__/matematica.ts")
                        })
                        it('matemática com acento', async () => {
                            const retornoLexador = delegua.lexador.mapear(["var matemática = importar('matemática')"], -1);
                            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                            const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                            expect(retornoInterpretador.erros).toHaveLength(0);
                        });

                        it('matematica sem acento', async () => {
                            const retornoLexador = delegua.lexador.mapear(["var matematica = importar('matematica')"], -1);
                            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                            const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                            expect(retornoInterpretador.erros).toHaveLength(0);
                        });
                    })
                })
            });
        });

        describe('Cenários de falha', () => {
            describe('Importar', () => {
                it('Importar biblioteca externa que não existe', async () => {
                    const retornoLexador = delegua.lexador.mapear(["var naoexiste = importar('naoexiste')"], -1);
                    const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);
                    const retornoInterpretador = await delegua.interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

                    expect(retornoInterpretador.erros.length).toBeGreaterThan(0);
                })
            });
        });
    });
});
