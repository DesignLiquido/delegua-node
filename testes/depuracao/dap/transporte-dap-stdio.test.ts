import { PassThrough } from 'stream';

import { TransporteDapStdio } from '../../../fontes/depuracao/dap';

const enveloparMensagemDap = (mensagem: Record<string, unknown>): string => {
    const corpo = JSON.stringify(mensagem);
    return `Content-Length: ${Buffer.byteLength(corpo, 'utf8')}\r\n\r\n${corpo}`;
};

describe('Transporte DAP (stdio)', () => {
    it('deve interpretar requisicao com pacote fragmentado', (finalizar) => {
        const entrada = new PassThrough();
        const saida = new PassThrough();
        const transporte = new TransporteDapStdio(entrada, saida);

        transporte.on('requisicao', (requisicao) => {
            expect(requisicao.seq).toBe(1);
            expect(requisicao.command).toBe('initialize');
            finalizar();
        });

        transporte.iniciar();
        const mensagem = enveloparMensagemDap({
            seq: 1,
            type: 'request',
            command: 'initialize',
        });

        entrada.write(mensagem.slice(0, 12));
        entrada.write(mensagem.slice(12));
    });

    it('deve emitir erro para cabecalho sem Content-Length', (finalizar) => {
        const entrada = new PassThrough();
        const saida = new PassThrough();
        const transporte = new TransporteDapStdio(entrada, saida);

        transporte.on('erro', (erro) => {
            expect(erro.message).toContain('Content-Length ausente');
            finalizar();
        });

        transporte.iniciar();
        entrada.write('Host: localhost\r\n\r\n{}');
    });
});
