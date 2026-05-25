import fs from 'fs';
import fetch, { Response } from 'node-fetch';

import { AvaliadorSintaticoPotigol } from '@designliquido/potigol/avaliador-sintatico';
import { LexadorPotigol } from '@designliquido/potigol/lexador';

import { InterpretadorPotigolComImportacao } from '../../../../fontes/interpretador/dialetos/interpretador-potigol-com-importacao';

jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        appendFile: jest.fn(),
    },
}));

jest.mock('node-fetch');

describe('InterpretadorPotigolComImportacao', () => {
    let lexador: LexadorPotigol;
    let avaliadorSintatico: AvaliadorSintaticoPotigol;
    let interpretador: InterpretadorPotigolComImportacao;
    let saidas: string[];

    beforeEach(() => {
        saidas = [];
        lexador = new LexadorPotigol();
        avaliadorSintatico = new AvaliadorSintaticoPotigol();
        interpretador = new InterpretadorPotigolComImportacao(process.cwd());
        interpretador.funcaoDeRetorno = (saida: any) => {
            saidas.push(String(saida));
        };
        jest.clearAllMocks();
    });

    describe('Arquivo', () => {
        it('Arquivo está disponível no escopo global', () => {
            const arquivo = interpretador.pilhaEscoposExecucao.obterVariavelPorNome('Arquivo');
            expect(arquivo).toBeDefined();
            expect(arquivo.valor).toBeDefined();
            expect(arquivo.valor.componentes).toHaveProperty('leia');
            expect(arquivo.valor.componentes).toHaveProperty('salve');
        });

        it('Arquivo.leia retorna lista de linhas do arquivo', async () => {
            (fs.promises.readFile as jest.Mock).mockResolvedValueOnce('linha1\nlinha2\nlinha3');

            const retornoLexador = lexador.mapear([
                'val linhas = Arquivo.leia("teste.txt")',
                'escreva linhas.tamanho',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(saidas).toHaveLength(1);
            expect(saidas[0]).toBe('3');
        });

        it('Arquivo.salve grava conteúdo no arquivo', async () => {
            (fs.promises.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

            const retornoLexador = lexador.mapear([
                'Arquivo.salve("saida.txt", "conteudo")',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(fs.promises.writeFile).toHaveBeenCalledWith('saida.txt', 'conteudo', 'utf-8');
        });

        it('Arquivo.salve com anexar = verdadeiro usa appendFile', async () => {
            (fs.promises.appendFile as jest.Mock).mockResolvedValueOnce(undefined);

            const retornoLexador = lexador.mapear([
                'Arquivo.salve("saida.txt", "mais texto", verdadeiro)',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(fs.promises.appendFile).toHaveBeenCalledWith('saida.txt', 'mais texto', 'utf-8');
        });
    });

    describe('URL', () => {
        it('URL está disponível no escopo global', () => {
            const url = interpretador.pilhaEscoposExecucao.obterVariavelPorNome('URL');
            expect(url).toBeDefined();
        });

        it('URL(caminho).conteudo retorna o conteúdo obtido', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce('<html>olá</html>'),
            } as unknown as Response);

            const retornoLexador = lexador.mapear([
                'val pagina = URL("https://exemplo.com")',
                'escreva pagina.conteudo',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(saidas).toHaveLength(1);
            expect(saidas[0]).toBe('<html>olá</html>');
        });

        it('URL(caminho).erro é falso quando o conteúdo é obtido com sucesso', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce('conteudo'),
            } as unknown as Response);

            const retornoLexador = lexador.mapear([
                'val pagina = URL("https://exemplo.com")',
                'escreva pagina.erro',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(saidas).toHaveLength(1);
            expect(saidas[0]).toBe('falso');
        });

        it('URL(caminho).erro é verdadeiro quando a requisição falha', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('falha de rede'));

            const retornoLexador = lexador.mapear([
                'val pagina = URL("https://invalido.exemplo")',
                'escreva pagina.erro',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(saidas).toHaveLength(1);
            expect(saidas[0]).toBe('verdadeiro');
        });

        it('URL(caminho).conteudo é vazio quando a requisição falha', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('falha de rede'));

            const retornoLexador = lexador.mapear([
                'val pagina = URL("https://invalido.exemplo")',
                'escreva pagina.conteudo',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(saidas).toHaveLength(1);
            expect(saidas[0]).toBe('');
        });

        it('URL(caminho).conteúdo (com acento) retorna o conteúdo obtido', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce('resposta'),
            } as unknown as Response);

            const retornoLexador = lexador.mapear([
                'val pagina = URL("https://exemplo.com")',
                'escreva pagina.conteúdo',
            ], -1);
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(saidas).toHaveLength(1);
            expect(saidas[0]).toBe('resposta');
        });
    });
});
