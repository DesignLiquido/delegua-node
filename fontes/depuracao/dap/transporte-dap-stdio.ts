import { EventEmitter } from 'events';

import { RequisicaoDap, TransporteDap } from './interfaces';

export class TransporteDapStdio extends EventEmitter implements TransporteDap {
    private readonly entrada: NodeJS.ReadableStream;
    private readonly saida: NodeJS.WritableStream;

    private bufferEntrada: Buffer = Buffer.alloc(0);
    private contadorSequenciaSaida = 1;
    private iniciado = false;

    constructor(
        entrada: NodeJS.ReadableStream = process.stdin,
        saida: NodeJS.WritableStream = process.stdout
    ) {
        super();
        this.entrada = entrada;
        this.saida = saida;
    }

    iniciar(): void {
        if (this.iniciado) {
            return;
        }

        this.iniciado = true;
        this.entrada.on('data', this.aoReceberDados.bind(this));
    }

    encerrar(): void {
        this.entrada.removeAllListeners('data');
        this.removeAllListeners();
        this.iniciado = false;
    }

    enviarEvento(nomeEvento: string, corpo?: Record<string, unknown>): void {
        this.enviarMensagem({
            seq: this.obterProximaSequenciaSaida(),
            type: 'event',
            event: nomeEvento,
            body: corpo,
        });
    }

    enviarResposta(
        requisicao: RequisicaoDap,
        sucesso: boolean,
        corpo?: Record<string, unknown>,
        mensagemErro?: string
    ): void {
        this.enviarMensagem({
            seq: this.obterProximaSequenciaSaida(),
            type: 'response',
            request_seq: requisicao.seq,
            success: sucesso,
            command: requisicao.command,
            body: corpo,
            message: mensagemErro,
        });
    }

    private obterProximaSequenciaSaida(): number {
        return this.contadorSequenciaSaida++;
    }

    private aoReceberDados(dados: Buffer | string): void {
        const dadosBuffer = Buffer.isBuffer(dados)
            ? dados
            : Buffer.from(dados, 'utf8');
        this.bufferEntrada = Buffer.concat([this.bufferEntrada, dadosBuffer]);

        this.processarMensagensCompletas();
    }

    private processarMensagensCompletas(): void {
        while (true) {
            const indiceSeparadorCabecalho = this.bufferEntrada.indexOf('\r\n\r\n');
            if (indiceSeparadorCabecalho === -1) {
                return;
            }

            const cabecalhoBruto = this.bufferEntrada
                .subarray(0, indiceSeparadorCabecalho)
                .toString('ascii');

            const correspondenciaContentLength = /Content-Length:\s*(\d+)/i.exec(cabecalhoBruto);
            if (!correspondenciaContentLength) {
                this.emit('erro', new Error('Cabecalho DAP invalido: Content-Length ausente.'));
                this.bufferEntrada = this.bufferEntrada.subarray(indiceSeparadorCabecalho + 4);
                continue;
            }

            const tamanhoCorpo = Number(correspondenciaContentLength[1]);
            const indiceInicioCorpo = indiceSeparadorCabecalho + 4;
            const tamanhoMensagem = indiceInicioCorpo + tamanhoCorpo;

            if (this.bufferEntrada.length < tamanhoMensagem) {
                return;
            }

            const corpoBruto = this.bufferEntrada
                .subarray(indiceInicioCorpo, tamanhoMensagem)
                .toString('utf8');
            this.bufferEntrada = this.bufferEntrada.subarray(tamanhoMensagem);

            try {
                const mensagem = JSON.parse(corpoBruto);
                if (mensagem.type === 'request' && typeof mensagem.command === 'string') {
                    this.emit('requisicao', mensagem as RequisicaoDap);
                }
            } catch {
                this.emit('erro', new Error('Corpo de mensagem DAP invalido.'));
            }
        }
    }

    private enviarMensagem(mensagem: Record<string, unknown>): void {
        const mensagemSerializada = JSON.stringify(mensagem);
        const tamanhoMensagem = Buffer.byteLength(mensagemSerializada, 'utf8');
        this.saida.write(`Content-Length: ${tamanhoMensagem}\r\n\r\n${mensagemSerializada}`);
    }
}
