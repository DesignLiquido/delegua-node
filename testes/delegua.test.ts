import { Delegua } from '../fontes/delegua';

describe('Delegua', () => {
    describe('Construtor', () => {
        it('Deve criar instância com funções padrão', () => {
            const delegua = new Delegua();
            expect(delegua).toBeInstanceOf(Delegua);
            expect(delegua.funcaoDeRetorno).toBeDefined();
            expect(delegua.funcaoDeRetornoMesmaLinha).toBeDefined();
        });

        it('Deve aceitar funções personalizadas', () => {
            const funcaoRetorno = jest.fn();
            const funcaoRetornoMesmaLinha = jest.fn();
            const delegua = new Delegua(funcaoRetorno, funcaoRetornoMesmaLinha);

            expect(delegua.funcaoDeRetorno).toBe(funcaoRetorno);
            expect(delegua.funcaoDeRetornoMesmaLinha).toBe(funcaoRetornoMesmaLinha);
        });
    });

    describe('versao()', () => {
        it('Deve retornar string de versão', () => {
            const delegua = new Delegua();
            const versao = delegua.versao();
            expect(typeof versao).toBe('string');
            expect(versao.length).toBeGreaterThan(0);
        });

        it('Deve conter número de versão válido', () => {
            const delegua = new Delegua();
            const versao = delegua.versao();
            // Versão deve ser número de versão ou 'desconhecida'
            expect(versao === 'desconhecida' || /^\d+\.\d+\.\d+/.test(versao)).toBe(true);
        });
    });

    describe('executarCodigoComoArgumento()', () => {
        it('Deve executar código trivial', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida = texto; });

            await delegua.executarCodigoComoArgumento('escreva("Olá Delégua!")');

            expect(saida).toBe('Olá Delégua!');
        });

        it('Deve executar com dialeto padrão', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.executarCodigoComoArgumento('escreva(1 + 1)', 'delegua');

            expect(saida).toBe('2');
        });

        it('Deve executar com dialeto pitugues', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida = texto; });

            await delegua.executarCodigoComoArgumento('escreva("pitugues")', 'pitugues');

            expect(saida).toBe('pitugues');
        });

        it('Deve definir e executar função no dialeto pitugues', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.executarCodigoComoArgumento('funcao gritar() { escreva("Oi!") }\ngritar()', 'pitugues');

            expect(saida).toContain('Oi!');
        });

        it('Deve executar com modo performance', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida = texto; });

            await delegua.executarCodigoComoArgumento('escreva("performance")', 'delegua', true);

            expect(saida).toBe('performance');
        });

        it('Deve passar argumentos do programa', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida = texto; });

            await delegua.executarCodigoComoArgumento('escreva(2 + 3)', 'delegua', false, false, []);

            expect(saida).toBe('5');
        });

        it('Deve importar biblioteca matematica', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.executarCodigoComoArgumento(
                'var mat = importar("matematica")\nescreva("importado")',
                'delegua'
            );

            expect(saida).toContain('importado');
        });
    });

    describe('executarCodigoPorArquivo()', () => {
        it('Deve executar arquivo simples', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.executarCodigoPorArquivo('./exemplos/delegua/fibonacci.delegua');

            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve executar arquivo com dialeto padrão', async () => {
            let saidas: string[] = [];
            const delegua = new Delegua((texto: string) => { saidas.push(texto); });

            await delegua.executarCodigoPorArquivo('./exemplos/delegua/fibonacci.delegua', 'delegua');

            expect(saidas.length).toBeGreaterThan(0);
        });
    });

    describe('traduzirArquivo()', () => {
        it('Deve traduzir de JavaScript para Delégua', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.traduzirArquivo(
                './exemplos/tradutores/javascript-para-delegua.js',
                'javascript-para-delegua'
            );

            expect(saida).toContain("escreva('JavaScript para Delégua!!!')");
        });

        it('Deve traduzir de Delégua para JavaScript', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.traduzirArquivo(
                './exemplos/tradutores/delegua-para-javascript.delegua',
                'delegua-para-javascript'
            );

            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve traduzir de Delégua para Python', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.traduzirArquivo(
                './exemplos/tradutores/delegua-para-python.delegua',
                'delegua-para-python'
            );

            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve traduzir de VisuAlg para Delégua', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.traduzirArquivo(
                './exemplos/tradutores/visualg-para-delegua.alg',
                'visualg-para-delegua'
            );

            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve aceitar parâmetro alvo', async () => {
            let saida = '';
            const delegua = new Delegua((texto: string) => { saida += texto; });

            await delegua.traduzirArquivo(
                './exemplos/tradutores/delegua-para-javascript.delegua',
                'delegua-para-js',
                '',
                false
            );

            expect(saida.length).toBeGreaterThan(0);
        });
    });
});
