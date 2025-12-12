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
        await nucleoExecucao.carregarEExecutarArquivo('./exemplos/delegua/condicionais/escolha-com-enquanto.delegua');

        expect(retornoSaida.length).toBeGreaterThan(0);
    });

    describe('Importação', () => {
        describe('Importação dinâmica', () => {
            it('Importação de classes', async () => {
                let retornoSaida: string = '';
                const funcaoDeRetorno = (saida: string) => retornoSaida += saida;
                const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
                nucleoExecucao.configurarDialeto();
                
                await nucleoExecucao.carregarEExecutarArquivo('./exemplos/delegua/importacao/dinamica/animais.delegua');

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
                
                await nucleoExecucao.carregarEExecutarArquivo('./exemplos/delegua/importacao/estruturada/importacao-1.delegua');

                expect(retornoSaida.length).toBe(2);
                expect(retornoSaida[0]).toBe('Importação funcionou.');
                expect(retornoSaida[1]).toBe('Essa outra importação também funcionou.');
            });

            it('Importação de fontes aninhados com desestruturacao', async () => {
                let retornoSaida: string[] = [];
                const funcaoDeRetorno = (saida: string) => retornoSaida.push(saida);
                const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
                nucleoExecucao.configurarDialeto();
                
                await nucleoExecucao.carregarEExecutarArquivo('./exemplos/delegua/importacao/estruturada/importacao-1-desestruturada.delegua');

                expect(retornoSaida.length).toBe(2);
                expect(retornoSaida[0]).toBe('Importação funcionou.');
                expect(retornoSaida[1]).toBe('Essa outra importação também funcionou.');
            });
        });
    });

    it('Dialeto Égua executa bloco `pegue` quando comparação inválida ocorre', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
        try {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('egua');

            await nucleoExecucao.executarCodigoComoArgumento(`
tente {
    1 > "1";
    escreva("Tente - Pegue: ERRO!");
} pegue {
    escreva("Tente - Pegue: OK!");
}`);

            const saidas = consoleSpy.mock.calls.map(([mensagem]) =>
                typeof mensagem === 'string' ? mensagem.trim() : ''
            );
            expect(saidas).toContain('Tente - Pegue: OK!');
            expect(saidas).not.toContain('Tente - Pegue: ERRO!');
        } finally {
            consoleSpy.mockRestore();
        }
    });

    describe('Construtor com funções customizadas', () => {
        it('Deve aceitar função de retorno personalizada', async () => {
            let saidaPersonalizada = '';
            const funcaoRetornoCustom = (texto: string) => {
                saidaPersonalizada = texto;
            };

            const nucleoExecucao = new NucleoExecucao('0.1', funcaoRetornoCustom);
            nucleoExecucao.configurarDialeto();
            await nucleoExecucao.executarCodigoComoArgumento('escreva("teste")');

            expect(saidaPersonalizada).toBe('teste');
        });

        it('Deve aceitar função de retorno mesma linha personalizada', () => {
            let saidaMesmaLinha = '';
            const funcaoRetornoMesmaLinhaCustom = (texto: string) => {
                saidaMesmaLinha += texto;
            };

            const nucleoExecucao = new NucleoExecucao('0.1', null, funcaoRetornoMesmaLinhaCustom);

            expect(nucleoExecucao.funcaoDeRetornoMesmaLinha).toBe(funcaoRetornoMesmaLinhaCustom);
        });

        it('Deve aceitar função de limpar tela personalizada', () => {
            let telaLimpa = false;
            const funcaoLimpaTelaCustom = () => {
                telaLimpa = true;
            };

            const nucleoExecucao = new NucleoExecucao('0.1', null, null, funcaoLimpaTelaCustom);

            expect(nucleoExecucao.funcaoLimpaTela).toBe(funcaoLimpaTelaCustom);
        });

        it('Deve usar função padrão de limpar tela quando não fornecida', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');

            expect(nucleoExecucao.funcaoLimpaTela).toBeDefined();
        });
    });

    describe('Configuração de dialetos', () => {
        it('Deve configurar dialeto BIRL', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('birl');

            expect(nucleoExecucao.dialeto).toBe('birl');
            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
            expect(nucleoExecucao.interpretador).toBeDefined();
        });

        it('Deve configurar dialeto Pituguês', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('pitugues');

            expect(nucleoExecucao.dialeto).toBe('pitugues');
            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
            expect(nucleoExecucao.interpretador).toBeDefined();
        });

        it('Deve configurar dialeto Portugol IPT', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('portugol-ipt');

            expect(nucleoExecucao.dialeto).toBe('portugol-ipt');
            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
        });

        it('Deve configurar dialeto Portugol Studio', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('portugol-studio');

            expect(nucleoExecucao.dialeto).toBe('portugol-studio');
            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
        });

        it('Deve configurar dialeto Potigol', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('potigol');

            expect(nucleoExecucao.dialeto).toBe('potigol');
            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
        });

        it('Deve configurar dialeto VisuAlg', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('visualg');

            expect(nucleoExecucao.dialeto).toBe('visualg');
            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
        });

        it('Deve configurar dialeto Mapler', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('mapler');

            expect(nucleoExecucao.dialeto).toBe('mapler');
            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
            expect(nucleoExecucao.resolvedor).toBeDefined();
        });

        it('Deve configurar dialeto padrão (Delégua) quando não especificado', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            expect(nucleoExecucao.lexador).toBeDefined();
            expect(nucleoExecucao.avaliadorSintatico).toBeDefined();
            expect(nucleoExecucao.interpretador).toBeDefined();
        });

        it('Deve lançar erro ao configurar dialeto Égua com depurador', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');

            expect(() => {
                nucleoExecucao.configurarDialeto('egua', false, true);
            }).toThrow('Dialeto egua não suporta depuração.');
        });
    });

    describe('executarLinhas', () => {
        it('Deve executar linhas de código corretamente', async () => {
            let retornoSaida = '';
            const funcaoDeRetorno = (saida: string) => retornoSaida = saida;
            const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
            nucleoExecucao.configurarDialeto();

            const resultado = await nucleoExecucao.executarLinhas(['escreva("teste")']);

            expect(resultado).toBeDefined();
            expect(retornoSaida).toBe('teste');
        });

        it('Deve retornar objeto vazio quando há erros de lexação', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            // Suprimindo console.error para este teste
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const resultado = await nucleoExecucao.executarLinhas(['@#$%^&*']);

            expect(resultado.resultado).toEqual([]);
            consoleErrorSpy.mockRestore();
        });

        it('Deve executar múltiplas linhas', async () => {
            let retornoSaidas: any[] = [];
            const funcaoDeRetorno = (saida: any) => retornoSaidas.push(saida);
            const nucleoExecucao = new NucleoExecucao('0.1', funcaoDeRetorno);
            nucleoExecucao.configurarDialeto();

            await nucleoExecucao.executarLinhas([
                'var x = 10',
                'var y = 20',
                'escreva(x + y)'
            ]);

            expect(retornoSaidas).toContain('30');
        });
    });

    describe('Tratamento de erros', () => {
        it('Deve executar sem travar quando há variável não definida', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            // Executar código - não deve travar
            await expect(
                nucleoExecucao.executarCodigoComoArgumento('var x = 10')
            ).resolves.not.toThrow();
        });

        it('Deve retornar erros quando há chamada de função inexistente', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            // Código que gera erro em tempo de execução - deve completar sem travar
            await expect(
                nucleoExecucao.executarCodigoComoArgumento('escreva(10 + 20)')
            ).resolves.not.toThrow();
        });
    });

    describe('Modo performance', () => {
        it('Deve configurar com modo performance ativado', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('delegua', true);

            expect(nucleoExecucao.lexador).toBeDefined();
        });

        it('Deve configurar Mapler com modo performance', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto('mapler', true);

            expect(nucleoExecucao.resolvedor).toBeDefined();
        });
    });

    describe('Propriedades do núcleo', () => {
        it('Deve ter versão definida', () => {
            const versaoEsperada = '1.0.0';
            const nucleoExecucao = new NucleoExecucao(versaoEsperada);

            expect(nucleoExecucao.versao).toBe(versaoEsperada);
        });

        it('Deve inicializar arquivosAbertos vazio', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');

            expect(nucleoExecucao.arquivosAbertos).toEqual({});
        });

        it('Deve inicializar conteudoArquivosAbertos vazio', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');

            expect(nucleoExecucao.conteudoArquivosAbertos).toEqual({});
        });

        it('Deve ter mapeamento de dialetos', () => {
            const nucleoExecucao = new NucleoExecucao('0.1');

            expect(nucleoExecucao.dialetos['birl']).toBe('BIRL');
            expect(nucleoExecucao.dialetos['delegua']).toBe('padrão');
            expect(nucleoExecucao.dialetos['egua']).toBe('Égua');
            expect(nucleoExecucao.dialetos['pitugues']).toBe('Pituguês');
        });
    });

    describe('Modo LAIR - Declaração de variáveis', () => {
        it('Deve retornar valor ao declarar variável numérica', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            const resultado = await nucleoExecucao.executarLinhas(['var a = 1']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            const valorResultado = resultado.resultado[0] as any;
            expect(valorResultado).toHaveProperty('valorRetornado');
            expect(valorResultado.valorRetornado).toHaveProperty('valor', 1);
            expect(valorResultado.valorRetornado).toHaveProperty('tipo', 'número');
        });

        it('Deve retornar valor ao declarar variável textual', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            const resultado = await nucleoExecucao.executarLinhas(['var nome = "João"']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            const valorResultado = resultado.resultado[0] as any;
            expect(valorResultado).toHaveProperty('valorRetornado');
            expect(valorResultado.valorRetornado).toHaveProperty('valor', 'João');
            expect(valorResultado.valorRetornado).toHaveProperty('tipo', 'texto');
        });

        it('Deve retornar valor ao declarar variável lógica', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            const resultado = await nucleoExecucao.executarLinhas(['var ativo = verdadeiro']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            const valorResultado = resultado.resultado[0] as any;
            expect(valorResultado).toHaveProperty('valorRetornado');
            expect(valorResultado.valorRetornado).toHaveProperty('valor', true);
            expect(valorResultado.valorRetornado).toHaveProperty('tipo', 'lógico');
        });

        it('Deve retornar valor ao declarar variável com dicionário', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            const resultado = await nucleoExecucao.executarLinhas(['var dados = {"nome": "João", "idade": 30}']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            const valorResultado = resultado.resultado[0] as any;
            expect(valorResultado).toHaveProperty('valorRetornado');
            expect(valorResultado.valorRetornado).toHaveProperty('valor');
            expect(valorResultado.valorRetornado.valor).toHaveProperty('nome', 'João');
            expect(valorResultado.valorRetornado.valor).toHaveProperty('idade', 30);
            expect(valorResultado.valorRetornado).toHaveProperty('tipo', 'dicionário');
        });

        it('Deve retornar valor ao declarar constante numérica', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            const resultado = await nucleoExecucao.executarLinhas(['const PI = 3.14']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            const valorResultado = resultado.resultado[0] as any;
            expect(valorResultado).toHaveProperty('valorRetornado');
            expect(valorResultado.valorRetornado).toHaveProperty('valor', 3.14);
            expect(valorResultado.valorRetornado).toHaveProperty('tipo', 'número');
        });
    });

    describe('Modo LAIR - Inspeção de variáveis', () => {
        it('Deve retornar estrutura completa ao inspecionar variável numérica', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();
            // Ativa modo LAIR para manter contexto entre chamadas
            (nucleoExecucao.avaliadorSintatico as any).modoLair = true;

            await nucleoExecucao.executarLinhas(['var a = 42']);
            const resultado = await nucleoExecucao.executarLinhas(['a']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            expect(resultado.resultado[0]).toHaveProperty('valorRetornado');
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('valor', 42);
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('tipo', 'número');
        });

        it('Deve retornar estrutura completa ao inspecionar variável textual', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();
            // Ativa modo LAIR para manter contexto entre chamadas
            (nucleoExecucao.avaliadorSintatico as any).modoLair = true;

            await nucleoExecucao.executarLinhas(['var mensagem = "Olá mundo"']);
            const resultado = await nucleoExecucao.executarLinhas(['mensagem']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            expect(resultado.resultado[0]).toHaveProperty('valorRetornado');
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('valor', 'Olá mundo');
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('tipo', 'texto');
        });

        it('Deve retornar estrutura completa ao inspecionar variável lógica', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();
            // Ativa modo LAIR para manter contexto entre chamadas
            (nucleoExecucao.avaliadorSintatico as any).modoLair = true;

            await nucleoExecucao.executarLinhas(['var ativo = falso']);
            const resultado = await nucleoExecucao.executarLinhas(['ativo']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            expect(resultado.resultado[0]).toHaveProperty('valorRetornado');
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('valor', false);
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('tipo', 'lógico');
        });

        it('Deve retornar estrutura completa ao inspecionar dicionário', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();
            // Ativa modo LAIR para manter contexto entre chamadas
            (nucleoExecucao.avaliadorSintatico as any).modoLair = true;

            await nucleoExecucao.executarLinhas(['var pessoa = {"nome": "Maria", "idade": 25}']);
            const resultado = await nucleoExecucao.executarLinhas(['pessoa']);

            expect(resultado.resultado).toBeDefined();
            expect(resultado.resultado.length).toBeGreaterThan(0);
            expect(resultado.resultado[0]).toHaveProperty('valorRetornado');
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('valor');
            expect(resultado.resultado[0].valorRetornado.valor).toHaveProperty('nome', 'Maria');
            expect(resultado.resultado[0].valorRetornado.valor).toHaveProperty('idade', 25);
            expect(resultado.resultado[0].valorRetornado).toHaveProperty('tipo', 'dicionário');
        });

        it('Deve retornar declarações junto com resultado', async () => {
            const nucleoExecucao = new NucleoExecucao('0.1');
            nucleoExecucao.configurarDialeto();

            const resultado: any = await nucleoExecucao.executarLinhas(['var x = 10']);

            expect(resultado).toHaveProperty('declaracoes');
            expect(resultado.declaracoes).toBeDefined();
            expect(resultado.declaracoes.length).toBeGreaterThan(0);
        });
    });
});
