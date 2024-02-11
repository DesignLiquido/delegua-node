import { NucleoTraducao } from "../fontes/nucleo-traducao";

describe('Núcleo de tradução', () => {
    it('`traduzirArquivo`, javascript-para-delegua', () => {
        let retornoSaida: string = '';
        const funcaoDeRetorno = (saida: string) => retornoSaida += saida;
        const nucleoTraducao = new NucleoTraducao(funcaoDeRetorno);

        const processReal = process;
        const exitMock = jest.fn();

        // Mock de `process.exit`.
        // Se não for feito, o teste falha.
        global.process = { ...processReal, exit: exitMock as any };

        nucleoTraducao.iniciarTradutor('javascript-para-delegua');
        nucleoTraducao.traduzirArquivo('./exemplos/tradutores/javascript-para-delegua.js', false);

        expect(retornoSaida).toContain("escreva('JavaScript para Delégua!!!')");
        global.process = processReal;
    });
});
