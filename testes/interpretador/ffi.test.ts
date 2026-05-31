import { Classe, FuncaoDeclaracao } from '@designliquido/delegua/declaracoes';
import { Decorador, FuncaoConstruto } from '@designliquido/delegua/construtos';

import { resolverNomeBiblioteca } from '../../fontes/ffi/resolver-biblioteca';
import { DespachadorFFINodeJs } from '../../fontes/ffi/despachador-ffi-node';

// ─── Mock koffi ──────────────────────────────────────────────────────────────
// jest.mock é içado (hoisted) antes de qualquer declaração; a fábrica não pode
// referenciar variáveis declaradas no corpo do módulo. Por isso o mock é
// configurado aqui com jest.fn() mínimos, e cada teste o reconfigura via require.

jest.mock('koffi', () => ({
    load: jest.fn(),
}));

// ─── Helpers de fixture ──────────────────────────────────────────────────────

function criarSimbolo(lexema: string, linha = 1, hashArquivo = -1) {
    return { lexema, linha, hashArquivo, tipo: '', literal: null };
}

function criarDecorador(nome: string, atributos: Record<string, any> = {}): Decorador {
    return new Decorador(-1, 1, nome, atributos);
}

function criarMetodo(
    lexema: string,
    tipoRetorno: string,
    parametros: { lexema: string; tipoDado: string }[],
    decoradores: Decorador[] = []
): FuncaoDeclaracao {
    const params = parametros.map(p => ({
        abrangencia: 'padrao' as const,
        nome: criarSimbolo(p.lexema),
        tipoDado: p.tipoDado,
    }));
    const funcao = new FuncaoConstruto(-1, 1, params, []);
    return new FuncaoDeclaracao(criarSimbolo(lexema), funcao, tipoRetorno, decoradores);
}

