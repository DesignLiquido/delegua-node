import { ErroExecucaoBiblioteca } from "../../../excecoes";

function linearParaExponencial(linear: number): number {
    return Math.pow(linear, 3);
}

function limitaValorDoVolume(volume: number): number {
    if (volume < 0) return 0;
    if (volume > 1) return 1;
    return volume;
}

class Reproducao {
    private audioContext: AudioContext;
    private audioBuffer: AudioBuffer;

    private gainNode: GainNode;

    private _volume: number = 1.0;

    private _volumeGeral: number = 1.0;

    private sourceNode: AudioBufferSourceNode | null = null;

    private _posicaoAtual: number = 0;

    private _inicioContextTime: number = 0;

    private _reproduzindo: boolean = false;

    private _repetindo: boolean = false;

    constructor(audioContext: AudioContext, audioBuffer: AudioBuffer) {
        this.audioContext = audioContext;
        this.audioBuffer = audioBuffer;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);

        this._atualizaGain();
    }

    /**
    * Define o volume individual desta reprodução.
    * @param volume Valor entre 0.0 e 1.0
    */
    setVolume(volume: number): void {
        this._volume = limitaValorDoVolume(volume);
        this._atualizaGain();
    }

    /**
    * Define o volume geral (aplicado sobre o volume individual).
    * @param volumeGeral Valor entre 0.0 e 1.0
    */
    setVolumeGeral(volumeGeral: number): void {
        this._volumeGeral = limitaValorDoVolume(volumeGeral);
        this._atualizaGain();
    }

    getVolume(): number {
        return this._volume;
    }

    private _atualizaGain(): void {
        const valorLinear = this._volume * this._volumeGeral;
        const valorExponencial = linearParaExponencial(valorLinear);
        this.gainNode.gain.setValueAtTime(valorExponencial, this.audioContext.currentTime);
    }

    getTamanhoMusica(): number {
        return this.audioBuffer.duration * 1_000_000;
    }

    getPosicaoAtualMusica(): number {
        if (this._reproduzindo) {
            const decorrido = this.audioContext.currentTime - this._inicioContextTime;
            return (this._posicaoAtual + decorrido * 1_000_000);
        }
        return this._posicaoAtual;
    }

    /**
    * Define a posição de reprodução.
    * @param microsegundos Posição em microsegundos
    */
    setPosicaoMusica(microsegundos: number): void {
        this._posicaoAtual = microsegundos;
    }

    /**
    * Inicia (ou reinicia) a reprodução a partir da posição atual.
    * @param repetir Se verdadeiro, repete indefinidamente.
    */
    inicia(repetir: boolean): void {
        this._pararSourceNode();

        this._repetindo = repetir;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.loop = repetir;
        source.connect(this.gainNode);

        const offsetSegundos = this._posicaoAtual / 1_000_000;

        source.start(0, offsetSegundos);

        this._inicioContextTime = this.audioContext.currentTime - offsetSegundos;
        this._posicaoAtual = 0;
        this._reproduzindo = true;
        this.sourceNode = source;

        source.onended = () => {
            if (this._reproduzindo && !this._repetindo) {
            this._reproduzindo = false;
            this._posicaoAtual = 0;
            this.sourceNode = null;
            }
        };
    }

    /**
    * Pausa a reprodução, preservando a posição atual.
    * @param fechaRecursos Se verdadeiro, libera o buffer.
    */
    pausa(fechaRecursos: boolean): void {
        if (this._reproduzindo) {
            const decorrido =
                this.audioContext.currentTime - this._inicioContextTime;
            this._posicaoAtual += decorrido * 1_000_000;
        }
        this._pararSourceNode();
        if (fechaRecursos) {
            this._liberarRecursos();
        }
    }

    /**
    * Interrompe a reprodução e reseta a posição para o início.
    * @param fechaRecursos Se verdadeiro, libera o buffer.
    */
    interrompe(fechaRecursos: boolean): void {
        this._pararSourceNode();
        this._posicaoAtual = 0;
        if (fechaRecursos) {
            this._liberarRecursos();
        }
    }

    private _pararSourceNode(): void {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch {
                // Ignorado: o nó pode já ter parado naturalmente
            }
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this._reproduzindo = false;
    }

    private _liberarRecursos(): void {
        this.gainNode.disconnect();
    }
}

export class Sons {
    private audioContext: AudioContext;

    private reproducoes: Map<number, Reproducao> = new Map();

    private _volumeGeral: number = 100;

    constructor() {
        this.audioContext = new AudioContext();
    }

    finalizar(): void {
        this._limparCacheReproducoes();
        this.audioContext.close();
    }

    private _limparCacheReproducoes(): void {
        for (const reproducao of this.reproducoes.values()) {
            reproducao.interrompe(true);
        }
        this.reproducoes.clear();
    }

