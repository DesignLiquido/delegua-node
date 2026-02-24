import { Teclado } from '../../../../fontes/bibliotecas/dialetos/portugol-studio/teclado';

describe('Biblioteca Teclado', () => {
    let teclado: Teclado;

    beforeEach(() => {
        teclado = new Teclado();
        jest.useFakeTimers();
    });

    afterEach(() => {
        teclado.finalizar();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('Deve detectar tecla pressionada corretamente', () => {
        process.stdin.emit('data', 'A');
        expect(teclado.tecla_pressionada(65)).toBe(true);
    });

    it('Deve esperar e ler uma tecla via ler_tecla()', async () => {
        const leituraTeclado = teclado.ler_tecla();

        process.stdin.emit('data', 'A');

        const codigoLido = await leituraTeclado;
        expect(codigoLido).toBe(65);
    });

    it('Simulando que o usuário apertou a tecla "ENTER"', async () => {
        const leituraTeclado = teclado.ler_tecla();

        process.stdin.emit('data', '\r');

        expect(teclado.tecla_pressionada(teclado.TECLA_ENTER)).toBe(true);

        const codigoLido = await leituraTeclado;
        expect(codigoLido).toBe(13);
    });

    it('Simulando que o usuário apertou a tecla "F1"', async () => {
        const leituraTeclado = teclado.ler_tecla();

        process.stdin.emit('data', String.fromCharCode(112));

        expect(teclado.tecla_pressionada(teclado.TECLA_F1)).toBe(true);

        const codigoLido = await leituraTeclado;
        expect(codigoLido).toBe(112);
    });
});