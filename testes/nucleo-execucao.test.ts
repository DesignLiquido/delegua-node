import * as sistemaArquivos from 'fs';
import * as caminho from 'path';
import {expect, jest, test} from '@jest/globals';

import { NucleoExecucao } from '../fontes/nucleo-execucao';

jest.mock('fs');
jest.mock('path');

describe('Núcleo de execução', () => {
    it('`executarCodigoComoArgumento`, trivial', async () => {
        let retornoSaida: string = '';
        const funcaoDeRetorno = (saida: string) => retornoSaida = saida;
        const nucleoExecucao = new NucleoExecucao(funcaoDeRetorno);
        nucleoExecucao.configurarDialeto();
        await nucleoExecucao.executarCodigoComoArgumento('escreva("Olá mundo!")');

        expect(retornoSaida).toBe('Olá mundo!');
    });
});