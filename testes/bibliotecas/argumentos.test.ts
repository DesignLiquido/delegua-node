import { FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';
import { criarModuloArgumentos } from '../../fontes/bibliotecas/argumentos';

describe('Biblioteca Argumentos', () => {
    describe('criarModuloArgumentos', () => {
        it('Sem argumentos — vetor vazio, dicionário vazio, quantidade zero', () => {
            const modulo = criarModuloArgumentos([]);
            expect(modulo.componentes['argumentos']).toEqual([]);
            expect(modulo.componentes['argumentosNomeados']).toEqual({});
            expect(modulo.componentes['quantidade']).toBe(0);
        });

        it('Argumentos posicionais preservados em `argumentos`', () => {
            const modulo = criarModuloArgumentos(['arquivo.txt', 'outro.txt']);
            expect(modulo.componentes['argumentos']).toEqual(['arquivo.txt', 'outro.txt']);
            expect(modulo.componentes['quantidade']).toBe(2);
        });
    });

    describe('Análise de argumentosNomeados', () => {
        it('`--chave=valor`', () => {
            const modulo = criarModuloArgumentos(['--nome=João']);
            expect(modulo.componentes['argumentosNomeados']).toEqual({ nome: 'João' });
        });

        it('`--chave valor` (separados por espaço)', () => {
            const modulo = criarModuloArgumentos(['--nome', 'João']);
            expect(modulo.componentes['argumentosNomeados']).toEqual({ nome: 'João' });
        });

        it('`--flag` sem valor vira verdadeiro', () => {
            const modulo = criarModuloArgumentos(['--verbose']);
            expect(modulo.componentes['argumentosNomeados']).toEqual({ verbose: true });
        });

        it('`-c valor` (forma curta)', () => {
            const modulo = criarModuloArgumentos(['-n', 'João']);
            expect(modulo.componentes['argumentosNomeados']).toEqual({ n: 'João' });
        });

        it('`-f` (forma curta sem valor) vira verdadeiro', () => {
            const modulo = criarModuloArgumentos(['-v']);
            expect(modulo.componentes['argumentosNomeados']).toEqual({ v: true });
        });

        it('Sinal `=` no valor não parte a string', () => {
            const modulo = criarModuloArgumentos(['--filtro=a=b']);
            expect((modulo.componentes['argumentosNomeados'] as any)['filtro']).toBe('a=b');
        });

        it('`--chave valor` — próximo token não-flag vira valor do par', () => {
            const modulo = criarModuloArgumentos(['--verbose', 'entrada.txt', '--saida', 'out.txt']);
            const nomeados = modulo.componentes['argumentosNomeados'] as any;
            expect(nomeados['verbose']).toBe('entrada.txt');
            expect(nomeados['saida']).toBe('out.txt');
            expect(modulo.componentes['argumentos']).toEqual(['--verbose', 'entrada.txt', '--saida', 'out.txt']);
        });

        it('Flag seguida de outra flag vira verdadeiro', () => {
            const modulo = criarModuloArgumentos(['--verbose', '--saida', 'out.txt']);
            const nomeados = modulo.componentes['argumentosNomeados'] as any;
            expect(nomeados['verbose']).toBe(true);
            expect(nomeados['saida']).toBe('out.txt');
        });
    });

    describe('temArgumento', () => {
        it('Retorna verdadeiro para argumento presente', async () => {
            const modulo = criarModuloArgumentos(['--verbose']);
            const fn = modulo.componentes['temArgumento'] as FuncaoPadrao;
            expect(await fn.chamar({} as any, ['verbose'], null)).toBe(true);
        });

        it('Retorna falso para argumento ausente', async () => {
            const modulo = criarModuloArgumentos(['--verbose']);
            const fn = modulo.componentes['temArgumento'] as FuncaoPadrao;
            expect(await fn.chamar({} as any, ['silencioso'], null)).toBe(false);
        });

        it('Retorna verdadeiro para argumento de forma curta', async () => {
            const modulo = criarModuloArgumentos(['-v']);
            const fn = modulo.componentes['temArgumento'] as FuncaoPadrao;
            expect(await fn.chamar({} as any, ['v'], null)).toBe(true);
        });
    });

    describe('obterArgumento', () => {
        it('Retorna o valor do argumento', async () => {
            const modulo = criarModuloArgumentos(['--nome=Maria']);
            const fn = modulo.componentes['obterArgumento'] as FuncaoPadrao;
            expect(await fn.chamar({} as any, ['nome', null], null)).toBe('Maria');
        });

        it('Retorna padrão quando argumento ausente', async () => {
            const modulo = criarModuloArgumentos([]);
            const fn = modulo.componentes['obterArgumento'] as FuncaoPadrao;
            expect(await fn.chamar({} as any, ['nome', 'padrão'], null)).toBe('padrão');
        });

        it('Retorna nulo quando ausente e sem padrão', async () => {
            const modulo = criarModuloArgumentos([]);
            const fn = modulo.componentes['obterArgumento'] as FuncaoPadrao;
            expect(await fn.chamar({} as any, ['nome', null], null)).toBeNull();
        });

        it('Flag booleana retorna verdadeiro via obterArgumento', async () => {
            const modulo = criarModuloArgumentos(['--verbose']);
            const fn = modulo.componentes['obterArgumento'] as FuncaoPadrao;
            expect(await fn.chamar({} as any, ['verbose', null], null)).toBe(true);
        });
    });
});
