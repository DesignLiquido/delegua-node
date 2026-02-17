import { InterpretadorInterface } from '@designliquido/delegua/interfaces';
import fs from 'fs';
import {
    abrir_arquivo,
    fechar_arquivo,
    fim_arquivo,
    ler_linha,
    escrever_linha,
    substituir_texto,
    arquivo_existe,
    apagar_arquivo,
    criar_pasta,
    listar_pastas,
    listar_arquivos,
    listar_arquivos_por_tipo,
} from '../../../../fontes/bibliotecas/dialetos/portugol-studio/arquivos';

describe('Biblioteca Arquivos', () => {
    beforeEach(async () => {
        await fs.promises.mkdir('testDir', { recursive: true });
        await fs.promises.writeFile('testDir/test.txt', 'Linha 1\nLinha 2');
    });

    afterEach(async () => {
        try {
            await fechar_arquivo({} as InterpretadorInterface, 0);
        } catch (error) {}
        try {
            await fs.promises.rm('testDir');
        } catch (error) {}
    });

    afterAll(async () => {
        try {
            await fs.promises.unlink('testDir/test.txt');
            await fs.promises.rm('testDir', { recursive: true });
        } catch (error) {}
    });

    describe('Abrir Arquivo', () => {
        it('Trivial', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 0);
            expect(arquivoIndex).toBeGreaterThanOrEqual(0);
        });

        it('Modo de acesso invalido', async () => {
            await expect(abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 3)).rejects.toThrow(
                'Modo de acesso inválido'
            );
        });

        it('Arquivo já está aberto', async () => {
            await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 0);
            await expect(abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 0)).rejects.toThrow(
                "O arquivo 'testDir/test.txt' já está aberto"
            );
        });
    });

    describe('Fechar Arquivo', () => {
        it('Trivial', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 0);
            await fechar_arquivo({} as InterpretadorInterface, arquivoIndex);
            await expect(fs.promises.access('testDir/test.txt')).resolves.toBeUndefined();
        });

        it('Endereço invalido', async () => {
            await expect(fechar_arquivo({} as InterpretadorInterface, 99)).rejects.toThrow(
                'O endereço de memória especificado não aponta para um arquivo'
            );
        });
    });

    describe('Fim Arquivo', () => {
        it('Trivial', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 2);
            expect(fim_arquivo({} as InterpretadorInterface, arquivoIndex)).toBe(false);
        });

        it('Fim não alcançado', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 0); 
            await ler_linha({} as InterpretadorInterface, arquivoIndex);
            expect(fim_arquivo({} as InterpretadorInterface, arquivoIndex)).toBe(false);
        });
    });

    describe('Ler Linha', () => {
        it('Trivial', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 0);
            const linha = await ler_linha({} as InterpretadorInterface, arquivoIndex);
            expect(linha).toBe('Linha 1');
        });

        it('Erro caso em modo de escrita', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 1);
            await expect(ler_linha({} as InterpretadorInterface, arquivoIndex)).rejects.toThrow(
                "O arquivo 'testDir/test.txt' está aberto em modo de escrita"
            );
        });
    });

    describe('Escrever Linha', () => {
        it('Trivial', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 1);
            await escrever_linha({} as InterpretadorInterface, 'Nova linha', arquivoIndex);
            const data = await fs.promises.readFile('testDir/test.txt', 'utf-8');
            expect(data).toContain('Nova linha');
        });

        it('Arquivo em modo leitura', async () => {
            const arquivoIndex = await abrir_arquivo({} as InterpretadorInterface, 'testDir/test.txt', 0);
            await expect(escrever_linha({} as InterpretadorInterface, 'Nova linha', arquivoIndex)).rejects.toThrow(
                "O arquivo 'testDir/test.txt' está aberto em modo de leitura"
            );
        });
    });
    describe('Substituir Texto', () => {
        it('Trivial', async () => {
            await substituir_texto({} as InterpretadorInterface, 'testDir/test.txt', 'Linha 1', 'Linha Alterada', true);
            const data = await fs.promises.readFile('testDir/test.txt', 'utf-8');
            expect(data).toContain('Linha Alterada');
            expect(data).not.toContain('Linha 1');
        });

        it('Varias instancias de um texto', async () => {
            await substituir_texto({} as InterpretadorInterface, 'testDir/test.txt', 'Linha', 'Linha Alterada', false);
            const data = await fs.promises.readFile('testDir/test.txt', 'utf-8');
            expect(data.match(/Linha Alterada/g)).toHaveLength(2);
        });
    });

    describe('Arquivo Existe', () => {
        it('Verdadeiro caso exista', async () => {
            expect(await arquivo_existe({} as InterpretadorInterface, 'testDir/test.txt')).toBe(true);
        });

        it('Falso caso não exista', async () => {
            expect(await arquivo_existe({} as InterpretadorInterface, 'testDir/nonexistent.txt')).toBe(false);
        });
    });

    describe('Apagar Arquivo', () => {
        it('Trivial', async () => {
            await apagar_arquivo({} as InterpretadorInterface, 'testDir/test.txt');
            await expect(fs.promises.access('testDir/test.txt')).rejects.toThrow();
        });
    });

    describe('Cria Pasta', () => {
        it('Trivial', async () => {
            await criar_pasta({} as InterpretadorInterface, 'testDir/subDir');
            const exists = await fs.promises
                .access('testDir/subDir')
                .then(() => true)
                .catch(() => false);
            expect(exists).toBe(true);
        });
    });

    describe('Listar Pastas', () => {
        it('Trivial', async () => {
            const vetorPastas = new Array(1);
            await listar_pastas({} as InterpretadorInterface, 'testDir', vetorPastas);
            expect(vetorPastas).toEqual(['subDir']);
        });

        it('Vetor muito pequeno', async () => {
            const vetorPastas = new Array(0);
            await expect(listar_pastas({} as InterpretadorInterface, 'testDir', vetorPastas)).rejects.toThrow();
        });
    });

    describe('Listar Arquivos', () => {
        it('Trivial', async () => {
            const vetorArquivos = new Array(1);
            await listar_arquivos({} as InterpretadorInterface, './testDir', vetorArquivos);
            expect(vetorArquivos).toContain('test.txt');
        });

        it('Vetor muito pequeno', async () => {
            const vetorArquivos = new Array(0);
            await expect(listar_arquivos({} as InterpretadorInterface, './testDir', vetorArquivos)).rejects.toThrow();
        });
    });

    describe('Listar Arquivos Por Tipo', () => {
        it('Trivial', async () => {
            const vetorArquivos = new Array(1);
            await listar_arquivos_por_tipo({} as InterpretadorInterface, './testDir', vetorArquivos, ['.txt']);
            expect(vetorArquivos).toContain('test.txt');
        });

        it('Vetor muito pequeno', async () => {
            const vetorArquivos = new Array(0);
            await expect(
                listar_arquivos_por_tipo({} as InterpretadorInterface, './testDir', vetorArquivos, ['.txt'])
            ).rejects.toThrow();
        });
    });
});
