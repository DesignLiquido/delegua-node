import { RetornoExecucaoInterface, ResultadoParcialInterpretadorInterface } from "@designliquido/delegua";
import { MaquinaEstadosLairPitugues } from "../../fontes/maquinas-estados-lair";

// Helper para criar resultados mockados
function criarResultadoParcial(valor: any, tipo: string): ResultadoParcialInterpretadorInterface {
    return {
        hashArquivo: -1,
        linha: 1,
        tipoDeclaracaoExecutada: 'expressao',
        valorRetornado: { valor, tipo },
        tipo: tipo
    };
}

describe('Máquina de Estados LAIR Pitugues', () => {
    let maquina: MaquinaEstadosLairPitugues;
    let executarLinhasMock: jest.Mock;
    let funcaoDeRetornoMock: jest.Mock;
    let promptSpy: jest.SpyInstance;
    let setPromptSpy: jest.SpyInstance;

    beforeEach(() => {
        executarLinhasMock = jest.fn();
        funcaoDeRetornoMock = jest.fn();
        maquina = new MaquinaEstadosLairPitugues(executarLinhasMock, funcaoDeRetornoMock);

        // Mock dos métodos readline
        promptSpy = jest.spyOn(maquina.interfaceLeitura, 'prompt').mockImplementation();
        setPromptSpy = jest.spyOn(maquina.interfaceLeitura, 'setPrompt').mockImplementation();
    });

    afterEach(() => {
        promptSpy.mockRestore();
        setPromptSpy.mockRestore();
    });

    describe('Construtor', () => {
        it('Deve inicializar com dialeto "pitugues"', () => {
            expect(maquina).toBeDefined();
            expect(maquina.linhas).toEqual([]);
            expect(maquina.acumular).toBe(false);
        });

        it('Deve configurar funções de execução e retorno', () => {
            expect(maquina.executarLinhas).toBe(executarLinhasMock);
            expect(maquina.funcaoDeRetorno).toBe(funcaoDeRetornoMock);
        });
    });

    describe('executarOuAcumular', () => {
        it('Deve executar linha simples sem acumulação', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [criarResultadoParcial(42, 'número')],
                erros: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('x = 42');

            expect(maquina.linhas).toEqual([]);
            expect(executarLinhasMock).toHaveBeenCalledWith(['x = 42']);
            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve acumular linhas quando linha termina com ":"', async () => {
            await maquina.executarOuAcumular('si verdadeiro:');

            expect(maquina.acumular).toBe(true);
            expect(maquina.linhas).toEqual(['si verdadeiro:']);
            expect(setPromptSpy).toHaveBeenCalledWith('... ');
            expect(executarLinhasMock).not.toHaveBeenCalled();
        });

        it('Deve continuar acumulando até linha vazia', async () => {
            await maquina.executarOuAcumular('si verdadeiro:');
            expect(maquina.acumular).toBe(true);

            await maquina.executarOuAcumular('  escriba("olá")');
            expect(maquina.acumular).toBe(true);
            expect(maquina.linhas).toEqual(['si verdadeiro:', '  escriba("olá")']);
        });

        it('Deve executar quando encontra linha vazia após acumulação', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [criarResultadoParcial('olá', 'texto')],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('si verdadeiro:');
            await maquina.executarOuAcumular('  escriba("olá")');
            await maquina.executarOuAcumular('');

            expect(maquina.acumular).toBe(false);
            expect(executarLinhasMock).toHaveBeenCalledWith(['si verdadeiro:', '  escriba("olá")', '']);
            expect(setPromptSpy).toHaveBeenCalledWith('\npitugues> ');
            expect(maquina.linhas).toEqual([]);
        });

        it('Deve formatar resultado usando JSON colorido', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [criarResultadoParcial(123, 'número')],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('123');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });

        it('Não deve formatar quando resultado está vazio', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('x = 42');

            expect(funcaoDeRetornoMock).not.toHaveBeenCalled();
        });

        it('Deve chamar prompt após cada execução', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('x = 42');

            expect(promptSpy).toHaveBeenCalled();
        });
    });

    describe('Cenários de múltiplas linhas', () => {
        it('Deve processar função com múltiplas linhas', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('funcion somar(a, b):');
            expect(maquina.acumular).toBe(true);

            await maquina.executarOuAcumular('  retornar a + b');
            expect(maquina.acumular).toBe(true);

            await maquina.executarOuAcumular('');
            expect(maquina.acumular).toBe(false);
            expect(executarLinhasMock).toHaveBeenCalled();
        });

        it('Deve processar laço com múltiplas linhas', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('para i en rango(5):');
            expect(maquina.acumular).toBe(true);

            await maquina.executarOuAcumular('  escriba(i)');
            expect(maquina.acumular).toBe(true);

            await maquina.executarOuAcumular('');
            expect(maquina.acumular).toBe(false);
            expect(executarLinhasMock).toHaveBeenCalledWith(['para i en rango(5):', '  escriba(i)', '']);
        });

        it('Deve processar estrutura condicional aninhada', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('si x > 0:');
            await maquina.executarOuAcumular('  si x > 10:');
            await maquina.executarOuAcumular('    escriba("grande")');
            await maquina.executarOuAcumular('');

            expect(maquina.acumular).toBe(false);
            expect(executarLinhasMock).toHaveBeenCalled();
            expect(maquina.linhas).toEqual([]);
        });
    });

    describe('Formatação de resultados', () => {
        it('Deve usar lexador e formatador JSON para resultado', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [criarResultadoParcial({ chave: 'valor' }, 'dicionário')],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('{"chave": "valor"}');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });

        it('Deve processar resultado com valor nulo', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [criarResultadoParcial(null, 'nulo')],
                erros: [],
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('nulo');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });
    });
});
