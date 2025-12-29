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
});
