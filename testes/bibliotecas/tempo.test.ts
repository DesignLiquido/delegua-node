import { FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

import carregarBiblioteca from '../../fontes/mecanismo-importacao-bibliotecas';

// Funções do delegua-tempo 1.2.0, também presentes no módulo `tempo` do delegua-llvm.
describe('Biblioteca tempo (delegua-tempo)', () => {
    async function chamar(nome: string, ...argumentos: any[]): Promise<any> {
        const modulo = await carregarBiblioteca('tempo');
        const funcao = modulo.componentes[nome] as FuncaoPadrao;
        expect(funcao).toBeInstanceOf(FuncaoPadrao);
        return await funcao.chamar(null, argumentos, null);
    }

    it('carimboDeTempoUnixMilissegundos coincide com carimboDeTempoUnix', async () => {
        const milissegundos = await chamar('carimboDeTempoUnixMilissegundos');
        const segundos = await chamar('carimboDeTempoUnix');
        expect(Math.abs(Math.floor(milissegundos / 1000) - segundos)).toBeLessThanOrEqual(1);
    });

    it('dormir espera pelo tempo pedido, medido pelo relógio monotônico', async () => {
        const inicio = await chamar('monotonicoMilissegundos');
        await chamar('dormir', 50);
        const fim = await chamar('monotonicoMilissegundos');
        expect(fim - inicio).toBeGreaterThanOrEqual(49);
    });
});
