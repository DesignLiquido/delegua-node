import * as readline from "readline";
import { MaquinaEstadosAjuda } from "../../fontes/maquinas-estados-lair/maquina-estados-ajuda";

describe('MaquinaEstadosAjuda', () => {
    let maquina: MaquinaEstadosAjuda;
    let interfaceLeitura: readline.Interface;
    let funcaoDeRetornoMock: jest.Mock;
    let obterAjudaTopicoMock: jest.Mock;
    let funcaoSaidaMock: jest.Mock;
    let promptSpy: jest.SpyInstance;
    let setPromptSpy: jest.SpyInstance;
    let removeAllListenersSpy: jest.SpyInstance;

    beforeEach(() => {
        interfaceLeitura = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });

        funcaoDeRetornoMock = jest.fn();
        obterAjudaTopicoMock = jest.fn();
        funcaoSaidaMock = jest.fn();

        maquina = new MaquinaEstadosAjuda(
            interfaceLeitura,
            funcaoDeRetornoMock,
            obterAjudaTopicoMock,
            funcaoSaidaMock
        );

        promptSpy = jest.spyOn(interfaceLeitura, 'prompt').mockImplementation();
        setPromptSpy = jest.spyOn(interfaceLeitura, 'setPrompt').mockImplementation();
        removeAllListenersSpy = jest.spyOn(interfaceLeitura, 'removeAllListeners').mockImplementation();
    });

    afterEach(() => {
        promptSpy.mockRestore();
        setPromptSpy.mockRestore();
        removeAllListenersSpy.mockRestore();
        interfaceLeitura.close();
    });

    describe('Construtor', () => {
        it('Deve inicializar com interfaceLeitura correta', () => {
            expect(maquina.interfaceLeitura).toBe(interfaceLeitura);
        });

        it('Deve inicializar com funcaoDeRetorno correta', () => {
            expect(maquina.funcaoDeRetorno).toBe(funcaoDeRetornoMock);
        });

        it('Deve inicializar com obterAjudaTopico correto', () => {
            expect(maquina.obterAjudaTopico).toBe(obterAjudaTopicoMock);
        });

        it('Deve inicializar com funcaoSaida correta', () => {
            expect(maquina.funcaoSaida).toBe(funcaoSaidaMock);
        });
    });

    describe('exibirMensagemBoasVindas', () => {
        it('Deve chamar funcaoDeRetorno com mensagem de boas-vindas', () => {
            maquina.exibirMensagemBoasVindas();

            expect(funcaoDeRetornoMock).toHaveBeenCalledTimes(1);
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Bem-vindo ao sistema de ajuda de Delégua!');
        });

        it('Deve incluir comandos disponíveis na mensagem', () => {
            maquina.exibirMensagemBoasVindas();

            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('tópicos');
            expect(mensagem).toContain('topicos');
            expect(mensagem).toContain('sair');
        });

        it('Deve incluir exemplo na mensagem', () => {
            maquina.exibirMensagemBoasVindas();

            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('escreva');
        });
    });

    describe('listarTopicos', () => {
        it('Deve chamar funcaoDeRetorno com lista de tópicos', () => {
            maquina.listarTopicos();

            expect(funcaoDeRetornoMock).toHaveBeenCalledTimes(1);
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Tópicos de Ajuda Disponíveis');
        });

        it('Deve exibir categorias de tópicos', () => {
            maquina.listarTopicos();

            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Entrada/Saída');
        });

        it('Deve exibir instrução ao final da listagem', () => {
            maquina.listarTopicos();

            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Digite o nome de qualquer tópico');
        });
    });

    describe('processarEntrada', () => {
        it('Deve exibir boas-vindas e chamar prompt quando entrada for vazia', () => {
            maquina.processarEntrada('');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Bem-vindo ao sistema de ajuda de Delégua!');
            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve exibir boas-vindas quando entrada for apenas espaços', () => {
            maquina.processarEntrada('   ');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Bem-vindo');
        });

        it('Deve chamar sair quando entrada for "sair"', () => {
            maquina.processarEntrada('sair');

            expect(funcaoSaidaMock).toHaveBeenCalled();
        });

        it('Deve chamar sair quando entrada for "SAIR" (maiúsculas)', () => {
            maquina.processarEntrada('SAIR');

            expect(funcaoSaidaMock).toHaveBeenCalled();
        });

        it('Deve listar tópicos quando entrada for "topicos"', () => {
            maquina.processarEntrada('topicos');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Tópicos de Ajuda Disponíveis');
            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve listar tópicos quando entrada for "tópicos" (com acento)', () => {
            maquina.processarEntrada('tópicos');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Tópicos de Ajuda Disponíveis');
        });

        it('Deve listar tópicos quando entrada for "TOPICOS" (maiúsculas)', () => {
            maquina.processarEntrada('TOPICOS');

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Tópicos de Ajuda Disponíveis');
        });

        it('Deve exibir ajuda quando tópico existir', () => {
            obterAjudaTopicoMock.mockReturnValue('Conteúdo de ajuda do tópico');

            maquina.processarEntrada('escreva');

            expect(obterAjudaTopicoMock).toHaveBeenCalledWith('escreva');
            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve exibir mensagem de erro quando tópico não existir', () => {
            obterAjudaTopicoMock.mockReturnValue(null);

            maquina.processarEntrada('topicoInexistente');

            expect(obterAjudaTopicoMock).toHaveBeenCalledWith('topicoInexistente');
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Nenhuma ajuda disponível para "topicoInexistente"');
            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve exibir mensagem de erro quando obterAjudaTopico lançar exceção', () => {
            obterAjudaTopicoMock.mockImplementation(() => {
                throw new Error('Erro simulado');
            });

            maquina.processarEntrada('topicoComErro');

            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Erro ao buscar ajuda');
            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve remover espaços extras da entrada', () => {
            obterAjudaTopicoMock.mockReturnValue('Ajuda');

            maquina.processarEntrada('  escreva  ');

            expect(obterAjudaTopicoMock).toHaveBeenCalledWith('escreva');
        });
    });

    describe('iniciar', () => {
        it('Deve remover todos os listeners anteriores', () => {
            maquina.iniciar();

            expect(removeAllListenersSpy).toHaveBeenCalledWith('line');
        });

        it('Deve configurar o prompt para o modo de ajuda', () => {
            maquina.iniciar();

            expect(setPromptSpy).toHaveBeenCalled();
            const promptArg = setPromptSpy.mock.calls[0][0];
            expect(promptArg).toContain('ajuda>');
        });

        it('Deve exibir mensagem de boas-vindas ao iniciar', () => {
            maquina.iniciar();

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Bem-vindo ao sistema de ajuda de Delégua!');
        });

        it('Deve chamar prompt ao iniciar', () => {
            maquina.iniciar();

            expect(promptSpy).toHaveBeenCalled();
        });

        it('Deve adicionar listener para o evento "line"', () => {
            const onSpy = jest.spyOn(interfaceLeitura, 'on').mockImplementation(() => interfaceLeitura);

            maquina.iniciar();

            expect(onSpy).toHaveBeenCalledWith('line', expect.any(Function));
            onSpy.mockRestore();
        });
    });

    describe('sair', () => {
        it('Deve exibir mensagem de saída', () => {
            maquina.sair();

            expect(funcaoDeRetornoMock).toHaveBeenCalled();
            const mensagem = funcaoDeRetornoMock.mock.calls[0][0];
            expect(mensagem).toContain('Saindo do modo de ajuda');
        });

        it('Deve remover os listeners do modo de ajuda', () => {
            maquina.sair();

            expect(removeAllListenersSpy).toHaveBeenCalledWith('line');
        });

        it('Deve chamar funcaoSaida ao sair', () => {
            maquina.sair();

            expect(funcaoSaidaMock).toHaveBeenCalled();
        });
    });
});
