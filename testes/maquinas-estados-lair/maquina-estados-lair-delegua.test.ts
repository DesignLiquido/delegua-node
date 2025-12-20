import { RetornoExecucaoInterface, Const, Var, ResultadoParcialInterpretadorInterface } from "@designliquido/delegua";
import { MaquinaEstadosLairDelegua } from "../../fontes/maquinas-estados-lair";

// Interface estendida para incluir declaracoes (adicionado dinamicamente pelo núcleo)
interface RetornoExecucaoComDeclaracoes extends RetornoExecucaoInterface {
    declaracoes?: any[];
}

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

describe('Máquina de Estados LAIR Delégua', () => {
    let maquina: MaquinaEstadosLairDelegua;
    let executarLinhasMock: jest.Mock;
    let funcaoDeRetornoMock: jest.Mock;
    let promptSpy: jest.SpyInstance;
    let setPromptSpy: jest.SpyInstance;

    beforeEach(() => {
        executarLinhasMock = jest.fn();
        funcaoDeRetornoMock = jest.fn();
        maquina = new MaquinaEstadosLairDelegua(executarLinhasMock, funcaoDeRetornoMock);

        // Mock dos métodos readline
        promptSpy = jest.spyOn(maquina.interfaceLeitura, 'prompt').mockImplementation();
        setPromptSpy = jest.spyOn(maquina.interfaceLeitura, 'setPrompt').mockImplementation();
    });

    afterEach(() => {
        promptSpy.mockRestore();
        setPromptSpy.mockRestore();
    });

    describe('Construtor', () => {
        it('Deve inicializar com dialeto "delegua"', () => {
            expect(maquina).toBeDefined();
            expect(maquina.escoposAbertos).toBe(0);
            expect(maquina.linhas).toEqual([]);
            expect(maquina.acumular).toBe(false);
        });

        it('Deve configurar funções de execução e retorno', () => {
            expect(maquina.executarLinhas).toBe(executarLinhasMock);
            expect(maquina.funcaoDeRetorno).toBe(funcaoDeRetornoMock);
        });
    });

    describe('executarOuAcumular', () => {
        it('Deve acumular linhas quando há chave aberta', async () => {
            await maquina.executarOuAcumular('se (verdadeiro) {');

            expect(maquina.escoposAbertos).toBe(1);
            expect(maquina.linhas).toEqual(['se (verdadeiro) {']);
            expect(setPromptSpy).toHaveBeenCalledWith('... ');
            expect(promptSpy).toHaveBeenCalled();
            expect(executarLinhasMock).not.toHaveBeenCalled();
        });

        it('Deve executar quando chaves estão balanceadas', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial(42, 'número')],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('const x = 42');

            expect(maquina.escoposAbertos).toBe(0);
            expect(executarLinhasMock).toHaveBeenCalledWith(['const x = 42']);
            expect(setPromptSpy).toHaveBeenCalledWith('\ndelegua> ');
            expect(maquina.linhas).toEqual([]);
        });

        it('Deve contar múltiplas chaves abertas e fechadas', async () => {
            await maquina.executarOuAcumular('funcao teste() {');
            expect(maquina.escoposAbertos).toBe(1);

            await maquina.executarOuAcumular('  se (verdadeiro) {');
            expect(maquina.escoposAbertos).toBe(2);

            await maquina.executarOuAcumular('    escreva("olá")');
            expect(maquina.escoposAbertos).toBe(2);
        });

        it('Deve decrementar escopos ao encontrar chave fechada', async () => {
            await maquina.executarOuAcumular('funcao teste() {');
            expect(maquina.escoposAbertos).toBe(1);

            await maquina.executarOuAcumular('  escreva("olá")');
            expect(maquina.escoposAbertos).toBe(1);

            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('}');
            expect(maquina.escoposAbertos).toBe(0);
            expect(executarLinhasMock).toHaveBeenCalled();
        });
    });

    describe('Formatação de tipos simples', () => {
        it('Deve formatar número corretamente', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial(42, 'número')],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('42');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });

        it('Deve formatar texto corretamente', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial('olá', 'texto')],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('"olá"');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });

        it('Deve formatar lógico corretamente', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial(true, 'lógico')],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('verdadeiro');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });

        it('Deve formatar nulo corretamente', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial(null, 'nulo')],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('nulo');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });
    });

    describe('Declaração de variáveis', () => {
        it('Deve detectar e formatar declaração var', async () => {
            const simboloMock = { lexema: 'x' };
            const inicializadorMock = { valor: 42, tipo: 'número' };
            const declaracaoVar = Object.create(Var.prototype);
            declaracaoVar.simbolo = simboloMock;
            declaracaoVar.inicializador = inicializadorMock;

            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial(42, 'número')],
                erros: [],
                declaracoes: [declaracaoVar]
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('var x = 42');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });

        it('Deve detectar e formatar declaração const', async () => {
            const simboloMock = { lexema: 'nome' };
            const inicializadorMock = { valor: 'João', tipo: 'texto' };
            const declaracaoConst = Object.create(Const.prototype);
            declaracaoConst.simbolo = simboloMock;
            declaracaoConst.inicializador = inicializadorMock;

            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial('João', 'texto')],
                erros: [],
                declaracoes: [declaracaoConst]
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('const nome = "João"');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });
    });

    describe('Objetos e dicionários', () => {
        it('Deve formatar dicionário corretamente', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial({ nome: 'João', idade: 30 }, 'dicionário')],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('{ "nome": "João", "idade": 30 }');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });

        it('Deve formatar declaração de variável com dicionário', async () => {
            const simboloMock = { lexema: 'pessoa' };
            const inicializadorMock = { valor: { nome: 'João' }, tipo: 'dicionário' };
            const declaracaoConst = Object.create(Const.prototype);
            declaracaoConst.simbolo = simboloMock;
            declaracaoConst.inicializador = inicializadorMock;

            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [criarResultadoParcial({ nome: 'João' }, 'dicionário')],
                erros: [],
                declaracoes: [declaracaoConst]
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('const pessoa = { "nome": "João" }');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
        });
    });

    describe('Resultados vazios', () => {
        it('Não deve chamar função de retorno quando resultado é vazio', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('var x = 42');

            expect(funcaoDeRetornoMock).not.toHaveBeenCalled();
        });

        it('Deve limpar linhas após execução mesmo sem resultado', async () => {
            const retornoExecucao: RetornoExecucaoComDeclaracoes = {
                resultado: [],
                erros: [],
                declaracoes: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('var x = 42');

            expect(maquina.linhas).toEqual([]);
        });
    });
});
