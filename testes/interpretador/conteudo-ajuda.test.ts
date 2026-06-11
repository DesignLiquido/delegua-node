import {
    normalizarParaBusca,
    buscarConteudoAjuda,
    listarTopicos
} from '../../fontes/interpretador/conteudo-ajuda';

describe('conteudo-ajuda', () => {
    describe('normalizarParaBusca', () => {
        it('Deve converter para minúsculas', () => {
            expect(normalizarParaBusca('ESCREVA')).toBe('escreva');
        });

        it('Deve remover acentos', () => {
            expect(normalizarParaBusca('função')).toBe('funcao');
            expect(normalizarParaBusca('número')).toBe('numero');
        });

        it('Deve combinar minúsculas e remoção de acentos', () => {
            expect(normalizarParaBusca('Função')).toBe('funcao');
            expect(normalizarParaBusca('NÚMERO')).toBe('numero');
        });

        it('Deve manter texto sem acentos inalterado (exceto caixa)', () => {
            expect(normalizarParaBusca('escreva')).toBe('escreva');
            expect(normalizarParaBusca('para')).toBe('para');
        });
    });

    describe('buscarConteudoAjuda', () => {
        it('Deve retornar conteúdo para tópico exato existente', () => {
            const resultado = buscarConteudoAjuda('escreva');
            expect(resultado).not.toBeNull();
            expect(typeof resultado).toBe('string');
            expect(resultado!.length).toBeGreaterThan(0);
        });

        it('Deve retornar conteúdo para tópico em maiúsculas (busca normalizada)', () => {
            const resultadoExato = buscarConteudoAjuda('escreva');
            const resultadoMaiusculo = buscarConteudoAjuda('ESCREVA');
            expect(resultadoMaiusculo).toBe(resultadoExato);
        });

        it('Deve retornar nulo para tópico inexistente', () => {
            const resultado = buscarConteudoAjuda('topico-que-nao-existe-xyz');
            expect(resultado).toBeNull();
        });

        it('Deve retornar conteúdo para tópico com variação de acentuação', () => {
            const topicos = listarTopicos();
            const topicoComAcento = topicos.find(t => /[áéíóúãõâêîôûàèìòùç]/i.test(t));
            if (topicoComAcento) {
                const resultadoNormalizado = buscarConteudoAjuda(normalizarParaBusca(topicoComAcento));
                expect(resultadoNormalizado).not.toBeNull();
            }
        });
    });

    describe('listarTopicos', () => {
        it('Deve retornar lista não-vazia de tópicos', () => {
            const topicos = listarTopicos();
            expect(topicos.length).toBeGreaterThan(0);
        });

        it('Deve retornar lista ordenada', () => {
            const topicos = listarTopicos();
            const ordenados = [...topicos].sort();
            expect(topicos).toEqual(ordenados);
        });

        it('Deve incluir tópico "escreva"', () => {
            const topicos = listarTopicos();
            expect(topicos).toContain('escreva');
        });
    });
});
