import * as net from 'net';
import { EventEmitter } from 'events';
import { ServidorDepuracao } from '../fontes/depuracao';
import { NucleoExecucaoInterface } from '../fontes/interfaces/nucleo-execucao-interface';
import { InterpretadorComDepuracaoInterface } from '@designliquido/delegua/interfaces';
import { PontoParada } from '@designliquido/delegua/depuracao/ponto-parada';
import { cyrb53 } from '@designliquido/delegua/geracao-identificadores';

// Mock do Socket
class MockSocket extends EventEmitter {
    remoteAddress = '127.0.0.1';
    remotePort = 12345;
    escritas: string[] = [];

    write(dados: string): boolean {
        this.escritas.push(dados);
        return true;
    }

    setEncoding(encoding: string): this {
        return this;
    }

    end(): this {
        this.emit('close');
        return this;
    }
}

// Mock do Servidor
class MockServer extends EventEmitter {
    listening = false;
    porta?: number;

    listen(porta: number): this {
        this.listening = true;
        this.porta = porta;
        return this;
    }

    address(): net.AddressInfo {
        return {
            address: '127.0.0.1',
            family: 'IPv4',
            port: this.porta || 7777,
        };
    }

    close(): this {
        this.listening = false;
        this.emit('close');
        return this;
    }
}

// Mock global do módulo net
let mockServerInstance: MockServer;
jest.mock('net', () => {
    const actualNet = jest.requireActual('net');
    return {
        ...actualNet,
        createServer: jest.fn(() => {
            mockServerInstance = new MockServer();
            return mockServerInstance;
        }),
    };
});

