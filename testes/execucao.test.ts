import { inferirDialetoPorExtensao, extensoesDialetos } from '../fontes/execucao';

describe('inferirDialetoPorExtensao', () => {
    it('deve retornar "pitugues" para extensão .pitugues', () => {
        expect(inferirDialetoPorExtensao('exemplo.pitugues')).toBe('pitugues');
    });

    it('deve retornar "visualg" para extensão .alg', () => {
        expect(inferirDialetoPorExtensao('programa.alg')).toBe('visualg');
    });

    it('deve retornar "birl" para extensão .birl', () => {
        expect(inferirDialetoPorExtensao('codigo.birl')).toBe('birl');
    });

    it('deve retornar "egua" para extensão .egua', () => {
        expect(inferirDialetoPorExtensao('script.egua')).toBe('egua');
    });

    it('deve retornar "mapler" para extensão .mapler', () => {
        expect(inferirDialetoPorExtensao('arquivo.mapler')).toBe('mapler');
    });

    it('deve retornar "portugol-studio" para extensão .por', () => {
        expect(inferirDialetoPorExtensao('ola-mundo.por')).toBe('portugol-studio');
    });

    it('deve retornar undefined para extensão .delegua (dialeto padrão sem mapeamento explícito)', () => {
        expect(inferirDialetoPorExtensao('programa.delegua')).toBeUndefined();
    });

    it('deve retornar undefined para extensão desconhecida', () => {
        expect(inferirDialetoPorExtensao('arquivo.txt')).toBeUndefined();
    });

    it('deve tratar extensões em maiúsculas corretamente', () => {
        expect(inferirDialetoPorExtensao('exemplo.PITUGUES')).toBe('pitugues');
        expect(inferirDialetoPorExtensao('programa.ALG')).toBe('visualg');
    });

    it('deve funcionar com caminhos absolutos', () => {
        expect(inferirDialetoPorExtensao('/home/usuario/projetos/fibonacci.pitugues')).toBe('pitugues');
        expect(inferirDialetoPorExtensao('C:\\projetos\\ola-mundo.por')).toBe('portugol-studio');
    });

    it('deve cobrir todos os dialetos mapeados em extensoesDialetos', () => {
        for (const [extensao, dialeto] of Object.entries(extensoesDialetos)) {
            expect(inferirDialetoPorExtensao(`arquivo${extensao}`)).toBe(dialeto);
        }
    });
});
