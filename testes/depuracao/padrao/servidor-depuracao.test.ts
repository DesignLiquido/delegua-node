import * as net from 'net';
import { EventEmitter } from 'events';
import { ServidorDepuracao } from '../../../fontes/depuracao/servidor-depuracao';
import { NucleoExecucaoInterface } from '../../../fontes/interfaces/nucleo-execucao-interface';
import { InterpretadorComDepuracaoInterface } from '@designliquido/delegua/interfaces';
import { PontoParada } from '@designliquido/delegua/depuracao/ponto-parada';
import { cyrb53 } from '@designliquido/delegua/geracao-identificadores';

class MockSocket extends EventEmitter {
    remoteAddress = '127.0.0.1';
    remotePort = 12345;
    escritas: string[] = [];

    write(dados: string): boolean {
        this.escritas.push(dados);
        return true;
    }

    setEncoding(_encoding: string): this {
        return this;
    }

    end(): this {
        this.emit('close');
        return this;
    }
}

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

let instanciaServidorMock: MockServer;
jest.mock('net', () => {
    const netReal = jest.requireActual('net');
    return {
        ...netReal,
        createServer: jest.fn(() => {
            instanciaServidorMock = new MockServer();
            return instanciaServidorMock;
        }),
    };
});

describe('ServidorDepuracao', () => {
    let servidorDepuracao: ServidorDepuracao;
    let mockInterpretador: InterpretadorComDepuracaoInterface;
    let mockNucleoExecucao: NucleoExecucaoInterface;

    const caminhoArquivo = 'D:\\testes\\exemplo.delegua';
    const hashArquivo = cyrb53(caminhoArquivo.toLowerCase());
    const linhasArquivo = [
        'var x = 10',
        'var y = 20',
        'funcao calcular() {',
        '    var resultado = x + y',
        '    escreva(resultado)',
        '}',
        'calcular()',
    ];

    beforeEach(() => {
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
                                assinaturaMetodo: 'calcular',
                            },
                        ],
                        declaracaoAtual: 0,
                    },
                ],
                obterTodasVariaveis: jest.fn().mockReturnValue([
                    { nome: 'x', tipo: 'Número', valor: 10 },
                    { nome: 'y', tipo: 'Número', valor: 20 },
                    { nome: 'resultado', tipo: 'Número', valor: 30 },
                ]),
            },
            obterVariavel: jest.fn((nome: string) => {
                const variaveis: Record<string, any> = { x: 10, y: 20, resultado: 30 };
                if (nome in variaveis) return variaveis[nome];
                throw new Error(`Variável '${nome}' não encontrada`);
            }),
            instrucaoPasso: jest.fn().mockResolvedValue(undefined),
            instrucaoContinuarInterpretacao: jest.fn().mockResolvedValue(undefined),
            instrucaoProximoESair: jest.fn().mockResolvedValue(undefined),
        } as unknown as InterpretadorComDepuracaoInterface;

        mockNucleoExecucao = {
            interpretador: mockInterpretador,
            funcaoDeRetorno: jest.fn(),
            arquivosAbertos: {
                [hashArquivo]: caminhoArquivo,
            },
            conteudoArquivosAbertos: {
                [hashArquivo]: linhasArquivo,
            },
            executarLinhas: jest.fn().mockResolvedValue({
                resultado: [30],
            }),
        } as unknown as NucleoExecucaoInterface;

        servidorDepuracao = new ServidorDepuracao(mockNucleoExecucao);
    });

    describe('Construtor', () => {
        it('deve inicializar propriedades corretamente', () => {
            expect(servidorDepuracao.instanciaNucleoExecucao).toBe(mockNucleoExecucao);
            expect(servidorDepuracao.interpretador).toBe(mockInterpretador);
            expect(servidorDepuracao.conexoes).toEqual({});
            expect(servidorDepuracao.contadorConexoes).toBe(0);
        });

        it('deve atribuir funcaoDeRetorno ao nucleo de execucao apontando para escreverSaidaParaTodosClientes', () => {
            expect(typeof mockNucleoExecucao.funcaoDeRetorno).toBe('function');
            expect((mockNucleoExecucao.funcaoDeRetorno as Function).name).toContain('escreverSaidaParaTodosClientes');
        });

        it('deve atribuir funcaoDeRetorno ao interpretador apontando para escreverSaidaParaTodosClientes', () => {
            expect(typeof mockInterpretador.funcaoDeRetorno).toBe('function');
            expect((mockInterpretador.funcaoDeRetorno as Function).name).toContain('escreverSaidaParaTodosClientes');
        });
    });

    describe('iniciarServidorDepuracao', () => {
        it('deve iniciar o servidor na porta 7777 e retornar o endereço', () => {
            const saidaSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

            const endereco = servidorDepuracao.iniciarServidorDepuracao();

            expect(instanciaServidorMock.listening).toBe(true);
            expect(instanciaServidorMock.porta).toBe(7777);
            expect(endereco.port).toBe(7777);
            expect(saidaSpy).toHaveBeenCalledWith(expect.stringContaining('7777'));

            saidaSpy.mockRestore();
        });

        it('deve registrar o listener de conexão no servidor', () => {
            servidorDepuracao.iniciarServidorDepuracao();
            expect(instanciaServidorMock.listenerCount('connection')).toBeGreaterThan(0);
        });
    });

    describe('validarPontoParada', () => {
        it('deve retornar sucesso para arquivo e linha validos', () => {
            const socket = new MockSocket();
            const resultado = servidorDepuracao.validarPontoParada(caminhoArquivo, 3, socket as any);

            expect(resultado.sucesso).toBe(true);
            expect(resultado.hashArquivo).toBe(hashArquivo);
            expect(resultado.linha).toBe(3);
            expect(socket.escritas).toHaveLength(0);
        });

        it('deve falhar e notificar quando o arquivo nao esta aberto', () => {
            const socket = new MockSocket();
            const resultado = servidorDepuracao.validarPontoParada('D:\\nao-existe.delegua', 1, socket as any);

            expect(resultado.sucesso).toBe(false);
            expect(socket.escritas[0]).toContain('não encontrado');
        });

        it('deve falhar e notificar quando a linha excede o tamanho do arquivo', () => {
            const socket = new MockSocket();
            const resultado = servidorDepuracao.validarPontoParada(caminhoArquivo, 999, socket as any);

            expect(resultado.sucesso).toBe(false);
            expect(socket.escritas[0]).toContain('999');
            expect(socket.escritas[0]).toContain('não existente');
        });

        it('deve aceitar a ultima linha valida do arquivo', () => {
            const socket = new MockSocket();
            const ultimaLinha = linhasArquivo.length;
            const resultado = servidorDepuracao.validarPontoParada(caminhoArquivo, ultimaLinha, socket as any);

            expect(resultado.sucesso).toBe(true);
        });
    });

    describe('comandoAdicionarPontoParada', () => {
        it('deve adicionar ponto de parada valido ao interpretador', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoAdicionarPontoParada(['adicionar-ponto-parada', caminhoArquivo, '3'], socket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(1);
            expect(mockInterpretador.pontosParada[0].hashArquivo).toBe(hashArquivo);
            expect(mockInterpretador.pontosParada[0].linha).toBe(3);
        });

        it('deve escrever mensagem de confirmacao no socket', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoAdicionarPontoParada(['adicionar-ponto-parada', caminhoArquivo, '2'], socket as any);

            expect(socket.escritas[0]).toContain('adicionar-ponto-parada');
        });

        it('deve informar formato correto quando o comando tem menos de 3 partes', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoAdicionarPontoParada(['adicionar-ponto-parada'], socket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(0);
            expect(socket.escritas.join('')).toContain('Formato:');
        });

        it('nao deve adicionar ponto de parada se validacao falhar', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoAdicionarPontoParada(['adicionar-ponto-parada', 'invalido.delegua', '1'], socket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(0);
        });
    });

    describe('comandoRemoverPontoParada', () => {
        beforeEach(() => {
            mockInterpretador.pontosParada = [
                { hashArquivo: hashArquivo, linha: 2 },
                { hashArquivo: hashArquivo, linha: 5 },
            ];
        });

        it('deve remover somente o ponto de parada especificado', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoRemoverPontoParada(['remover-ponto-parada', caminhoArquivo, '2'], socket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(1);
            expect(mockInterpretador.pontosParada[0].linha).toBe(5);
        });

        it('deve escrever mensagem de confirmacao ao remover com sucesso', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoRemoverPontoParada(['remover-ponto-parada', caminhoArquivo, '2'], socket as any);

            expect(socket.escritas.join('')).toContain('removido com sucesso');
        });

        it('deve informar formato correto quando o comando tem menos de 3 partes', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoRemoverPontoParada(['remover-ponto-parada'], socket as any);

            expect(mockInterpretador.pontosParada).toHaveLength(2);
            expect(socket.escritas.join('')).toContain('Formato:');
        });
    });

    describe('comandoPontosParada', () => {
        it('deve listar todos os pontos de parada registrados', () => {
            const socket = new MockSocket();
            mockInterpretador.pontosParada = [
                { hashArquivo: hashArquivo, linha: 2 },
                { hashArquivo: hashArquivo, linha: 5 },
            ];

            servidorDepuracao.comandoPontosParada(socket as any);

            const saida = socket.escritas.join('');
            expect(saida).toContain('pontos-parada');
            expect(saida).toContain(caminhoArquivo);
            expect(saida).toContain('2');
            expect(saida).toContain('5');
        });

        it('deve funcionar sem pontos de parada cadastrados', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoPontosParada(socket as any);

            expect(socket.escritas[0]).toContain('pontos-parada');
        });
    });

    describe('comandoProximo', () => {
        it('deve definir comando como proximo e chamar instrucaoPasso', async () => {
            const socket = new MockSocket();
            await servidorDepuracao.comandoProximo(socket as any);

            expect(mockInterpretador.comando).toBe('proximo');
            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoPasso).toHaveBeenCalled();
            expect(socket.escritas[0]).toContain('proximo');
        });

        it('deve capturar e registrar erros de instrucaoPasso sem lancar excecao', async () => {
            const socket = new MockSocket();
            const erroSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockInterpretador.instrucaoPasso = jest.fn().mockRejectedValue(new Error('Falha na instrução'));

            await expect(servidorDepuracao.comandoProximo(socket as any)).resolves.not.toThrow();
            expect(erroSpy).toHaveBeenCalled();

            erroSpy.mockRestore();
        });
    });

    describe('comandoAdentrarEscopo', () => {
        it('deve definir comando como adentrarEscopo e chamar instrucaoPasso', async () => {
            const socket = new MockSocket();
            await servidorDepuracao.comandoAdentrarEscopo(socket as any);

            expect(mockInterpretador.comando).toBe('adentrarEscopo');
            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoPasso).toHaveBeenCalled();
            expect(socket.escritas[0]).toContain('adentrar-escopo');
        });
    });

    describe('comandoSairEscopo', () => {
        it('deve chamar instrucaoProximoESair e escrever resposta no socket', async () => {
            const socket = new MockSocket();
            await servidorDepuracao.comandoSairEscopo(socket as any);

            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoProximoESair).toHaveBeenCalled();
            expect(socket.escritas[0]).toContain('sair-escopo');
        });
    });

    describe('comandoContinuar', () => {
        it('deve desativar ponto de parada e chamar instrucaoContinuarInterpretacao', async () => {
            const socket = new MockSocket();
            mockInterpretador.pontoDeParadaAtivo = true;

            await servidorDepuracao.comandoContinuar(socket as any);

            expect(mockInterpretador.pontoDeParadaAtivo).toBe(false);
            expect(mockInterpretador.instrucaoContinuarInterpretacao).toHaveBeenCalled();
            expect(socket.escritas[0]).toContain('continuar');
        });
    });

    describe('comandoVariaveis', () => {
        it('deve listar variaveis do escopo atual com nome, tipo e valor', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoVariaveis(socket as any);

            const saida = socket.escritas.join('');
            expect(saida).toContain('variaveis');
            expect(saida).toContain('x');
            expect(saida).toContain('Número');
            expect(saida).toContain('10');
            expect(saida).toContain('y');
            expect(saida).toContain('resultado');
            expect(saida).toContain('30');
        });

        it('deve chamar obterTodasVariaveis da pilha de escopos', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoVariaveis(socket as any);

            expect(mockInterpretador.pilhaEscoposExecucao.obterTodasVariaveis).toHaveBeenCalled();
        });
    });

    describe('comandoAvaliarVariavel', () => {
        it('deve avaliar variavel existente e retornar o valor', async () => {
            const socket = new MockSocket();
            await servidorDepuracao.comandoAvaliarVariavel(['avaliar-variavel', 'x'], socket as any);

            expect(mockInterpretador.obterVariavel).toHaveBeenCalledWith('x');
            const saida = socket.escritas.join('');
            expect(saida).toContain('avaliar-variavel');
            expect(saida).toContain('10');
        });

        it('deve capturar e exibir erro para variavel inexistente', async () => {
            const socket = new MockSocket();
            await servidorDepuracao.comandoAvaliarVariavel(['avaliar-variavel', 'zz'], socket as any);

            expect(socket.escritas.join('')).toContain('não encontrada');
        });

        it('deve juntar partes do nome separadas por espaco', async () => {
            const socket = new MockSocket();
            await servidorDepuracao.comandoAvaliarVariavel(['avaliar-variavel', 'minha', 'variavel'], socket as any);

            expect(mockInterpretador.obterVariavel).toHaveBeenCalledWith('minha variavel');
        });
    });

    describe('comandoAvaliar', () => {
        it('deve avaliar expressao e retornar resultado', async () => {
            const socket = new MockSocket();
            await servidorDepuracao.comandoAvaliar(['avaliar', 'x', '+', 'y'], socket as any);

            expect(mockNucleoExecucao.executarLinhas).toHaveBeenCalledWith(['x + y']);
            const saida = socket.escritas.join('');
            expect(saida).toContain('avaliar');
            expect(saida).toContain('30');
        });

        it('deve capturar e exibir erro de execucao no socket', async () => {
            const socket = new MockSocket();
            mockNucleoExecucao.executarLinhas = jest.fn().mockRejectedValue(new Error('Sintaxe inválida'));

            await servidorDepuracao.comandoAvaliar(['avaliar', 'expressao', 'quebrada'], socket as any);

            expect(socket.escritas.join('')).toContain('Sintaxe inválida');
        });
    });

    describe('comandoPilhaExecucao', () => {
        it('deve retornar informacoes da pilha de execucao', () => {
            const socket = new MockSocket();
            servidorDepuracao.comandoPilhaExecucao(socket as any);

            const saida = socket.escritas.join('');
            expect(saida).toContain('pilha-execucao');
            expect(saida).toContain('calcular');
            expect(saida).toContain(caminhoArquivo);
        });

        it('deve capturar erros ao gerar a pilha e escrever no socket', () => {
            const socket = new MockSocket();
            mockInterpretador.pilhaEscoposExecucao.pilha = null as any;

            servidorDepuracao.comandoPilhaExecucao(socket as any);

            expect(socket.escritas.length).toBeGreaterThan(0);
        });
    });

    describe('operarConexao', () => {
        let socket: MockSocket;
        let saidaSpy: jest.SpyInstance;

        beforeEach(() => {
            socket = new MockSocket();
            saidaSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        });

        afterEach(() => {
            saidaSpy.mockRestore();
        });

        it('deve registrar a conexao e incrementar o contador', () => {
            servidorDepuracao.operarConexao(socket as any);

            expect(servidorDepuracao.contadorConexoes).toBe(1);
            expect(Object.keys(servidorDepuracao.conexoes)).toHaveLength(1);
        });

        it('deve configurar encoding utf8 na conexao', () => {
            const encodingSpy = jest.spyOn(socket, 'setEncoding');
            servidorDepuracao.operarConexao(socket as any);

            expect(encodingSpy).toHaveBeenCalledWith('utf8');
        });

        it('deve exibir mensagem de nova conexao', () => {
            servidorDepuracao.operarConexao(socket as any);

            expect(saidaSpy).toHaveBeenCalledWith(expect.stringContaining('Nova conexão'));
        });

        it('deve exibir mensagem ao fechar conexao', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('close');

            expect(saidaSpy).toHaveBeenCalledWith(expect.stringContaining('fechada'));
        });

        it('deve exibir mensagem ao ocorrer erro na conexao', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('error', new Error('Erro de rede'));

            expect(saidaSpy).toHaveBeenCalledWith(expect.stringContaining('Erro de rede'));
        });

        it('deve despachar comando adicionar-ponto-parada ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from(`adicionar-ponto-parada ${caminhoArquivo} 3\n`));

            expect(mockInterpretador.pontosParada).toHaveLength(1);
        });

        it('deve despachar comando remover-ponto-parada ao receber dados', () => {
            mockInterpretador.pontosParada = [{ hashArquivo: hashArquivo, linha: 3 }];
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from(`remover-ponto-parada ${caminhoArquivo} 3\n`));

            expect(mockInterpretador.pontosParada).toHaveLength(0);
        });

        it('deve despachar comando pontos-parada ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('pontos-parada\n'));

            expect(socket.escritas.some((e) => e.includes('pontos-parada'))).toBe(true);
        });

        it('deve despachar comando proximo ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('proximo\n'));

            expect(mockInterpretador.comando).toBe('proximo');
        });

        it('deve despachar comando adentrar-escopo ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('adentrar-escopo\n'));

            expect(mockInterpretador.comando).toBe('adentrarEscopo');
        });

        it('deve despachar comando sair-escopo ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('sair-escopo\n'));

            expect(mockInterpretador.instrucaoProximoESair).toHaveBeenCalled();
        });

        it('deve despachar comando continuar ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('continuar\n'));

            expect(mockInterpretador.instrucaoContinuarInterpretacao).toHaveBeenCalled();
        });

        it('deve despachar comando variaveis ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('variaveis\n'));

            expect(socket.escritas.some((e) => e.includes('variaveis'))).toBe(true);
        });

        it('deve despachar comando avaliar-variavel ao receber dados', async () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('avaliar-variavel x\n'));

            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(socket.escritas.some((e) => e.includes('avaliar-variavel'))).toBe(true);
        });

        it('deve despachar comando avaliar ao receber dados', async () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('avaliar x + y\n'));

            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(socket.escritas.some((e) => e.includes('avaliar'))).toBe(true);
        });

        it('deve despachar comando pilha-execucao ao receber dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('pilha-execucao\n'));

            expect(socket.escritas.some((e) => e.includes('pilha-execucao'))).toBe(true);
        });

        it('deve despachar comando tchau, notificar e finalizar o servidor', () => {
            const finalizarSpy = jest.spyOn(servidorDepuracao, 'finalizarServidorDepuracao');
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('tchau\n'));

            expect(socket.escritas.some((e) => e.includes('tchau'))).toBe(true);
            expect(finalizarSpy).toHaveBeenCalled();
        });

        it('deve processar multiplos comandos em uma unica mensagem de dados', () => {
            servidorDepuracao.operarConexao(socket as any);
            socket.emit('data', Buffer.from('pontos-parada\nvariaveis\n'));

            expect(socket.escritas.some((e) => e.includes('pontos-parada'))).toBe(true);
            expect(socket.escritas.some((e) => e.includes('variaveis'))).toBe(true);
        });
    });

    describe('escreverSaidaParaTodosClientes', () => {
        it('deve enviar mensagem formatada para todos os sockets conectados', () => {
            const socket1 = new MockSocket();
            const socket2 = new MockSocket();
            servidorDepuracao.conexoes[0] = socket1;
            servidorDepuracao.conexoes[1] = socket2;

            servidorDepuracao.escreverSaidaParaTodosClientes('Olá depurador');

            for (const socket of [socket1, socket2]) {
                const saida = socket.escritas.join('');
                expect(saida).toContain('Olá depurador');
                expect(saida).toContain('mensagem-saida');
            }
        });

        it('deve funcionar normalmente quando nao ha clientes conectados', () => {
            expect(() => servidorDepuracao.escreverSaidaParaTodosClientes('sem clientes')).not.toThrow();
        });
    });

    describe('finalizarServidorDepuracao', () => {
        it('deve enviar aviso de finalizacao e encerrar cada conexao', () => {
            const socket1 = new MockSocket();
            const socket2 = new MockSocket();
            const endSpy1 = jest.spyOn(socket1, 'end');
            const endSpy2 = jest.spyOn(socket2, 'end');
            servidorDepuracao.conexoes[0] = socket1;
            servidorDepuracao.conexoes[1] = socket2;

            servidorDepuracao.finalizarServidorDepuracao();

            expect(socket1.escritas.join('')).toContain('finalizando');
            expect(socket2.escritas.join('')).toContain('finalizando');
            expect(endSpy1).toHaveBeenCalled();
            expect(endSpy2).toHaveBeenCalled();
        });

        it('deve fechar o servidor apos encerrar as conexoes', () => {
            servidorDepuracao.finalizarServidorDepuracao();

            expect(instanciaServidorMock.listening).toBe(false);
        });

        it('deve funcionar normalmente sem conexoes ativas', () => {
            expect(() => servidorDepuracao.finalizarServidorDepuracao()).not.toThrow();
            expect(instanciaServidorMock.listening).toBe(false);
        });
    });

    describe('Fluxo de integracao', () => {
        it('deve executar fluxo completo: conectar, depurar, desconectar', async () => {
            const saidaSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            const socket = new MockSocket();

            servidorDepuracao.iniciarServidorDepuracao();
            instanciaServidorMock.emit('connection', socket);

            // Adicionar ponto de parada
            socket.emit('data', Buffer.from(`adicionar-ponto-parada ${caminhoArquivo} 3\n`));
            expect(mockInterpretador.pontosParada).toHaveLength(1);

            // Listar pontos de parada
            socket.emit('data', Buffer.from('pontos-parada\n'));
            expect(socket.escritas.some((e) => e.includes('pontos-parada'))).toBe(true);

            // Passo a passo
            socket.emit('data', Buffer.from('proximo\n'));
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Listar variaveis
            socket.emit('data', Buffer.from('variaveis\n'));
            expect(socket.escritas.some((e) => e.includes('variaveis'))).toBe(true);

            // Avaliar expressao
            socket.emit('data', Buffer.from('avaliar x + y\n'));
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Remover ponto de parada
            socket.emit('data', Buffer.from(`remover-ponto-parada ${caminhoArquivo} 3\n`));
            expect(mockInterpretador.pontosParada).toHaveLength(0);

            // Encerrar sessao
            socket.emit('data', Buffer.from('tchau\n'));

            saidaSpy.mockRestore();
        });
    });
});
