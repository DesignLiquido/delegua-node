import { Delegua } from '../fontes/delegua';

describe('Avaliador sintático', () => {
    describe('analisar()', () => {
        const delegua = new Delegua('delegua');

        it('Sucesso - Olá Mundo', () => {
            const retornoLexador = delegua.lexador.mapear(
                ["escreva('Olá mundo')"],
                -1
            );
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);
        });

        it('Sucesso - Vetor vazio', () => {
            const retornoLexador = delegua.lexador.mapear(
                ['var vetorVazio = []'],
                -1
            );
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);
        });

        it('Sucesso - Dicionário vazio', () => {
            const retornoLexador = delegua.lexador.mapear(
                ['var dicionarioVazio = {}'],
                -1
            );
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);
        });

        it('Sucesso - Undefined', () => {
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(undefined as any);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(0);
        });

        it('Sucesso - Null', () => {
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(null as any);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(0);
        });

        it("Sucesso - leia sem parametro", () => {
            const retornoLexador = delegua.lexador.mapear(
                ["var nome = leia()"],
                -1
            );
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.erros).toHaveLength(0);
        });

        it("Sucesso - leia com parametro", () => {
            const retornoLexador = delegua.lexador.mapear(
                ["var nome = leia('Digite seu nome:')"],
                -1
            );
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.erros).toHaveLength(0);
        });

        it('Sucesso - para/sustar', async () => {
            const retornoLexador = delegua.lexador.mapear([
                "para (var i = 0; i < 10; i = i + 1) {",
                "   se (i == 5) { sustar; }",
                "   escreva('Valor: ', i)",
                "}"
            ], -1);
            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico.erros).toHaveLength(0);
        });

        it('Falha - sustar fora de laço de repetição', async () => {
            const retornoLexador = delegua.lexador.mapear([
                "sustar;",
            ], -1);
            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico.erros.length).toBeGreaterThan(0);
            expect(retornoAvaliadorSintatico.erros[0].message).toBe(
                '\'sustar\' ou \'pausa\' deve estar dentro de um laço de repetição.'
            );
        });

        it('Falha - continua fora de laço de repetição', async () => {
            const retornoLexador = delegua.lexador.mapear([
                "continua;",
            ], -1);
            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico.erros.length).toBeGreaterThan(0);
            expect(retornoAvaliadorSintatico.erros[0].message).toBe(
                '\'continua\' precisa estar em um laço de repetição.'
            );
        });

        it('Falha - Não é permitido ter dois identificadores seguidos na mesma linha', () => {
            const retornoLexador = delegua.lexador.mapear(
                ["escreva('Olá mundo') identificador1 identificador2"],
                -1
            );
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico.erros.length).toBeGreaterThan(0);
            expect(retornoAvaliadorSintatico.erros[0].message).toBe(
                'Não é permitido ter dois identificadores seguidos na mesma linha.'
            );
        });

        describe('Funções Anônimas', () => {
            it('Função anônima com mais de 255 parâmetros', () => {
                let acumulador = '';
                for (let i = 1; i <= 256; i++) {
                    acumulador += 'a' + i + ', ';
                }

                acumulador = acumulador.substring(0, acumulador.length - 2);

                const funcaoCom256Argumentos =
                    'var f = funcao(' + acumulador + ') {}';
                const retornoLexador = delegua.lexador.mapear(
                    [funcaoCom256Argumentos],
                    -1
                );
                const retornoAvaliadorSintatico =
                    delegua.avaliadorSintatico.analisar(retornoLexador);

                expect(retornoAvaliadorSintatico).toBeTruthy();
                expect(retornoAvaliadorSintatico.erros).toHaveLength(1);
                expect(retornoAvaliadorSintatico.erros[0].message).toBe(
                    'Não pode haver mais de 255 parâmetros'
                );
            });
        });

        it("Declaração `tente`", () => {
            const retornoLexador = delegua.lexador.mapear(
                ["tente { i = i + 1 } pegue (erro) { escreva(erro) }"],
                -1
            );
            const retornoAvaliadorSintatico =
                delegua.avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico).toBeTruthy();
        });
    });
});
