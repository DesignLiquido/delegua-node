import { FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';

import carregarBiblioteca from '../../fontes/mecanismo-importacao-bibliotecas';
import {
    citarArgumentoWindows,
    criarModuloProcesso,
    nomeArquitetura,
    nomeSistemaOperacional,
    prepararExecucao,
    resolverProgramaWindows,
} from '../../fontes/bibliotecas/processo';
import { codificarComponenteUrl, criarModuloRede, decodificarComponenteUrl } from '../../fontes/bibliotecas/rede';
import { criarModuloMemoria } from '../../fontes/bibliotecas/memoria';

// Chama uma função do módulo como o interpretador faz (primeiro argumento: o interpretador).
function chamar(modulo: any, nome: string, ...argumentos: any[]): Promise<any> {
    const funcao = modulo.componentes[nome] as FuncaoPadrao;
    return funcao.chamar(null, argumentos, null);
}

describe('Importação dos módulos embutidos', () => {
    it.each(['processo', 'rede', 'memoria', 'memória'])('importar("%s") devolve o módulo embutido', async (nome) => {
        const modulo = await carregarBiblioteca(nome);
        expect(modulo.nome).toBe(nome === 'memória' ? 'memoria' : nome);
    });
});

describe('Biblioteca processo', () => {
    it('nomes de sistema operacional e arquitetura iguais aos do delegua-llvm', () => {
        expect(nomeSistemaOperacional('win32')).toBe('windows');
        expect(nomeSistemaOperacional('darwin')).toBe('darwin');
        expect(nomeSistemaOperacional('aix')).toBe('desconhecido');
        expect(nomeArquitetura('x64')).toBe('amd64');
        expect(nomeArquitetura('arm64')).toBe('arm64');
        expect(nomeArquitetura('ia32')).toBe('386');
    });

    it('cita argumentos pelas regras do Windows', () => {
        expect(citarArgumentoWindows('simples')).toBe('simples');
        expect(citarArgumentoWindows('')).toBe('""');
        expect(citarArgumentoWindows('com espaco')).toBe('"com espaco"');
        expect(citarArgumentoWindows('a"b')).toBe('"a\\"b"');
        expect(citarArgumentoWindows('c:\\dir\\ final\\')).toBe('"c:\\dir\\ final\\\\"');
    });

    it('resolve programas pelo PATH com as extensões do Windows', () => {
        const existe = (arquivo: string) => arquivo.replace(/\//g, '\\').toLowerCase() === 'c:\\node\\npm.cmd';
        expect(resolverProgramaWindows('npm', 'C:\\outro;C:\\node', existe).toLowerCase()).toMatch(/npm\.cmd$/);
        expect(resolverProgramaWindows('git.exe', 'C:\\node', existe)).toBe('git.exe');
    });

    it('arquivos de lote passam pelo cmd.exe e recusam argumentos inseguros', () => {
        const comando = prepararExecucao('npm', ['install', 'pacote@1.0'], null, 'win32', () => 'C:\\node\\npm.cmd');
        expect(comando.argumentos.slice(0, 3)).toEqual(['/d', '/s', '/c']);
        expect(comando.argumentos[3]).toBe('"C:\\node\\npm.cmd install pacote@1.0"');
        expect(comando.opcoes.windowsVerbatimArguments).toBe(true);
        expect(() => prepararExecucao('npm', ['100%'], null, 'win32', () => 'C:\\node\\npm.cmd')).toThrow(
            'argumento inseguro'
        );
        expect(() => prepararExecucao('npm', ['a"b'], null, 'win32', () => 'C:\\node\\npm.cmd')).toThrow(
            'argumento inseguro'
        );
    });

    it('fora do Windows executa o programa diretamente, sem shell', () => {
        const comando = prepararExecucao('git', ['status'], '/repo', 'linux');
        expect(comando).toEqual({ programa: 'git', argumentos: ['status'], opcoes: { cwd: '/repo', shell: false } });
    });

    it('executa, captura a saída e informa o código de saída', async () => {
        const modulo = criarModuloProcesso();
        const saida = await chamar(modulo, 'executarCapturando', process.execPath, ['-e', 'process.stdout.write("ola"); process.exit(7)']);
        expect(saida).toBe('ola');
        expect(await chamar(modulo, 'ultimoCodigoSaida')).toBe(7);
        expect(await chamar(modulo, 'executar', 'programa-que-nao-existe-xyz', [])).toBe(-1);
    });

    it('variáveis de ambiente: nulo quando ausente', async () => {
        const modulo = criarModuloProcesso();
        expect(await chamar(modulo, 'variavelAmbiente', 'DELEGUA_TESTE_INEXISTENTE')).toBeNull();
        expect(await chamar(modulo, 'definirVariavelAmbiente', 'DELEGUA_TESTE_X', '1')).toBe(true);
        expect(await chamar(modulo, 'variavelAmbiente', 'DELEGUA_TESTE_X')).toBe('1');
        delete process.env.DELEGUA_TESTE_X;
    });
});

describe('Biblioteca rede', () => {
    it('codifica e decodifica componentes de URL como o delegua-llvm (RFC 3986)', () => {
        expect(codificarComponenteUrl("a b/ç?&!*'()")).toBe('a%20b%2F%C3%A7%3F%26%21%2A%27%28%29');
        expect(codificarComponenteUrl('A-z_0.9~')).toBe('A-z_0.9~');
        expect(decodificarComponenteUrl('a%20b+c%2F%C3%A7')).toBe('a b c/ç');
        expect(decodificarComponenteUrl('100%')).toBe('100%');
        expect(decodificarComponenteUrl('%zz')).toBe('%zz');
    });

    it('servidor e cliente no mesmo programa: requisição, resposta e tempos limite', async () => {
        const rede = criarModuloRede();
        const servidor = await chamar(rede, 'escutar', '127.0.0.1', 0);
        const porta = await chamar(rede, 'portaLocal', servidor);
        expect(porta).toBeGreaterThan(0);

        expect(await chamar(rede, 'aceitar', servidor, 50)).toBeNull();
        expect(await chamar(rede, 'ultimoErro')).toBe('tempo esgotado');

        const cliente = await chamar(rede, 'conectar', '127.0.0.1', porta, 2000);
        expect(cliente).not.toBeNull();
        expect(await chamar(rede, 'escrever', cliente, 'GET / HTTP/1.1\r\nHost: x\r\n\r\ncorpo')).toBe(true);

        const conexao = await chamar(rede, 'aceitar', servidor, 2000);
        // lerAte devolve até o delimitador (inclusive) e guarda o restante para a próxima leitura.
        expect(await chamar(rede, 'lerAte', conexao, '\r\n\r\n', 65536, 2000)).toBe('GET / HTTP/1.1\r\nHost: x\r\n\r\n');
        expect(await chamar(rede, 'ler', conexao, 1024, 2000)).toBe('corpo');
        expect(await chamar(rede, 'ler', conexao, 1024, 50)).toBeNull();

        await chamar(rede, 'escrever', conexao, 'HTTP/1.1 200 OK\r\n\r\nok');
        await chamar(rede, 'fechar', conexao);
        expect(await chamar(rede, 'lerAte', cliente, '', 65536, 2000)).toBe('HTTP/1.1 200 OK\r\n\r\nok');
        expect(await chamar(rede, 'ler', cliente, 1024, 2000)).toBe('');

        await chamar(rede, 'fechar', cliente);
        await chamar(rede, 'fechar', servidor);
        expect(await chamar(rede, 'conectar', '127.0.0.1', porta, 2000)).toBeNull();
    });

    it('rejeita porta inválida', async () => {
        const rede = criarModuloRede();
        expect(await chamar(rede, 'escutar', '127.0.0.1', 70000)).toBeNull();
        expect(await chamar(rede, 'ultimoErro')).toBe('porta inválida');
        expect(await chamar(rede, 'conectar', '', 80, 100)).toBeNull();
    });
});

describe('Biblioteca memoria', () => {
    it('aloca memória zerada, lê e escreve em deslocamento', async () => {
        const memoria = criarModuloMemoria();
        const bloco = await chamar(memoria, 'alocar', 24);
        expect(typeof bloco).toBe('bigint');
        expect(await chamar(memoria, 'lerLongo', bloco, 8)).toBe(0);

        await chamar(memoria, 'escreverInteiro', bloco, 0, -7);
        await chamar(memoria, 'escreverByte', bloco, 4, 300);
        await chamar(memoria, 'escreverLongo', bloco, 8, 3000000000);
        await chamar(memoria, 'escreverNumero', bloco, 16, 2.5);
        expect(await chamar(memoria, 'lerInteiro', bloco, 0)).toBe(-7);
        expect(await chamar(memoria, 'lerByte', bloco, 4)).toBe(44);
        expect(await chamar(memoria, 'lerLongo', bloco, 8)).toBe(3000000000);
        expect(await chamar(memoria, 'lerNumero', bloco, 16)).toBe(2.5);
        await chamar(memoria, 'liberar', bloco);
    });

    it('ponteiros: guardar, ler, deslocar e ler textos', async () => {
        const memoria = criarModuloMemoria();
        const buffer = await chamar(memoria, 'alocar', 16);
        const caixa = await chamar(memoria, 'alocar', await chamar(memoria, 'tamanhoPonteiro'));
        // Escreve "ola" byte a byte e guarda o ponteiro do buffer na caixa.
        for (const [indice, letra] of [...'ola'].entries()) {
            await chamar(memoria, 'escreverByte', buffer, indice, letra.charCodeAt(0));
        }
        await chamar(memoria, 'escreverPonteiro', caixa, 0, buffer);
        expect(await chamar(memoria, 'lerPonteiro', caixa, 0)).toBe(buffer);
        expect(await chamar(memoria, 'lerTexto', caixa, 0)).toBe('ola');
        expect(await chamar(memoria, 'textoDe', await chamar(memoria, 'deslocar', buffer, 1))).toBe('la');
        expect(await chamar(memoria, 'textoDeTamanho', buffer, 2)).toBe('ol');
        expect(await chamar(memoria, 'textoDeTamanho', buffer, 10)).toBe('ola');
        await chamar(memoria, 'escreverPonteiro', caixa, 0, null);
        expect(await chamar(memoria, 'lerPonteiro', caixa, 0)).toBeNull();
        expect(await chamar(memoria, 'lerTexto', caixa, 0)).toBeNull();
        await chamar(memoria, 'liberar', caixa);
        await chamar(memoria, 'liberar', buffer);
    });

    it('nulo e tamanhos inválidos', async () => {
        const memoria = criarModuloMemoria();
        expect(await chamar(memoria, 'alocar', 0)).toBeNull();
        expect(await chamar(memoria, 'lerInteiro', null, 0)).toBe(0);
        expect(await chamar(memoria, 'lerPonteiro', null, 0)).toBeNull();
        expect(await chamar(memoria, 'textoDe', null)).toBeNull();
        expect(await chamar(memoria, 'deslocar', null, 4)).toBeNull();
        await expect(chamar(memoria, 'liberar', null)).resolves.toBeUndefined();
    });
});
