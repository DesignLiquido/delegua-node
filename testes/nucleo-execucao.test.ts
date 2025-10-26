// import * as sistemaArquivos from 'fs';
// import * as caminho from 'path';
// import {expect, jest, test} from '@jest/globals';

import { NucleoExecucao } from '../fontes/nucleo-execucao';

// jest.mock('fs');
// jest.mock('path');

describe('Núcleo de execução', () => {
    afterAll(() => {
        // Necessário para prevenir problemas com open handles do Jest.
        process.stdin.destroy();
    });

    it('`executarCodigoComoArgumento`, trivial', async () => {
        let retornoSaida: string = '';
        const funcaoDeRetorno = (saida: string) => retornoSaida = saida;
        const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
        nucleoExecucao.configurarDialeto();
        await nucleoExecucao.executarCodigoComoArgumento('escreva("Olá mundo!")');

        expect(retornoSaida).toBe('Olá mundo!');
    });

    it('`executarCodigoComoArgumento`, arquivo', async () => {
        let retornoSaida: string = '';
        const funcaoDeRetorno = (saida: string) => retornoSaida += saida;
        const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
        nucleoExecucao.configurarDialeto();
        
        // Aqui vamos simular a resposta para duas variáveis de `leia()`.
        const respostas = [
            '1', '0'
        ];
        nucleoExecucao.interpretador.interfaceEntradaSaida = {
            question: (mensagem: string, callback: Function) => {
                callback(respostas.shift());
            }
        };
        await nucleoExecucao.carregarEExecutarArquivo('./exemplos/condicionais/escolha-com-enquanto.delegua');

        expect(retornoSaida.length).toBeGreaterThan(0);
    });

    describe('Importação', () => {
        describe('Importação dinâmica', () => {
            it('Importação de classes', async () => {
                let retornoSaida: string = '';
                const funcaoDeRetorno = (saida: string) => retornoSaida += saida;
                const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
                nucleoExecucao.configurarDialeto();
                
                await nucleoExecucao.carregarEExecutarArquivo('./exemplos/importacao/dinamica/animais.delegua');

                expect(retornoSaida.length).toBeGreaterThan(0);
                expect(retornoSaida).toBe('correndo');
            });
        });

        describe('Importação estruturada', () => {
            it('Importação de fontes aninhados com tudo', async () => {
                let retornoSaida: string[] = [];
                const funcaoDeRetorno = (saida: string) => retornoSaida.push(saida);
                const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
                nucleoExecucao.configurarDialeto();
                
                await nucleoExecucao.carregarEExecutarArquivo('./exemplos/importacao/estruturada/importacao-1.delegua');

                expect(retornoSaida.length).toBe(2);
                expect(retornoSaida[0]).toBe('Importação funcionou.');
                expect(retornoSaida[1]).toBe('Essa outra importação também funcionou.');
            });

            it('Importação de fontes aninhados com desestruturacao', async () => {
                let retornoSaida: string[] = [];
                const funcaoDeRetorno = (saida: string) => retornoSaida.push(saida);
                const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
                nucleoExecucao.configurarDialeto();
                
                await nucleoExecucao.carregarEExecutarArquivo('./exemplos/importacao/estruturada/importacao-1-desestruturada.delegua');

                expect(retornoSaida.length).toBe(2);
                expect(retornoSaida[0]).toBe('Importação funcionou.');
                expect(retornoSaida[1]).toBe('Essa outra importação também funcionou.');
            });
        });
    });
});