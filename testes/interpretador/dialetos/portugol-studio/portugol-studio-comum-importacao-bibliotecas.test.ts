import { visitarDeclaracaoImportarComum, visitarExpressaoImportarComum } from '../../../../fontes/interpretador/dialetos/portugol-studio-comum';

describe('Importação de bibliotecas do Portugol Studio (delegua-node)', () => {
    beforeAll(() => {
        (global as any).AudioContext = class {
            close = jest.fn();
            createGain = jest.fn(() => ({
                gain: { setValueAtTime: jest.fn() },
                connect: jest.fn(),
                disconnect: jest.fn(),
            }));
            createBufferSource = jest.fn(() => ({
                connect: jest.fn(),
                disconnect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                onended: null,
                loop: false,
            }));
            decodeAudioData = jest.fn();
            destination = {};
            currentTime = 0;
        };
    });

    it('deve importar Mouse com constantes e funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'Mouse' },
        } as any);

        expect(modulo.nome).toBe('Mouse');
        expect(modulo.componentes).toHaveProperty('botao_pressionado');
        expect(modulo.componentes).toHaveProperty('algum_botao_pressionado');
        expect(modulo.componentes).toHaveProperty('ler_botao');
        expect(modulo.componentes).toHaveProperty('BOTAO_ESQUERDO');
        expect(modulo.componentes).toHaveProperty('BOTAO_DIREITO');
        expect(modulo.componentes).toHaveProperty('BOTAO_MEIO');
    });

    it('deve importar Sons com funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'Sons' },
        } as any);

        expect(modulo.nome).toBe('Sons');
        expect(modulo.componentes).toHaveProperty('carregar_som');
        expect(modulo.componentes).toHaveProperty('reproduzir_som');
        expect(modulo.componentes).toHaveProperty('definir_volume');
        expect(modulo.componentes).toHaveProperty('obter_volume');
    });

    it('deve importar Arquivos com funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'Arquivos' },
        } as any);

        expect(modulo.nome).toBe('Arquivos');
        expect(modulo.componentes).toHaveProperty('abrir_arquivo');
        expect(modulo.componentes).toHaveProperty('fechar_arquivo');
        expect(modulo.componentes).toHaveProperty('ler_linha');
        expect(modulo.componentes).toHaveProperty('escrever_linha');
        expect(modulo.componentes).toHaveProperty('arquivo_existe');
    });

    it('deve importar Graficos com funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'Graficos' },
        } as any);

        expect(modulo.nome).toBe('Graficos');
        expect(modulo.componentes).toHaveProperty('iniciar_modo_grafico');
        expect(modulo.componentes).toHaveProperty('definir_dimensoes_janela');
        expect(modulo.componentes).toHaveProperty('limpar');
        expect(modulo.componentes).toHaveProperty('renderizar');
        expect(modulo.componentes).toHaveProperty('desenhar_retangulo');
    });

    it('deve importar Internet com funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'Internet' },
        } as any);

        expect(modulo.nome).toBe('Internet');
        expect(modulo.componentes).toHaveProperty('definir_tempo_limite');
        expect(modulo.componentes).toHaveProperty('obter_texto');
        expect(modulo.componentes).toHaveProperty('baixar_imagem');
        expect(modulo.componentes).toHaveProperty('endereco_disponivel');
    });

    it('deve importar Teclado com funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'Teclado' },
        } as any);

        expect(modulo.nome).toBe('Teclado');
        expect(modulo.componentes).toHaveProperty('tecla_pressionada');
        expect(modulo.componentes).toHaveProperty('ler_tecla');
    });

    it('deve importar ServicosWeb com funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'ServicosWeb' },
        } as any);

        expect(modulo.nome).toBe('ServicosWeb');
        expect(modulo.componentes).toHaveProperty('abrirConexao');
        expect(modulo.componentes).toHaveProperty('fazerRequisicao');
        expect(modulo.componentes).toHaveProperty('obterDados');
    });

    it('deve importar Util com funções principais', async () => {
        const modulo = await visitarExpressaoImportarComum({
            caminho: { valor: 'Util' },
        } as any);

        expect(modulo.nome).toBe('Util');
        expect(modulo.componentes).toHaveProperty('numero_elementos');
        expect(modulo.componentes).toHaveProperty('sorteia');
        expect(modulo.componentes).toHaveProperty('aguarde');
    });

    it('deve importar via visitarDeclaracaoImportarComum', async () => {
        const modulo = await visitarDeclaracaoImportarComum({
            caminho: { valor: 'Mouse' },
        } as any);

        expect(modulo.nome).toBe('Mouse');
        expect(modulo.componentes).toHaveProperty('botao_pressionado');
    });

    it('deve lançar erro para biblioteca desconhecida (caminho default do switch)', async () => {
        await expect(
            visitarExpressaoImportarComum({ caminho: { valor: 'BibliotecaDesconhecida' } } as any)
        ).rejects.toThrow();
    });
});
