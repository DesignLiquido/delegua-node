import fetch, { Response } from 'node-fetch';
import fs from 'fs';
import { resolve } from 'path';
import {
    obter_texto,
    endereco_disponivel,
    definir_tempo_limite,
    baixar_imagem,
} from '../../../../fontes/bibliotecas/dialetos/portugol-studio/internet';

import { InterpretadorInterface } from '@designliquido/delegua';
jest.mock('node-fetch');

describe('Biblioteca Internet', () => {
    describe('Obter Texto', () => {
        it('Trivial', async () => {
            const caminho = 'https://example.com/texto.txt';
            const conteudoEsperado = 'Conteúdo do arquivo';
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce(conteudoEsperado),
            } as unknown as Response);

            const resultado = await obter_texto({} as InterpretadorInterface, caminho);
            expect(resultado).toBe(conteudoEsperado);
        });

        it('Falha - Vazio', async () => {
            const caminho = 'https://example.com/vazio.txt';
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce(''),
            } as unknown as Response);

            await expect(obter_texto({} as InterpretadorInterface, caminho)).rejects.toThrow(`O caminho ${caminho} não tem nenhum conteúdo`);
        });

        it('Falha - Conteudo Inacessivel', async () => {
            const caminho = 'https://example.com/inexistente.txt';
            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(obter_texto({} as InterpretadorInterface, caminho)).rejects.toThrow(`Não foi possível obter o conteúdo de ${caminho}`);
        });
    });
    describe('Baixar Imagem', () => {
        it('Trivial', async () => {
            const endereco = 'https://example.com/imagem.jpg';
            const caminho = './imagem';
            const tipoDaImagem = 'jpg';
            const conteudoImagem = 'Imagem de exemplo';
            const imagemObtida = Buffer.from(conteudoImagem);

            // Cria um ArrayBuffer adequado para o mock
            const encoder = new TextEncoder();
            const arrayBuffer = encoder.encode(conteudoImagem).buffer;

            // Mock para a requisição HEAD (primeira chamada)
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                headers: {
                    get: jest.fn().mockReturnValueOnce(`image/${tipoDaImagem}`),
                },
            } as unknown as Response);

            // Mock para a requisição GET (segunda chamada)
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                arrayBuffer: jest.fn().mockResolvedValueOnce(arrayBuffer),
            } as unknown as Response);

            const mockStreamWrite = jest.fn();
            const mockStreamEnd = jest.fn();
            const mockStreamOn = jest.fn((event: string, handler: () => void) => {
                if (event === 'finish') {
                    // Simula o evento 'finish' imediatamente
                    setImmediate(handler);
                }
            });

            jest.spyOn(fs, 'createWriteStream').mockReturnValueOnce({
                write: mockStreamWrite,
                end: mockStreamEnd,
                on: mockStreamOn,
            } as unknown as fs.WriteStream);

            await baixar_imagem({} as InterpretadorInterface, endereco, caminho);
            expect(fs.createWriteStream).toHaveBeenCalledWith(resolve(caminho + `.${tipoDaImagem}`));
            expect(mockStreamWrite).toHaveBeenCalledWith(imagemObtida);
            expect(mockStreamEnd).toHaveBeenCalled();
        });

        it('Falha - Imagem não encontrada', async () => {
            const endereco = 'https://example.com/inexistente.jpg';
            const caminho = './imagem';
            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(baixar_imagem({} as InterpretadorInterface, endereco, caminho)).rejects.toThrow(
                `Não foi possível obter o conteúdo de ${endereco}`
            );
        });
        it('Falha - Incapaz de salvar a imagem', async () => {
            const endereco = 'https://example.com/imagem.jpg';
            const caminho = './imagem';
            const tipoDaImagem = 'jpg';
            const conteudoImagem = 'Imagem de exemplo';

            // Cria um ArrayBuffer adequado para o mock
            const encoder = new TextEncoder();
            const arrayBuffer = encoder.encode(conteudoImagem).buffer;

            // Mock para a requisição HEAD (primeira chamada)
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                headers: {
                    get: jest.fn().mockReturnValueOnce(`image/${tipoDaImagem}`),
                },
            } as unknown as Response);

            // Mock para a requisição GET (segunda chamada)
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                arrayBuffer: jest.fn().mockResolvedValueOnce(arrayBuffer),
            } as unknown as Response);

            jest.spyOn(fs, 'createWriteStream').mockImplementationOnce(() => {
                throw new Error('Failed to create write stream');
            });

            await expect(baixar_imagem({} as InterpretadorInterface, endereco, caminho)).rejects.toThrow(
                `Não foi possível salvar a imagem em ${resolve(
                    caminho + `.${tipoDaImagem}`
                )}\nGaranta que o caminho é válido e todas as pastas existem`
            );
        });
    });

    describe('Endereço Disponível', () => {
        it('Trivial', async () => {
            const endereco = 'https://example.com/existente';
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                status: 200,
            } as unknown as Response);

            const resultado = await endereco_disponivel({} as InterpretadorInterface, endereco);
            expect(resultado).toBe(true);
        });

        it('404', async () => {
            const endereco = 'https://example.com/inexistente';
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                status: 404,
            } as unknown as Response);

            const resultado = await endereco_disponivel({} as InterpretadorInterface, endereco);
            expect(resultado).toBe(false);
        });

        it('Erro durante o fetch', async () => {
            const endereco = 'https://example.com/inacessivel';
            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Failed to fetch'));

            const resultado = await endereco_disponivel({} as InterpretadorInterface, endereco);
            expect(resultado).toBe(false);
        });
    });
});
