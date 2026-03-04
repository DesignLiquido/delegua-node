import * as mouse from '../../../../fontes/bibliotecas/dialetos/portugol-studio/mouse';

describe('Biblioteca Mouse', () => {
    beforeEach(() => {
        mouse.perdeuFoco({} as FocusEvent);
        mouse.mouseMoveu({ offsetX: 0, offsetY: 0 } as MouseEvent);
        mouse.instaladores.length = 0;
    });

    describe('Posição e Movimentação', () => {
        it('deve atualizar posição X e Y ao mover o mouse', () => {
            mouse.mouseMoveu({ offsetX: 150, offsetY: 250 } as MouseEvent);

            expect(mouse.posicaoX()).toBe(150);
            expect(mouse.posicaoY()).toBe(250);
        });

        it('deve atualizar posição X e Y ao arrastar o mouse', () => {
            mouse.mouseArrastou({ offsetX: 40, offsetY: 60 } as MouseEvent);

            expect(mouse.posicaoX()).toBe(40);
            expect(mouse.posicaoY()).toBe(60);
        });
    });

    describe('Cliques e Botões', () => {
        it('deve registrar e identificar botões pressionados', () => {
            expect(mouse.algumBotaoPressionado()).toBe(false);

            mouse.mousePressionou({ button: 0 } as MouseEvent);

            expect(mouse.botaoPressionado(mouse.BOTAO_ESQUERDO)).toBe(true);
            expect(mouse.algumBotaoPressionado()).toBe(true);

            mouse.mouseSoltou({ button: 0 } as MouseEvent);

            expect(mouse.botaoPressionado(mouse.BOTAO_ESQUERDO)).toBe(false);
            expect(mouse.algumBotaoPressionado()).toBe(false);
        });

        it('deve lançar erro ao tentar verificar um botão inválido', () => {
            expect(() => mouse.botaoPressionado(99)).toThrow("O código '99' não é um código de botão válido");
        });
    });

    describe('Pausas e Promises (lerBotao)', () => {
        it('deve aguardar o usuário clicar em um botão e retornar o botão correto', async () => {
            const promiseLerBotao = mouse.lerBotao();

            mouse.mousePressionou({ button: 2 } as MouseEvent);
            mouse.mouseSoltou({ button: 2 } as MouseEvent);

            const botaoLido = await promiseLerBotao;

            expect(botaoLido).toBe(mouse.BOTAO_DIREITO);
        });

        it('deve interromper e retornar último botão lido se perder o foco', async () => {
            const promiseLerBotao = mouse.lerBotao();

            mouse.perdeuFoco({} as FocusEvent);

            const botaoLido = await promiseLerBotao;

            expect(botaoLido).toBe(-1);
        });
    });

    describe('Gestão de Cursores', () => {
        it('deve chamar a função de alterar cursor nos instaladores registrados', () => {
            const mockInstalador = {
                definirCursor: jest.fn()
            };

            mouse.instaladores.push(mockInstalador);

            mouse.ocultarCursor();
            expect(mockInstalador.definirCursor).toHaveBeenCalledWith("none");

            mouse.exibirCursor();
            expect(mockInstalador.definirCursor).toHaveBeenCalledWith("default");
        });
    });
});