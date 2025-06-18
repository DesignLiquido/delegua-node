import { ServidorDepuracao } from "../fontes/depuracao";
import { NucleoExecucaoInterface } from "../fontes/interfaces/nucleo-execucao-interface";

describe('Servidor de depuração', () => {
    it('Deve instanciar o servidor', () => {
        const servidorDepuracao = new ServidorDepuracao({
            interpretador: {

            }
        } as NucleoExecucaoInterface);
        expect(servidorDepuracao).toBeTruthy();
    });
});
