import { visitarExpressaoImportarComum } from '../../../../fontes/interpretador/dialetos/portugol-studio-comum';

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
});
