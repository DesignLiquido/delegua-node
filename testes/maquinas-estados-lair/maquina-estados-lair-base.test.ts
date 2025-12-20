import { RetornoExecucaoInterface } from "@designliquido/delegua";
import { MaquinaEstadosLairBase } from "../../fontes/maquinas-estados-lair";

// Classe concreta para testar a classe abstrata MaquinaEstadosLairBase
class MaquinaEstadosLairBaseTeste extends MaquinaEstadosLairBase {
    async executarOuAcumular(linha: string): Promise<void> {
        // Implementação simples para teste
        this.linhas.push(linha);

        if (linha.endsWith('{')) {
            this.acumular = true;
            this.interfaceLeitura.setPrompt("... ");
        } else if (this.acumular && linha === '}') {
            this.acumular = false;
            await this.executarLinhas(this.linhas);
            this.linhas = [];
            this.interfaceLeitura.setPrompt("\nteste> ");
        } else if (!this.acumular) {
            await this.executarLinhas(this.linhas);
            this.linhas = [];
        }

        this.interfaceLeitura.prompt();
    }
}

describe('Máquina de Estados LAIR Base', () => {
    let maquina: MaquinaEstadosLairBaseTeste;
    let executarLinhasMock: jest.Mock;
    let funcaoDeRetornoMock: jest.Mock;

    beforeEach(() => {
        executarLinhasMock = jest.fn();
        funcaoDeRetornoMock = jest.fn();
        maquina = new MaquinaEstadosLairBaseTeste(
            'teste',
            executarLinhasMock,
            funcaoDeRetornoMock
        );
    });

    describe('Construtor', () => {
        it('Deve inicializar com dialeto correto', () => {
            expect(maquina).toBeDefined();
            expect(maquina.interfaceLeitura).toBeDefined();
        });

        it('Deve inicializar lexadorJson', () => {
            expect(maquina.lexadorJson).toBeDefined();
        });

        it('Deve inicializar formatadorJson', () => {
            expect(maquina.formatadorJson).toBeDefined();
        });

        it('Deve inicializar linhas como array vazio', () => {
            expect(maquina.linhas).toEqual([]);
        });

        it('Deve inicializar acumular como falso', () => {
            expect(maquina.acumular).toBe(false);
        });

        it('Deve configurar executarLinhas corretamente', () => {
            expect(maquina.executarLinhas).toBe(executarLinhasMock);
        });

        it('Deve configurar funcaoDeRetorno corretamente', () => {
            expect(maquina.funcaoDeRetorno).toBe(funcaoDeRetornoMock);
        });

        it('Deve criar interface de leitura readline', () => {
            expect(maquina.interfaceLeitura).toBeDefined();
            expect(maquina.interfaceLeitura.prompt).toBeDefined();
            expect(maquina.interfaceLeitura.setPrompt).toBeDefined();
        });
    });

    describe('Propriedades', () => {
        it('Deve permitir adicionar linhas', () => {
            maquina.linhas.push('linha 1');
            maquina.linhas.push('linha 2');

            expect(maquina.linhas).toEqual(['linha 1', 'linha 2']);
        });

        it('Deve permitir alterar flag acumular', () => {
            expect(maquina.acumular).toBe(false);

            maquina.acumular = true;
            expect(maquina.acumular).toBe(true);

            maquina.acumular = false;
            expect(maquina.acumular).toBe(false);
        });

        it('Deve permitir limpar linhas', () => {
            maquina.linhas.push('linha 1');
            maquina.linhas.push('linha 2');

            maquina.linhas = [];
            expect(maquina.linhas).toEqual([]);
        });
    });

    describe('Execução com implementação concreta', () => {
        let promptSpy: jest.SpyInstance;
        let setPromptSpy: jest.SpyInstance;

        beforeEach(() => {
            promptSpy = jest.spyOn(maquina.interfaceLeitura, 'prompt').mockImplementation();
            setPromptSpy = jest.spyOn(maquina.interfaceLeitura, 'setPrompt').mockImplementation();
        });

        afterEach(() => {
            promptSpy.mockRestore();
            setPromptSpy.mockRestore();
        });

        it('Deve executar linha simples', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [],
                erros: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('const x = 42');

            expect(executarLinhasMock).toHaveBeenCalledWith(['const x = 42']);
            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve acumular linhas quando necessário', async () => {
            await maquina.executarOuAcumular('funcao teste() {');

            expect(maquina.acumular).toBe(true);
            expect(maquina.linhas).toEqual(['funcao teste() {']);
            expect(setPromptSpy).toHaveBeenCalledWith('... ');
        });

        it('Deve executar linhas acumuladas', async () => {
            const retornoExecucao: RetornoExecucaoInterface = {
                resultado: [],
                erros: []
            };
            executarLinhasMock.mockResolvedValue(retornoExecucao);

            await maquina.executarOuAcumular('funcao teste() {');
            await maquina.executarOuAcumular('}');

            expect(maquina.acumular).toBe(false);
            expect(executarLinhasMock).toHaveBeenCalled();
            expect(maquina.linhas).toEqual([]);
        });
    });

    describe('Interface readline', () => {
        it('Deve ter método prompt', () => {
            expect(typeof maquina.interfaceLeitura.prompt).toBe('function');
        });

        it('Deve ter método setPrompt', () => {
            expect(typeof maquina.interfaceLeitura.setPrompt).toBe('function');
        });

        it('Deve permitir configurar prompt personalizado', () => {
            const setPromptSpy = jest.spyOn(maquina.interfaceLeitura, 'setPrompt').mockImplementation();

            maquina.interfaceLeitura.setPrompt('>>> ');

            expect(setPromptSpy).toHaveBeenCalledWith('>>> ');
            setPromptSpy.mockRestore();
        });
    });

    describe('Integração com formatadores', () => {
        it('Deve ter lexador JSON disponível', () => {
            expect(maquina.lexadorJson).toBeDefined();
            expect(typeof maquina.lexadorJson.getTokens).toBe('function');
        });

        it('Deve ter formatador JSON disponível', () => {
            expect(maquina.formatadorJson).toBeDefined();
            expect(typeof maquina.formatadorJson.formatar).toBe('function');
        });
    });
});
