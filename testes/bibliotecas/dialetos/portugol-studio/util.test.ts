import os from 'os';
import {
    obter_diretorio_usuario,
    numero_colunas,
    numero_elementos,
    numero_linhas,
    sorteia,
    aguarde,
    tempo_decorrido,
} from '../../../../fontes/bibliotecas/dialetos/portugol-studio/util';

import { InterpretadorInterface } from '@designliquido/delegua/interfaces';

describe('Biblioteca Util', () => {
    describe('Obter Diretório do Usuário', () => {
        it('Trivial', async () => {
            const resultado = await obter_diretorio_usuario();
            expect(resultado).toBe(os.homedir());
        });

        it('Falha ao obter Diretório', async () => {
            jest.spyOn(os, 'homedir').mockImplementation(() => {
                throw new Error('Erro para testes');
            });
            await expect(obter_diretorio_usuario()).rejects.toThrow('Não foi possível obter o diretório do usuário');
        });
    });

    describe('Número de Elementos', () => {
        it('Trivial', async () => {
            const vetor = [1, 2, 3, 4, 5];
            const resultado = await numero_elementos({} as InterpretadorInterface, vetor);
            expect(resultado).toBe(5);
        });
    });

    describe('Número de Linhas', () => {
        it('Trivial', async () => {
            const matriz = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ];
            const resultado = await numero_linhas({} as InterpretadorInterface, matriz);
            expect(resultado).toBe(3);
        });
    });

    describe('Número de Colunas', () => {
        it('Trivial', async () => {
            const matriz = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ];
            const resultado = await numero_colunas({} as InterpretadorInterface, matriz);
            expect(resultado).toBe(3);
        });
    });

    describe('Sorteia', () => {
        it('Trivial', async () => {
            const minimo = 1;
            const maximo = 10;
            const resultado = await sorteia({} as InterpretadorInterface, minimo, maximo);
            expect(resultado).toBeGreaterThanOrEqual(minimo);
            expect(resultado).toBeLessThanOrEqual(maximo);
        });

        it('Falha - Minimo maior que Maximo', async () => {
            const minimo = 10;
            const maximo = 1;
            await expect(sorteia({} as InterpretadorInterface, minimo, maximo)).rejects.toThrow(
                `O valor mínimo (${minimo}) é maior do que o valor máximo (${maximo})`
            );
        });

        it('Falha - Minimo é igual a Maximo', async () => {
            const minimo = 5;
            const maximo = 5;
            await expect(sorteia({} as InterpretadorInterface, minimo, maximo)).rejects.toThrow(`Os valores mínimo e máximo são iguais: ${minimo}`);
        });
    });

    describe('Aguarde', () => {
        it('Trivial', async () => {
            const startTime = new Date().getTime();
            const intervalo = 50;
            await aguarde({} as InterpretadorInterface, intervalo);
            const endTime = new Date().getTime();
            const elapsedTime = endTime - startTime;
            expect(elapsedTime).toBeGreaterThanOrEqual(intervalo * 0.9);
            expect(elapsedTime).toBeLessThanOrEqual(intervalo * 3);
        });
    });

    let horaInicial: number;
    beforeAll(() => {
        horaInicial = Date.now();
    });

    describe('Tempo Decorrido', () => {
        it('Trivial', async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            const resultado = await tempo_decorrido();
            const tempoAtual = Date.now();
            const tempoDecorridoEsperado = tempoAtual - horaInicial;
            expect(resultado).toBeGreaterThanOrEqual(tempoDecorridoEsperado * 0.9);
            expect(resultado).toBeLessThanOrEqual(tempoDecorridoEsperado * 1.5);
        });
    });
});
