import carregarBibliotecaNode, {
    carregarBibliotecaDelegua,
    definirArgumentosPrograma,
    definirFabricaPainelWebView,
    verificarModulosDelegua,
} from '../fontes/mecanismo-importacao-bibliotecas';

describe('Mecanismo de importação de bibliotecas', () => {
    describe('verificarModulosDelegua', () => {
        it('Deve retornar nome do pacote para módulo conhecido', () => {
            expect(verificarModulosDelegua('matematica')).toBe('@designliquido/delegua-matematica');
            expect(verificarModulosDelegua('matemática')).toBe('@designliquido/delegua-matematica');
            expect(verificarModulosDelegua('tempo')).toBe('@designliquido/delegua-tempo');
            expect(verificarModulosDelegua('json')).toBe('@designliquido/delegua-json');
        });

        it('Deve retornar false para módulo desconhecido', () => {
            expect(verificarModulosDelegua('modulo-inexistente')).toBe(false);
        });

        it('Deve ser insensível a maiúsculas', () => {
            expect(verificarModulosDelegua('MATEMATICA')).toBe('@designliquido/delegua-matematica');
            expect(verificarModulosDelegua('Tempo')).toBe('@designliquido/delegua-tempo');
        });
    });

    describe('definirArgumentosPrograma', () => {
        it('Deve definir os argumentos do programa sem erro', () => {
            expect(() => definirArgumentosPrograma(['arg1', 'arg2'])).not.toThrow();
        });
    });

    describe('definirFabricaPainelWebView', () => {
        it('Deve registrar a fábrica sem erro', () => {
            const fabrica = jest.fn(() => ({}));
            expect(() => definirFabricaPainelWebView(fabrica)).not.toThrow();
        });
    });

    describe('carregarBibliotecaDelegua', () => {
        it('Deve carregar biblioteca delegua instalada (matematica)', () => {
            const modulo = carregarBibliotecaDelegua('@designliquido/delegua-matematica');
            expect(modulo).toBeDefined();
            expect(modulo.componentes).toBeDefined();
        });
    });

    describe('default export (carregarBibliotecaNode)', () => {
        it('Deve carregar módulo "argumentos"', async () => {
            const modulo = await carregarBibliotecaNode('argumentos');
            expect(modulo).toBeDefined();
        });

        it('Deve carregar biblioteca delegua por nome (matematica)', async () => {
            const modulo = await carregarBibliotecaNode('matematica');
            expect(modulo).toBeDefined();
            expect(modulo.componentes).toBeDefined();
        });

        it('Deve carregar pacote npm nativo (path) como fallback', async () => {
            const modulo = await carregarBibliotecaNode('path');
            expect(modulo).toBeDefined();
            expect(modulo.componentes).toBeDefined();
        });

        it('Deve carregar pacote npm com exportações de classes ES6 (worker_threads)', async () => {
            const modulo = await carregarBibliotecaNode('worker_threads');
            expect(modulo).toBeDefined();
            expect(modulo.componentes).toBeDefined();
        });
    });
});
