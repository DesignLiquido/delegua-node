import { Delegua } from '../fontes/delegua';
import { TradutorJavaScript, TradutorPython, TradutorReversoJavaScript, TradutorVisualg } from '@designliquido/delegua/fontes/tradutores';

describe('Delégua', () => {
    let delegua: Delegua;

    beforeEach(() => {
        delegua = new Delegua('delegua');
    });

    describe('Sucesso', () => {
        it('Obter versão Delégua', () => {
            const versaoDelegua = delegua.versao();

            expect(versaoDelegua).toBeTruthy();
        });

        it('Traduzir delégua para javascript', () => {
            expect(new Delegua('', false, false, 'delegua-para-javascript').tradutorJavaScript).toBeInstanceOf(TradutorJavaScript);
            expect(new Delegua('', false, false, 'delegua-para-js').tradutorJavaScript).toBeInstanceOf(TradutorJavaScript);
        });

        it('Traduzir delégua para python', () => {
            expect(new Delegua('', false, false, 'delegua-para-python').tradutorPython).toBeInstanceOf(TradutorPython);
            expect(new Delegua('', false, false, 'delegua-para-py').tradutorPython).toBeInstanceOf(TradutorPython);
        });

        it('Traduzir javascript para delégua', () => {
            expect(new Delegua('', false, false, 'javascript-para-delegua').tradutorReversoJavascript).toBeInstanceOf(TradutorReversoJavaScript);
            expect(new Delegua('', false, false, 'js-para-delegua').tradutorReversoJavascript).toBeInstanceOf(TradutorReversoJavaScript);
        });

        it('Traduzir visualg para delégua', () => {
            expect(new Delegua('', false, false, 'visualg-para-delegua').tradutorVisualg).toBeInstanceOf(TradutorVisualg);
        });
    });

    describe('Falha', () => {
        it('Tradutor', () => {
            expect(() => new Delegua('', false, false, 'go')).toThrow(
                new Error('Tradutor \'go\' não implementado.')
            );
        });
    });
});