describe('Servidor de depuração', () => {
    let servidorDepuracao: ServidorDepuracao;
    let mockInterpretador: InterpretadorComDepuracaoInterface;
    let mockNucleoExecucao: NucleoExecucaoInterface;

    const caminhoArquivo = 'D:\\teste\\arquivo.delegua';
    const hashArquivo = cyrb53(caminhoArquivo.toLowerCase());

    beforeEach(() => {
        // Mock do interpretador com depuração
        mockInterpretador = {
            funcaoDeRetorno: jest.fn(),
            pontosParada: [] as PontoParada[],
            pontoDeParadaAtivo: false,
            comando: '',
            pilhaEscoposExecucao: {
                pilha: [
                    {
                        declaracoes: [],
                        declaracaoAtual: 0,
                    },
                    {
                        declaracoes: [
                            {
                                linha: 5,
                                hashArquivo: hashArquivo,
                                assinaturaMetodo: 'testarFuncao',
                            },
                        ],
                        declaracaoAtual: 0,
                    },
                ],
                obterTodasVariaveis: jest.fn().mockReturnValue([
                    { nome: 'x', tipo: 'Número', valor: 42 },
                    { nome: 'nome', tipo: 'Texto', valor: 'Teste' },
                ]),
            },
            obterVariavel: jest.fn((nome: string) => {
                if (nome === 'x') return 42;
                if (nome === 'nome') return 'Teste';
                throw new Error(`Variável '${nome}' não encontrada`);
            }),
            instrucaoPasso: jest.fn().mockResolvedValue(undefined),
            instrucaoContinuarInterpretacao: jest.fn().mockResolvedValue(undefined),
            instrucaoProximoESair: jest.fn().mockResolvedValue(undefined),
        } as unknown as InterpretadorComDepuracaoInterface;

        // Mock do núcleo de execução
        mockNucleoExecucao = {
            interpretador: mockInterpretador,
            funcaoDeRetorno: jest.fn(),
            arquivosAbertos: {
                [hashArquivo]: caminhoArquivo,
            },
            conteudoArquivosAbertos: {
                [hashArquivo]: [
                    'var x = 10;',
                    'var y = 20;',
                    'funcao testarFuncao() {',
                    '    var z = 30;',
                    '    escreva(x + y + z);',
                    '}',
                ],
            },
            executarLinhas: jest.fn().mockResolvedValue({
                resultado: [42],
            }),
        } as unknown as NucleoExecucaoInterface;

        servidorDepuracao = new ServidorDepuracao(mockNucleoExecucao);
    });

    describe('Construtor', () => {
        it('Deve instanciar o servidor corretamente', () => {
            expect(servidorDepuracao).toBeTruthy();
            expect(servidorDepuracao.instanciaNucleoExecucao).toBe(mockNucleoExecucao);
            expect(servidorDepuracao.interpretador).toBe(mockInterpretador);
            expect(servidorDepuracao.conexoes).toEqual({});
            expect(servidorDepuracao.contadorConexoes).toBe(0);
        });

        it('Deve configurar função de retorno no núcleo de execução', () => {
            expect(typeof mockNucleoExecucao.funcaoDeRetorno).toBe('function');
            expect(mockNucleoExecucao.funcaoDeRetorno.name).toContain('escreverSaidaParaTodosClientes');
        });

        it('Deve configurar função de retorno no interpretador', () => {
            expect(typeof mockInterpretador.funcaoDeRetorno).toBe('function');
            expect(mockInterpretador.funcaoDeRetorno.name).toContain('escreverSaidaParaTodosClientes');
        });
    });

    describe('iniciarServidorDepuracao', () => {
        it('Deve iniciar servidor na porta 7777', () => {
            const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

            const endereco = servidorDepuracao.iniciarServidorDepuracao();

            expect(mockServerInstance.listening).toBe(true);
            expect(mockServerInstance.porta).toBe(7777);
            expect(endereco.port).toBe(7777);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Servidor de depuração iniciado na porta 7777')
            );

            consoleSpy.mockRestore();
        });

        it('Deve registrar listener para conexões', () => {
            servidorDepuracao.iniciarServidorDepuracao();

            expect(mockServerInstance.listenerCount('connection')).toBeGreaterThan(0);
        });
    });

    describe('validarPontoParada', () => {
        it('Deve validar ponto de parada com sucesso', () => {
            const mockSocket = new MockSocket();

            const resultado = servidorDepuracao.validarPontoParada(caminhoArquivo, 3, mockSocket as any);

            expect(resultado.sucesso).toBe(true);
            expect(resultado.hashArquivo).toBe(hashArquivo);
            expect(resultado.linha).toBe(3);
            expect(mockSocket.escritas).toHaveLength(0);
        });

        it('Deve falhar quando arquivo não encontrado', () => {
            const mockSocket = new MockSocket();
            const arquivoInexistente = 'D:\\teste\\nao-existe.delegua';

            const resultado = servidorDepuracao.validarPontoParada(arquivoInexistente, 1, mockSocket as any);

            expect(resultado.sucesso).toBe(false);
            expect(mockSocket.escritas[0]).toContain('Arquivo');
            expect(mockSocket.escritas[0]).toContain('não encontrado');
        });

        it('Deve falhar quando linha não existe', () => {
            const mockSocket = new MockSocket();

            const resultado = servidorDepuracao.validarPontoParada(caminhoArquivo, 100, mockSocket as any);

            expect(resultado.sucesso).toBe(false);
            expect(mockSocket.escritas[0]).toContain('Linha 100 não existente');
        });
    });

    describe('comandoAdicionarPontoParada', () => {
        it('Deve adicionar ponto de parada com sucesso', () => {
            const mockSocket = new MockSocket();
            const comando = ['adicionar-ponto-parada', caminhoArquivo, '3'];

            servidorDepuracao.comandoAdicionarPontoParada(comando, mockSocket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(1);
            expect(mockInterpretador.pontosParada[0].hashArquivo).toBe(hashArquivo);
            expect(mockInterpretador.pontosParada[0].linha).toBe(3);
            expect(mockSocket.escritas[0]).toContain('adicionar-ponto-parada');
        });

        it('Deve retornar erro quando formato inválido', () => {
            const mockSocket = new MockSocket();
            const comando = ['adicionar-ponto-parada'];

            servidorDepuracao.comandoAdicionarPontoParada(comando, mockSocket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(0);
            expect(mockSocket.escritas[1]).toContain('Formato:');
        });

        it('Não deve adicionar ponto de parada se validação falhar', () => {
            const mockSocket = new MockSocket();
            const comando = ['adicionar-ponto-parada', 'arquivo-invalido.delegua', '1'];

            servidorDepuracao.comandoAdicionarPontoParada(comando, mockSocket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(0);
        });
    });

    describe('comandoRemoverPontoParada', () => {
        beforeEach(() => {
            mockInterpretador.pontosParada = [
                { hashArquivo: hashArquivo, linha: 3 },
                { hashArquivo: hashArquivo, linha: 5 },
            ];
        });

        it('Deve remover ponto de parada com sucesso', () => {
            const mockSocket = new MockSocket();
            const comando = ['remover-ponto-parada', caminhoArquivo, '3'];

            servidorDepuracao.comandoRemoverPontoParada(comando, mockSocket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(1);
            expect(mockInterpretador.pontosParada[0].linha).toBe(5);
            expect(mockSocket.escritas[0]).toContain('remover-ponto-parada');
        });

        it('Deve retornar erro quando formato inválido', () => {
            const mockSocket = new MockSocket();
            const comando = ['remover-ponto-parada'];

            servidorDepuracao.comandoRemoverPontoParada(comando, mockSocket as any);

            expect(mockSocket.escritas[0]).toContain('Formato:');
            expect(mockSocket.escritas[0]).toContain('remover-ponto-parada');
        });
    });

    describe('comandoPontosParada', () => {
        it('Deve listar pontos de parada', () => {
            const mockSocket = new MockSocket();
            mockInterpretador.pontosParada = [
                { hashArquivo: hashArquivo, linha: 3 },
                { hashArquivo: hashArquivo, linha: 5 },
            ];

            servidorDepuracao.comandoPontosParada(mockSocket as any);

            expect(mockSocket.escritas[0]).toContain('pontos-parada');
            expect(mockSocket.escritas[0]).toContain(caminhoArquivo);
            expect(mockSocket.escritas[0]).toContain('3');
            expect(mockSocket.escritas[0]).toContain('5');
        });

        it('Deve funcionar com lista vazia de pontos de parada', () => {
            const mockSocket = new MockSocket();

            servidorDepuracao.comandoPontosParada(mockSocket as any);

            expect(mockSocket.escritas[0]).toContain('pontos-parada');
        });
    });

    describe('comandoProximo', () => {
        it('Deve executar próximo passo', async () => {
            const mockSocket = new MockSocket();

            await servidorDepuracao.comandoProximo(mockSocket as any);

            expect(mockInterpretador.comando).toBe('proximo');
            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoPasso).toHaveBeenCalled();
            expect(mockSocket.escritas[0]).toContain('proximo');
        });

        it('Deve capturar erros durante execução', async () => {
            const mockSocket = new MockSocket();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockInterpretador.instrucaoPasso = jest.fn().mockRejectedValue(new Error('Erro de execução'));

            await servidorDepuracao.comandoProximo(mockSocket as any);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('comandoAdentrarEscopo', () => {
        it('Deve executar adentrar escopo', async () => {
            const mockSocket = new MockSocket();

            await servidorDepuracao.comandoAdentrarEscopo(mockSocket as any);

            expect(mockInterpretador.comando).toBe('adentrarEscopo');
            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoPasso).toHaveBeenCalled();
            expect(mockSocket.escritas[0]).toContain('adentrar-escopo');
        });
    });

    describe('comandoSairEscopo', () => {
        it('Deve executar sair escopo', async () => {
            const mockSocket = new MockSocket();

            await servidorDepuracao.comandoSairEscopo(mockSocket as any);

            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoProximoESair).toHaveBeenCalled();
            expect(mockSocket.escritas[0]).toContain('sair-escopo');
        });
    });

    describe('comandoContinuar', () => {
        it('Deve continuar execução', async () => {
            const mockSocket = new MockSocket();

            await servidorDepuracao.comandoContinuar(mockSocket as any);

            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoContinuarInterpretacao).toHaveBeenCalled();
            expect(mockSocket.escritas[0]).toContain('continuar');
        });
    });

    describe('comandoVariaveis', () => {
        it('Deve listar variáveis do escopo atual', () => {
            const mockSocket = new MockSocket();

            servidorDepuracao.comandoVariaveis(mockSocket as any);

            expect(mockInterpretador.pilhaEscoposExecucao.obterTodasVariaveis).toHaveBeenCalled();
            expect(mockSocket.escritas[0]).toContain('variaveis');
            expect(mockSocket.escritas[0]).toContain('x');
            expect(mockSocket.escritas[0]).toContain('Número');
            expect(mockSocket.escritas[0]).toContain('42');
            expect(mockSocket.escritas[0]).toContain('nome');
            expect(mockSocket.escritas[0]).toContain('Texto');
            expect(mockSocket.escritas[0]).toContain('Teste');
        });
    });

    describe('comandoAvaliarVariavel', () => {
        it('Deve avaliar variável existente', async () => {
            const mockSocket = new MockSocket();
            const comando = ['avaliar-variavel', 'x'];

            await servidorDepuracao.comandoAvaliarVariavel(comando, mockSocket as any);

            expect(mockInterpretador.obterVariavel).toHaveBeenCalledWith('x');
            expect(mockSocket.escritas[0]).toContain('avaliar-variavel');
            expect(mockSocket.escritas[0]).toContain('42');
        });

        it('Deve retornar erro para variável inexistente', async () => {
            const mockSocket = new MockSocket();
            const comando = ['avaliar-variavel', 'variavelInexistente'];

            await servidorDepuracao.comandoAvaliarVariavel(comando, mockSocket as any);

            expect(mockSocket.escritas[0]).toContain('avaliar-variavel');
            expect(mockSocket.escritas[0]).toContain('não encontrada');
        });

        it('Deve juntar partes do nome da variável', async () => {
            const mockSocket = new MockSocket();
            const comando = ['avaliar-variavel', 'variavel', 'com', 'espacos'];

            await servidorDepuracao.comandoAvaliarVariavel(comando, mockSocket as any);

            expect(mockInterpretador.obterVariavel).toHaveBeenCalledWith('variavel com espacos');
        });
    });

    describe('comandoAvaliar', () => {
        it('Deve avaliar expressão com sucesso', async () => {
            const mockSocket = new MockSocket();
            const comando = ['avaliar', 'x', '+', 'y'];

            await servidorDepuracao.comandoAvaliar(comando, mockSocket as any);

            expect(mockNucleoExecucao.executarLinhas).toHaveBeenCalledWith(['x + y']);
            expect(mockSocket.escritas[0]).toContain('avaliar');
            expect(mockSocket.escritas[0]).toContain('42');
        });

        it('Deve capturar erros durante avaliação', async () => {
            const mockSocket = new MockSocket();
            const comando = ['avaliar', 'expressao', 'invalida'];
            mockNucleoExecucao.executarLinhas = jest.fn().mockRejectedValue(new Error('Erro de sintaxe'));

            await servidorDepuracao.comandoAvaliar(comando, mockSocket as any);

            expect(mockSocket.escritas[0]).toContain('Erro de sintaxe');
        });
    });

    describe('comandoPilhaExecucao', () => {
        it('Deve retornar pilha de execução', () => {
            const mockSocket = new MockSocket();

            servidorDepuracao.comandoPilhaExecucao(mockSocket as any);

            expect(mockSocket.escritas[0]).toContain('pilha-execucao');
            expect(mockSocket.escritas[0]).toContain('testarFuncao');
            expect(mockSocket.escritas[0]).toContain(caminhoArquivo);
        });

        it('Deve capturar erros ao gerar pilha', () => {
            const mockSocket = new MockSocket();
            mockInterpretador.pilhaEscoposExecucao.pilha = null as any;

            servidorDepuracao.comandoPilhaExecucao(mockSocket as any);

            expect(mockSocket.escritas[0]).toBeTruthy();
        });
    });

    describe('operarConexao', () => {
        let mockSocket: MockSocket;
        let consoleSpy: jest.SpyInstance;

        beforeEach(() => {
            mockSocket = new MockSocket();
            consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        it('Deve processar comando adicionar-ponto-parada', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from(`adicionar-ponto-parada ${caminhoArquivo} 3\n`));

            expect(mockInterpretador.pontosParada).toHaveLength(1);
        });

        it('Deve processar comando remover-ponto-parada', () => {
            mockInterpretador.pontosParada = [{ hashArquivo: hashArquivo, linha: 3 }];
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from(`remover-ponto-parada ${caminhoArquivo} 3\n`));

            expect(mockInterpretador.pontosParada).toHaveLength(0);
        });

        it('Deve processar comando pontos-parada', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('pontos-parada\n'));

            expect(mockSocket.escritas.some(e => e.includes('pontos-parada'))).toBe(true);
        });

        it('Deve processar comando proximo', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('proximo\n'));

            expect(mockInterpretador.comando).toBe('proximo');
        });

        it('Deve processar comando adentrar-escopo', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('adentrar-escopo\n'));

            expect(mockInterpretador.comando).toBe('adentrarEscopo');
        });

        it('Deve processar comando sair-escopo', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('sair-escopo\n'));

            expect(mockInterpretador.instrucaoProximoESair).toHaveBeenCalled();
        });

        it('Deve processar comando continuar', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('continuar\n'));

            expect(mockInterpretador.instrucaoContinuarInterpretacao).toHaveBeenCalled();
        });

        it('Deve processar comando variaveis', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('variaveis\n'));

            expect(mockSocket.escritas.some(e => e.includes('variaveis'))).toBe(true);
        });

        it('Deve processar comando avaliar-variavel', async () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('avaliar-variavel x\n'));

            await new Promise(resolve => setTimeout(resolve, 10));
            expect(mockSocket.escritas.some(e => e.includes('avaliar-variavel'))).toBe(true);
        });

        it('Deve processar comando avaliar', async () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('avaliar 1 + 1\n'));

            await new Promise(resolve => setTimeout(resolve, 10));
            expect(mockSocket.escritas.some(e => e.includes('avaliar'))).toBe(true);
        });

        it('Deve processar comando pilha-execucao', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('pilha-execucao\n'));

            expect(mockSocket.escritas.some(e => e.includes('pilha-execucao'))).toBe(true);
        });

        it('Deve processar comando tchau e finalizar servidor', () => {
            const finalizarSpy = jest.spyOn(servidorDepuracao, 'finalizarServidorDepuracao');
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('tchau\n'));

            expect(mockSocket.escritas.some(e => e.includes('tchau'))).toBe(true);
            expect(finalizarSpy).toHaveBeenCalled();
        });

        it('Deve processar múltiplos comandos separados por quebra de linha', () => {
            servidorDepuracao.operarConexao(mockSocket as any);
            mockSocket.emit('data', Buffer.from('pontos-parada\nvariaveis\n'));

            expect(mockSocket.escritas.some(e => e.includes('pontos-parada'))).toBe(true);
            expect(mockSocket.escritas.some(e => e.includes('variaveis'))).toBe(true);
        });

        it('Deve registrar conexão ao conectar', () => {
            expect(servidorDepuracao.contadorConexoes).toBe(0);

            servidorDepuracao.operarConexao(mockSocket as any);

            expect(servidorDepuracao.contadorConexoes).toBe(1);
            expect(Object.keys(servidorDepuracao.conexoes)).toHaveLength(1);
        });

        it('Deve configurar encoding UTF-8', () => {
            const setEncodingSpy = jest.spyOn(mockSocket, 'setEncoding');

            servidorDepuracao.operarConexao(mockSocket as any);

            expect(setEncodingSpy).toHaveBeenCalledWith('utf8');
        });

        it('Deve exibir mensagem ao fechar conexão', () => {
            servidorDepuracao.operarConexao(mockSocket as any);

            mockSocket.emit('close');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Conexão de 127.0.0.1:12345 fechada')
            );
        });

        it('Deve exibir mensagem ao ocorrer erro', () => {
            servidorDepuracao.operarConexao(mockSocket as any);

            mockSocket.emit('error', new Error('Erro de conexão'));

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Erro de conexão')
            );
        });
    });

    describe('escreverSaidaParaTodosClientes', () => {
        it('Deve enviar mensagem para todos os clientes conectados', () => {
            const socket1 = new MockSocket();
            const socket2 = new MockSocket();

            servidorDepuracao.conexoes[0] = socket1;
            servidorDepuracao.conexoes[1] = socket2;

            servidorDepuracao.escreverSaidaParaTodosClientes('Mensagem de teste');

            expect(socket1.escritas[0]).toContain('Mensagem de teste');
            expect(socket1.escritas[0]).toContain('mensagem-saida');
            expect(socket2.escritas[0]).toContain('Mensagem de teste');
            expect(socket2.escritas[0]).toContain('mensagem-saida');
        });

        it('Deve funcionar sem clientes conectados', () => {
            expect(() => {
                servidorDepuracao.escreverSaidaParaTodosClientes('Teste');
            }).not.toThrow();
        });
    });

    describe('finalizarServidorDepuracao', () => {
        it('Deve finalizar todas as conexões e fechar servidor', () => {
            const socket1 = new MockSocket();
            const socket2 = new MockSocket();
            const endSpy1 = jest.spyOn(socket1, 'end');
            const endSpy2 = jest.spyOn(socket2, 'end');

            servidorDepuracao.conexoes[0] = socket1;
            servidorDepuracao.conexoes[1] = socket2;

            servidorDepuracao.finalizarServidorDepuracao();

            expect(socket1.escritas[0]).toContain('finalizando');
            expect(socket2.escritas[0]).toContain('finalizando');
            expect(endSpy1).toHaveBeenCalled();
            expect(endSpy2).toHaveBeenCalled();
            expect(mockServerInstance.listening).toBe(false);
        });

        it('Deve funcionar sem conexões ativas', () => {
            expect(() => {
                servidorDepuracao.finalizarServidorDepuracao();
            }).not.toThrow();

            expect(mockServerInstance.listening).toBe(false);
        });
    });

    describe('Integração de fluxo completo', () => {
        it('Deve executar fluxo completo de depuração', async () => {
            const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            const mockSocket = new MockSocket();

            // Iniciar servidor
            servidorDepuracao.iniciarServidorDepuracao();

            // Simular conexão
            mockServerInstance.emit('connection', mockSocket);

            // Adicionar ponto de parada
            mockSocket.emit('data', Buffer.from(`adicionar-ponto-parada ${caminhoArquivo} 3\n`));
            expect(mockInterpretador.pontosParada).toHaveLength(1);

            // Listar pontos de parada
            mockSocket.emit('data', Buffer.from('pontos-parada\n'));
            expect(mockSocket.escritas.some(e => e.includes('pontos-parada'))).toBe(true);

            // Executar próximo passo
            mockSocket.emit('data', Buffer.from('proximo\n'));
            await new Promise(resolve => setTimeout(resolve, 10));

            // Listar variáveis
            mockSocket.emit('data', Buffer.from('variaveis\n'));
            expect(mockSocket.escritas.some(e => e.includes('variaveis'))).toBe(true);

            // Avaliar variável
            mockSocket.emit('data', Buffer.from('avaliar-variavel x\n'));
            await new Promise(resolve => setTimeout(resolve, 10));

            // Remover ponto de parada
            mockSocket.emit('data', Buffer.from(`remover-ponto-parada ${caminhoArquivo} 3\n`));
            expect(mockInterpretador.pontosParada).toHaveLength(0);

            // Finalizar
            mockSocket.emit('data', Buffer.from('tchau\n'));

            consoleSpy.mockRestore();
        });
    });
});
