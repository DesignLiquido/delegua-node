import { Sons } from "../../../../fontes/bibliotecas/dialetos/portugol-studio/sons";
import { ErroExecucaoBiblioteca } from '../../../../fontes/excecoes';

const makeMockAudioParam = () => ({
    value: 1,
    setValueAtTime: jest.fn(),
});

const makeMockSourceNode = () => ({
    buffer: null as AudioBuffer | null,
    loop: false,
    onended: null as (() => void) | null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
});

const makeMockGainNode = () => ({
    gain: makeMockAudioParam(),
    connect: jest.fn(),
    disconnect: jest.fn(),
});

const makeMockAudioBuffer = (durationSeconds = 10): AudioBuffer =>
    ({ duration: durationSeconds } as unknown as AudioBuffer);

let mockCurrentTime = 0;
let lastSourceNode: ReturnType<typeof makeMockSourceNode>;
let lastGainNode: ReturnType<typeof makeMockGainNode>;
let mockDecodeAudioData: jest.Mock;
let mockClose: jest.Mock;

const MockAudioContext = jest.fn().mockImplementation(() => {
    mockDecodeAudioData = jest.fn().mockResolvedValue(makeMockAudioBuffer());
    mockClose = jest.fn().mockResolvedValue(undefined);

    return {
        get currentTime() {
            return mockCurrentTime;
        },
        destination: {},
        createGain: jest.fn(() => {
            lastGainNode = makeMockGainNode();
            return lastGainNode;
        }),
        createBufferSource: jest.fn(() => {
            lastSourceNode = makeMockSourceNode();
            return lastSourceNode;
        }),
        decodeAudioData: mockDecodeAudioData,
        close: mockClose,
    };
});

const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
});

(global as any).AudioContext = MockAudioContext;
(global as any).fetch = mockFetch;

async function criarSonsComSomCarregado(url = "som/teste.mp3") {
    const sons = new Sons();
    const endereco = await sons.carregarSom(url);
    return { sons, endereco };
}

