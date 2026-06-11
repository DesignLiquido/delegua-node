import { inferirDialetoPorExtensao, extensoesDialetos, principal } from '../fontes/execucao';
import { Delegua } from '../fontes/delegua';
import { AdaptadorDapDelegua } from '../fontes/depuracao';

jest.mock('../fontes/delegua');
jest.mock('../fontes/depuracao');
jest.mock('../fontes/nucleo-testes', () => ({
    executarTestes: jest.fn().mockResolvedValue(undefined)
}));

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

describe('principal', () => {
    let consoleLogSpy: jest.SpyInstance;
    let originalArgv: string[];
    let mockDelegua: any;
    let mockAdaptadorDap: any;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        originalArgv = [...process.argv];

        mockDelegua = {
            versao: jest.fn().mockReturnValue('1.0.0'),
            executarCodigoComoArgumento: jest.fn().mockResolvedValue(undefined),
            executarCodigoPorArquivo: jest.fn().mockResolvedValue(undefined),
            iniciarLair: jest.fn(),
            traduzirArquivo: jest.fn().mockResolvedValue(undefined),
        };
        (Delegua as jest.Mock).mockImplementation(() => mockDelegua);

        mockAdaptadorDap = { iniciar: jest.fn() };
        (AdaptadorDapDelegua as jest.Mock).mockImplementation(() => mockAdaptadorDap);
    });

    afterEach(() => {
        process.argv = originalArgv;
        consoleLogSpy.mockRestore();
        jest.clearAllMocks();
    });

    it('--versao imprime versão e retorna', async () => {
        process.argv = ['node', 'delegua', '--versao'];
        await principal();
        expect(consoleLogSpy).toHaveBeenCalledWith('1.0.0');
    });

    it('--codigo executa código como argumento', async () => {
        process.argv = ['node', 'delegua', '--codigo', 'escreva(1)'];
        await principal();
        expect(mockDelegua.executarCodigoComoArgumento).toHaveBeenCalled();
    });

    it('subcomando testar executa testes no diretório atual', async () => {
        process.argv = ['node', 'delegua', 'testar'];
        const { executarTestes } = require('../fontes/nucleo-testes');
        await principal();
        expect(executarTestes).toHaveBeenCalledWith(process.cwd());
    });

    it('--dap inicia o adaptador DAP', async () => {
        process.argv = ['node', 'delegua', '--dap'];
        await principal();
        expect(mockAdaptadorDap.iniciar).toHaveBeenCalled();
    });

    it('arquivo como argumento executa código por arquivo', async () => {
        process.argv = ['node', 'delegua', 'meu-arquivo.delegua'];
        await principal();
        expect(mockDelegua.executarCodigoPorArquivo).toHaveBeenCalled();
    });

    it('sem argumentos inicia modo LAIR', async () => {
        process.argv = ['node', 'delegua'];
        await principal();
        expect(mockDelegua.iniciarLair).toHaveBeenCalled();
    });
});