function criarClasse(
    nomeClasse: string,
    decoradores: Decorador[],
    metodos: FuncaoDeclaracao[]
): Classe {
    return new Classe(criarSimbolo(nomeClasse), [], metodos, [], decoradores, false, true);
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('FFI (delegua-node)', () => {
    // ── resolverNomeBiblioteca ──────────────────────────────────────────────

    describe('resolverNomeBiblioteca()', () => {
        it('Adiciona .dll no Windows', () => {
            if (process.platform !== 'win32') return;
            expect(resolverNomeBiblioteca('ssl')).toBe('ssl.dll');
        });

        it('Adiciona lib*.dylib no macOS', () => {
            if (process.platform !== 'darwin') return;
            expect(resolverNomeBiblioteca('ssl')).toBe('libssl.dylib');
        });

        it('Adiciona lib*.so no Linux', () => {
            if (process.platform !== 'linux') return;
            expect(resolverNomeBiblioteca('ssl')).toBe('libssl.so');
        });

        it('Devolve caminho sem alteração quando já tem extensão .dll', () => {
            expect(resolverNomeBiblioteca('minhalib.dll')).toBe('minhalib.dll');
        });

        it('Devolve caminho sem alteração quando já tem extensão .so', () => {
            expect(resolverNomeBiblioteca('libm.so')).toBe('libm.so');
        });

        it('Devolve caminho sem alteração quando já tem extensão .dylib', () => {
            expect(resolverNomeBiblioteca('libssl.dylib')).toBe('libssl.dylib');
        });

        it('Devolve caminho sem alteração quando contém separador de diretório (/)', () => {
            expect(resolverNomeBiblioteca('/usr/local/lib/libssl.so')).toBe('/usr/local/lib/libssl.so');
        });

        it('Devolve caminho sem alteração quando contém separador de diretório (\\)', () => {
            expect(resolverNomeBiblioteca('C:\\Windows\\System32\\ssl.dll')).toBe('C:\\Windows\\System32\\ssl.dll');
        });
    });

    // ── DespachadorFFINodeJs ────────────────────────────────────────────────

    describe('DespachadorFFINodeJs', () => {
        let despachador: DespachadorFFINodeJs;
        let mockFuncaoNativa: jest.Mock;
        let mockLib: { func: jest.Mock; unload: jest.Mock };
        let koffiLoad: jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
            mockFuncaoNativa = jest.fn().mockReturnValue(42);
            mockLib = { func: jest.fn().mockReturnValue(mockFuncaoNativa), unload: jest.fn() };
            koffiLoad = (require('koffi') as any).load;
            koffiLoad.mockReturnValue(mockLib);
            despachador = new DespachadorFFINodeJs();
        });

        it('Retorna null quando a classe não tem decorador @definicao', () => {
            const classe = criarClasse('LibSemDecorador', [], []);
            const resultado = despachador.resolverClasseEstrangeira(classe);
            expect(resultado).toBeNull();
        });

        it('Retorna null quando @definicao não tem atributo biblioteca', () => {
            const decorador = criarDecorador('definicao', { prefixo: 'x_' });
            const classe = criarClasse('LibSemBiblioteca', [decorador], []);
            const resultado = despachador.resolverClasseEstrangeira(classe);
            expect(resultado).toBeNull();
        });

        it('Retorna null quando koffi.load lança erro (biblioteca inexistente)', () => {
            koffiLoad.mockImplementationOnce(() => { throw new Error('lib não encontrada'); });
            const decorador = criarDecorador('definicao', { biblioteca: 'inexistente', prefixo: '' });
            const classe = criarClasse('Lib', [decorador], []);
            const resultado = despachador.resolverClasseEstrangeira(classe);
            expect(resultado).toBeNull();
        });

        it('Chama koffi.load com o nome resolvido pela plataforma', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'testlib', prefixo: '' });
            const classe = criarClasse('LibTeste', [decorador], []);
            despachador.resolverClasseEstrangeira(classe);
            expect(koffiLoad).toHaveBeenCalledTimes(1);
            expect(koffiLoad.mock.calls[0][0]).toContain('testlib');
        });

        it('Reutiliza a biblioteca já carregada em chamadas subsequentes', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'm', prefixo: '' });
            const metodo = criarMetodo('raizQuadrada', 'numero', [{ lexema: 'x', tipoDado: 'numero' }]);
            const classe = criarClasse('LibM', [decorador], [metodo]);

            despachador.resolverClasseEstrangeira(classe);
            despachador.resolverClasseEstrangeira(classe);

            expect(koffiLoad).toHaveBeenCalledTimes(1);
        });

        it('Cria método estático no descritor para cada método da classe', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'm', prefixo: 'libm_' });
            const metodo = criarMetodo('cossenho', 'numero', [{ lexema: 'x', tipoDado: 'numero' }]);
            const classe = criarClasse('LibM', [decorador], [metodo]);

            const descritor = despachador.resolverClasseEstrangeira(classe);

            expect(descritor).not.toBeNull();
            expect(descritor!.metodosEstaticos['cossenho']).toBeDefined();
        });

        it('Usa prefixo da classe ao resolver o símbolo C', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'm', prefixo: 'SSL_' });
            const metodo = criarMetodo('conectar', 'vazio', []);
            const classe = criarClasse('LibSSL', [decorador], [metodo]);

            despachador.resolverClasseEstrangeira(classe);

            expect(mockLib.func).toHaveBeenCalledWith('SSL_conectar', expect.any(String), expect.any(Array));
        });

        it('Respeita @definicao(simbolo="...") no método para sobrescrever o símbolo C', () => {
            const decoradorClasse = criarDecorador('definicao', { biblioteca: 'm', prefixo: 'SSL_' });
            const decoradorMetodo = criarDecorador('definicao', { simbolo: 'SSL_connect' });
            const metodo = criarMetodo('conectar', 'vazio', [], [decoradorMetodo]);
            const classe = criarClasse('LibSSL', [decoradorClasse], [metodo]);

            despachador.resolverClasseEstrangeira(classe);

            expect(mockLib.func).toHaveBeenCalledWith('SSL_connect', expect.any(String), expect.any(Array));
        });

        it('Mapeia tipo de retorno numero para "double" ao registrar a função', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'm', prefixo: '' });
            const metodo = criarMetodo('cos', 'numero', [{ lexema: 'x', tipoDado: 'numero' }]);
            const classe = criarClasse('LibM', [decorador], [metodo]);

            despachador.resolverClasseEstrangeira(classe);

            expect(mockLib.func).toHaveBeenCalledWith('cos', 'double', ['double']);
        });

        it('Mapeia tipo de retorno inteiro para "int" ao registrar a função', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'x', prefixo: '' });
            const metodo = criarMetodo('somar', 'inteiro', [
                { lexema: 'a', tipoDado: 'inteiro' },
                { lexema: 'b', tipoDado: 'inteiro' },
            ]);
            const classe = criarClasse('LibX', [decorador], [metodo]);

            despachador.resolverClasseEstrangeira(classe);

            expect(mockLib.func).toHaveBeenCalledWith('somar', 'int', ['int', 'int']);
        });

        it('Mapeia tipo texto para "string"', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'x', prefixo: '' });
            const metodo = criarMetodo('lerNome', 'texto', []);
            const classe = criarClasse('LibX', [decorador], [metodo]);

            despachador.resolverClasseEstrangeira(classe);

            expect(mockLib.func).toHaveBeenCalledWith('lerNome', 'string', []);
        });

        it('Invoca a função C ao chamar o método estático resultante', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'm', prefixo: '' });
            const metodo = criarMetodo('absoluto', 'numero', [{ lexema: 'x', tipoDado: 'numero' }]);
            const classe = criarClasse('LibM', [decorador], [metodo]);

            const descritor = despachador.resolverClasseEstrangeira(classe);

            const fn = descritor!.metodosEstaticos['absoluto'] as any;
            fn.chamar(null, [3.14], null);

            expect(mockFuncaoNativa).toHaveBeenCalledWith(3.14);
        });

        it('descarregarTudo() limpa o cache de bibliotecas', () => {
            const decorador = criarDecorador('definicao', { biblioteca: 'm', prefixo: '' });
            const classe = criarClasse('LibM', [decorador], []);

            despachador.resolverClasseEstrangeira(classe);
            despachador.descarregarTudo();

            // Após descarregar, uma nova chamada deve recarregar a biblioteca
            despachador.resolverClasseEstrangeira(classe);
            expect(koffiLoad).toHaveBeenCalledTimes(2);
        });
    });
});