describe("Sons", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCurrentTime = 0;
        MockAudioContext.mockClear();
        mockFetch.mockResolvedValue({
            ok: true,
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
        });
    });

    describe("construtor e finalizar()", () => {
        it("deve criar um AudioContext ao ser instanciado", () => {
            new Sons();
            expect(MockAudioContext).toHaveBeenCalledTimes(1);
        });

        it("finalizar() deve fechar o AudioContext", () => {
            const sons = new Sons();
            sons.finalizar();
            expect(mockClose).toHaveBeenCalledTimes(1);
        });

        it("finalizar() deve interromper todas as reproduções ativas", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);

            const stopAntes = lastSourceNode.stop;
            sons.finalizar();

            expect(stopAntes).toHaveBeenCalled();
        });
    });

    describe("carregarSom()", () => {
        it("deve retornar um endereço numérico ao carregar com sucesso", async () => {
            const sons = new Sons();
            const endereco = await sons.carregarSom("som/beep.mp3");
            expect(typeof endereco).toBe("number");
        });

        it("deve fazer fetch da URL fornecida", async () => {
            const sons = new Sons();
            await sons.carregarSom("som/beep.mp3");
            expect(mockFetch).toHaveBeenCalledWith("som/beep.mp3");
        });

        it("deve retornar o mesmo endereço ao carregar a mesma URL duas vezes", async () => {
            const sons = new Sons();
            const e1 = await sons.carregarSom("som/beep.mp3");
            const e2 = await sons.carregarSom("som/beep.mp3");
            expect(e1).toBe(e2);
        });

        it("não deve fazer novo fetch ao carregar a mesma URL duas vezes", async () => {
            const sons = new Sons();
            await sons.carregarSom("som/beep.mp3");
            await sons.carregarSom("som/beep.mp3");
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it("deve retornar endereços diferentes para URLs distintas", async () => {
            const sons = new Sons();
            const e1 = await sons.carregarSom("som/a.mp3");
            const e2 = await sons.carregarSom("som/b.mp3");
            expect(e1).not.toBe(e2);
        });
    });

    describe("liberarSom()", () => {
        it("deve interromper a reprodução ao liberar um som", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);
            const stop = lastSourceNode.stop;

            sons.liberarSom(endereco);

            expect(stop).toHaveBeenCalled();
        });

        it("deve remover o som do cache, impedindo reprodução posterior", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.liberarSom(endereco);

            expect(() => sons.reproduzirSom(endereco, false)).toThrow(ErroExecucaoBiblioteca);
        });
    });

    describe("reproduzirSom()", () => {
        it("deve chamar source.start() ao reproduzir um som", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);
            expect(lastSourceNode.start).toHaveBeenCalled();
        });

        it("deve retornar o mesmo endereço passado como argumento", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            const retorno = sons.reproduzirSom(endereco, false);
            expect(retorno).toBe(endereco);
        });

        it("deve configurar loop=false quando repetir é falso", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);
            expect(lastSourceNode.loop).toBe(false);
        });

        it("deve configurar loop=true quando repetir é verdadeiro", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, true);
            expect(lastSourceNode.loop).toBe(true);
        });
    });

    describe("pausarSom()", () => {
        it("deve chamar stop() ao pausar uma reprodução ativa", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);
            const stop = lastSourceNode.stop;

            sons.pausarSom(endereco);

            expect(stop).toHaveBeenCalled();
        });
    });

    describe("interromperSom()", () => {
        it("deve chamar stop() ao interromper uma reprodução", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);
            const stop = lastSourceNode.stop;

            sons.interromperSom(endereco);

            expect(stop).toHaveBeenCalled();
        });

        it("deve resetar a posição para 0 após interrupção", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);
            mockCurrentTime = 5;

            sons.interromperSom(endereco);

            expect(sons.obterPosicaoAtualMusica(endereco)).toBe(0);
        });
    });

    describe("obterTamanhoMusica()", () => {
        it("deve retornar a duração total em milissegundos", async () => {
            mockDecodeAudioData = jest
            .fn()
            .mockResolvedValue(makeMockAudioBuffer(10));

            const sons = new Sons();
            const endereco = await sons.carregarSom("som/longa.mp3");

            expect(sons.obterTamanhoMusica(endereco)).toBe(10_000);
        });

        it("deve retornar 0 para endereço inválido", () => {
            const sons = new Sons();
            expect(sons.obterTamanhoMusica(99999)).toBe(0);
        });
    });

    describe("posição da música", () => {
        it("obterPosicaoAtualMusica() deve retornar 0 antes de iniciar", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            expect(sons.obterPosicaoAtualMusica(endereco)).toBe(0);
        });

        it("obterPosicaoAtualMusica() deve retornar 0 para endereço inválido", () => {
            const sons = new Sons();
            expect(sons.obterPosicaoAtualMusica(99999)).toBe(0);
        });

        it("obterPosicaoAtualMusica() deve refletir o tempo decorrido durante reprodução", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.reproduzirSom(endereco, false);
            mockCurrentTime = 3;

            expect(sons.obterPosicaoAtualMusica(endereco)).toBe(3000);
        });
    });

    describe("definirVolumeReproducao() e obterVolumeReproducao()", () => {
        it("deve armazenar e retornar o volume definido", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.definirVolumeReproducao(endereco, 60);
            expect(sons.obterVolumeReproducao(endereco)).toBe(60);
        });

        it("deve clampear volume acima de 100 para 100", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.definirVolumeReproducao(endereco, 150);
            expect(sons.obterVolumeReproducao(endereco)).toBe(100);
        });

        it("deve clampear volume abaixo de 0 para 0", async () => {
            const { sons, endereco } = await criarSonsComSomCarregado();
            sons.definirVolumeReproducao(endereco, -20);
            expect(sons.obterVolumeReproducao(endereco)).toBe(0);
        });
    });

    describe("definirVolume() e obterVolume()", () => {
        it("volume geral inicial deve ser 100", () => {
            const sons = new Sons();
            expect(sons.obterVolume()).toBe(100);
        });

        it("deve atualizar o volume geral", () => {
            const sons = new Sons();
            sons.definirVolume(50);
            expect(sons.obterVolume()).toBe(50);
        });

        it("deve propagar o volume geral para todas as reproduções ativas", async () => {
            const sons = new Sons();
            const e1 = await sons.carregarSom("som/a.mp3");
            const gainA = lastGainNode;
            const e2 = await sons.carregarSom("som/b.mp3");
            const gainB = lastGainNode;

            jest.clearAllMocks();
            sons.definirVolume(40);

            expect(gainA.gain.setValueAtTime).toHaveBeenCalled();
            expect(gainB.gain.setValueAtTime).toHaveBeenCalled();
        });

        it("deve aceitar volume 0 (mudo)", () => {
            const sons = new Sons();
            sons.definirVolume(0);
            expect(sons.obterVolume()).toBe(0);
        });
    });
});