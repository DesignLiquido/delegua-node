import { PassThrough } from 'stream';

import { SessaoDepuracaoDapPadrao, TransporteDapStdio } from '../../../fontes/depuracao/dap';

const enveloparMensagemDap = (mensagem: Record<string, unknown>): string => {
    const corpo = JSON.stringify(mensagem);
    return `Content-Length: ${Buffer.byteLength(corpo, 'utf8')}\r\n\r\n${corpo}`;
};

const extrairMensagensDap = (dados: string): Array<Record<string, unknown>> => {
    const mensagens: Array<Record<string, unknown>> = [];
    let cursor = 0;

    while (cursor < dados.length) {
        const separador = dados.indexOf('\r\n\r\n', cursor);
        if (separador === -1) {
            break;
        }

        const cabecalho = dados.slice(cursor, separador);
        const correspondencia = /Content-Length:\s*(\d+)/i.exec(cabecalho);
        if (!correspondencia) {
            break;
        }

        const tamanhoCorpo = Number(correspondencia[1]);
        const inicioCorpo = separador + 4;
        const fimCorpo = inicioCorpo + tamanhoCorpo;
        const corpo = dados.slice(inicioCorpo, fimCorpo);
        mensagens.push(JSON.parse(corpo));

        cursor = fimCorpo;
    }

    return mensagens;
};

describe('Sessao DAP', () => {
    it('deve responder initialize e emitir initialized', () => {
        const entrada = new PassThrough();
        const saida = new PassThrough();
        const transporte = new TransporteDapStdio(entrada, saida);
        const sessao = new SessaoDepuracaoDapPadrao(transporte);

        let bufferSaida = '';
        saida.on('data', (dado) => {
            bufferSaida += dado.toString('utf8');
        });

        sessao.iniciar();
        entrada.write(
            enveloparMensagemDap({
                seq: 7,
                type: 'request',
                command: 'initialize',
                arguments: {
                    clientID: 'codeblocks',
                },
            })
        );

        const mensagens = extrairMensagensDap(bufferSaida);
        expect(mensagens).toHaveLength(2);

        const resposta = mensagens[0];
        const evento = mensagens[1];

        expect(resposta.type).toBe('response');
        expect(resposta.request_seq).toBe(7);
        expect(resposta.command).toBe('initialize');
        expect(resposta.success).toBe(true);

        expect(evento.type).toBe('event');
        expect(evento.event).toBe('initialized');
    });
});
