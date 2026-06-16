import { NucleoTraducao } from "../fontes/nucleo-traducao";

describe('Núcleo de tradução', () => {
    it('`traduzirArquivo`, javascript-para-delegua', async () => {
        let retornoSaida: string = '';
        const funcaoDeRetorno = (saida: string) => retornoSaida += saida;
        const nucleoTraducao = new NucleoTraducao(funcaoDeRetorno);

        nucleoTraducao.iniciarTradutor('javascript-para-delegua');
        await nucleoTraducao.traduzirArquivo('./exemplos/tradutores/javascript-para-delegua.js', false);

        expect(retornoSaida).toContain("escreva('JavaScript para Delégua!!!')");
    });

    describe('iniciarTradutor', () => {
        it('delegua-para-arm', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-arm');
            expect(nucleoTraducao.tradutor).toBeDefined();
            expect(nucleoTraducao.importador).toBeDefined();
            expect(nucleoTraducao.avaliadorSintatico).toBeDefined();
        });

        it('delegua-para-arm com alvo android', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-arm', 'android');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('delegua-para-assemblyscript', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-assemblyscript');
            expect(nucleoTraducao.tradutor).toBeDefined();
            expect(nucleoTraducao.importador).toBeDefined();
        });

        it('delegua-para-as (alias de assemblyscript)', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-as');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('delegua-para-elixir', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-elixir');
            expect(nucleoTraducao.tradutor).toBeDefined();
            expect(nucleoTraducao.importador).toBeDefined();
        });

        it('delegua-para-javascript', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-javascript');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('delegua-para-js (alias de javascript)', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-js');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('delegua-para-python', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-python');
            expect(nucleoTraducao.tradutor).toBeDefined();
            expect(nucleoTraducao.importador).toBeDefined();
        });

        it('delegua-para-py (alias de python)', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-py');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('delegua-para-ruby', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-ruby');
            expect(nucleoTraducao.tradutor).toBeDefined();
            expect(nucleoTraducao.importador).toBeDefined();
        });

        it('delegua-para-x64 (alvo padrão linux)', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-x64');
            expect(nucleoTraducao.tradutor).toBeDefined();
            expect(nucleoTraducao.importador).toBeDefined();
        });

        it('delegua-para-x64 com alvo windows', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('delegua-para-x64', 'windows');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('javascript-para-delegua', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('javascript-para-delegua');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('alg-para-delegua', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('alg-para-delegua');
            expect(nucleoTraducao.tradutor).toBeDefined();
            expect(nucleoTraducao.importador).toBeDefined();
        });

        it('visualg-para-delegua (alias de alg-para-delegua)', () => {
            const nucleoTraducao = new NucleoTraducao();
            nucleoTraducao.iniciarTradutor('visualg-para-delegua');
            expect(nucleoTraducao.tradutor).toBeDefined();
        });

        it('Deve lançar erro para tradutor desconhecido', () => {
            const nucleoTraducao = new NucleoTraducao();
            expect(() => {
                nucleoTraducao.iniciarTradutor('invalido-para-invalido');
            }).toThrow("Tradutor 'invalido-para-invalido' não implementado.");
        });
    });

    describe('traduzirArquivo', () => {
        it('Deve traduzir Delégua para JavaScript', async () => {
            let saida = '';
            const nucleoTraducao = new NucleoTraducao((texto: string) => { saida += texto; });
            nucleoTraducao.iniciarTradutor('delegua-para-javascript');
            await nucleoTraducao.traduzirArquivo('./exemplos/tradutores/delegua-para-javascript.delegua', false);
            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve traduzir Delégua para Python', async () => {
            let saida = '';
            const nucleoTraducao = new NucleoTraducao((texto: string) => { saida += texto; });
            nucleoTraducao.iniciarTradutor('delegua-para-python');
            await nucleoTraducao.traduzirArquivo('./exemplos/tradutores/delegua-para-python.delegua', false);
            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve traduzir Delégua para AssemblyScript', async () => {
            let saida = '';
            const nucleoTraducao = new NucleoTraducao((texto: string) => { saida += texto; });
            nucleoTraducao.iniciarTradutor('delegua-para-assemblyscript');
            await nucleoTraducao.traduzirArquivo('./exemplos/tradutores/delegua-para-assemblyscript.delegua', false);
            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve traduzir VisuAlg para Delégua', async () => {
            let saida = '';
            const nucleoTraducao = new NucleoTraducao((texto: string) => { saida += texto; });
            nucleoTraducao.iniciarTradutor('visualg-para-delegua');
            await nucleoTraducao.traduzirArquivo('./exemplos/tradutores/visualg-para-delegua.alg', false);
            expect(saida.length).toBeGreaterThan(0);
        });

        it('Deve usar funções padrão quando não fornecidas', () => {
            const nucleoTraducao = new NucleoTraducao();
            expect(nucleoTraducao.funcaoDeRetorno).toBeDefined();
            expect(nucleoTraducao.funcaoDeRetornoMesmaLinha).toBeDefined();
        });
    });
});