    /**
    * Carrega um som a partir de uma URL e retorna um endereço (handle) numérico.
    *
    * @param caminhoSom URL ou caminho do arquivo de áudio (MP3, WAV, OGG, etc.)
    * @returns Endereço numérico do som carregado.
    */
    async carregarSom(caminhoSom: string): Promise<number> {
        const endereco = this._hashCode(caminhoSom);

        if (!this.reproducoes.has(endereco)) {
            const response = await fetch(caminhoSom);
            if (!response.ok) {
                throw new ErroExecucaoBiblioteca(
                    `Não foi possível carregar o som: ${caminhoSom}`
                );
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(
                arrayBuffer
            );

            this.reproducoes.set(
                endereco, new Reproducao(this.audioContext, audioBuffer)
            );
        }

        return endereco;
    }

    /**
    * Libera a memória de um som previamente carregado, interrompendo todas as
    * suas reproduções.
    *
    * @param endereco Endereço retornado por carregarSom().
    */
    liberarSom(endereco: number): void {
        const reproducao = this.reproducoes.get(endereco);
        if (reproducao) {
            reproducao.interrompe(true);
            this.reproducoes.delete(endereco);
        }
    }

    /**
    * Reproduz um som previamente carregado.
    *
    * @param endereco Endereço retornado por carregarSom().
    * @param repetir Se verdadeiro, o som repete indefinidamente.
    * @returns O mesmo endereço, para uso futuro (parar, pausar, etc.).
    */
    reproduzirSom(endereco: number, repetir: boolean): number {
        const reproducao = this.reproducoes.get(endereco);
        if (!reproducao) {
            throw new ErroExecucaoBiblioteca(`Endereço de som inválido (${endereco})!`);
        }
        reproducao.inicia(repetir);
        return endereco;
    }

    /**
    * Pausa a reprodução de um som, preservando a posição atual para retomada.
    *
    * @param endereco Endereço do som.
    */
    pausarSom(endereco: number): void {
        const reproducao = this.reproducoes.get(endereco);
        if (reproducao) reproducao.pausa(false);
    }

    /**
    * Interrompe a reprodução de um som e reseta para o início.
    *
    * @param endereco Endereço do som.
    */
    interromperSom(endereco: number): void {
        const reproducao = this.reproducoes.get(endereco);
        if (reproducao) reproducao.interrompe(false);
    }

    /**
    * Retorna a duração total do som em milissegundos.
    *
    * @param endereco Endereço do som.
    */
    obterTamanhoMusica(endereco: number): number {
        const reproducao = this.reproducoes.get(endereco);
        if (reproducao) return Math.trunc(reproducao.getTamanhoMusica() / 1000);

        return 0;
    }

    /**
    * Retorna a posição atual de reprodução em milissegundos.
    *
    * @param endereco Endereço do som.
    */
    obterPosicaoAtualMusica(endereco: number): number {
        const reproducao = this.reproducoes.get(endereco);
        if (reproducao) {
            return Math.trunc(reproducao.getPosicaoAtualMusica() / 1000);
        }
        return 0;
    }

    /**
    * Define a posição de reprodução em milissegundos.
    *
    * @param endereco Endereço do som.
    * @param milissegundos Nova posição em milissegundos.
    */
    definirPosicaoAtualMusica(endereco: number, milissegundos: number): void {
        const reproducao = this.reproducoes.get(endereco);
        if (!reproducao) return;

        const posicaoAtualMicros = reproducao.getPosicaoAtualMusica();

        if (posicaoAtualMicros > 0) {
            // Estava pausado: apenas atualiza a posição
            reproducao.setPosicaoMusica(milissegundos * 1000);
        } else {
            // Estava tocando: pausa, reposiciona e retoma
            reproducao.pausa(false);
            reproducao.setPosicaoMusica(milissegundos * 1000);
            reproducao.inicia(false);
        }
    }

    /**
    * Define o volume de uma reprodução específica.
    *
    * @param endereco Endereço do som.
    * @param volume Valor entre 0 e 100.
    */
    definirVolumeReproducao(endereco: number, volume: number): void {
        const reproducao = this.reproducoes.get(endereco);
        if (reproducao) reproducao.setVolume(volume / 100);
        else console.warn("Índice de reprodução não encontrado!");
    }

    /**
    * Define o volume geral que afeta todas as reproduções.
    *
    * @param volume Valor entre 0 e 100.
    */
    definirVolume(volume: number): void {
        this._volumeGeral = volume;
        const volumeFloat = volume / 100;
        for (const reproducao of this.reproducoes.values()) {
            reproducao.setVolumeGeral(volumeFloat);
        }
    }

    /**
    * Retorna o volume geral atual.
    *
    * @returns Valor entre 0 e 100.
    */
    obterVolume(): number {
        return this._volumeGeral;
    }

    /**
    * Retorna o volume de uma reprodução específica.
    *
    * @param endereco Endereço do som.
    * @returns Valor entre 0 e 100, ou -1 se a reprodução não existir.
    */
    obterVolumeReproducao(endereco: number): number {
        const reproducao = this.reproducoes.get(endereco);
        if (reproducao) {
            return Math.trunc(reproducao.getVolume() * 100);
        }
        return -1;
    }

    /**
    * Gera um hash numérico a partir de uma string.
    */
    private _hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
        }
        return hash;
    }
}