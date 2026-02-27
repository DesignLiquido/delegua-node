export interface InstaladorMouse {
    definirCursor: (cursor: string) => void;
}

export const BOTAO_ESQUERDO = 0;
export const BOTAO_DIREITO = 1;
export const BOTAO_MEIO = 2;

let x = 0, y = 0;
const buffer = [false, false, false];
let botoesPressionados = 0;
let aguardandoBotao = false;
let ultimoBotao = -1;

let cursorPadrao = "default";
let cursorTransparente = "none";
export const instaladores: InstaladorMouse[] = [];

let resolverAguardarBotao: ((botao: number) => void) | null = null;

function mapearBotao(button: number): number {
    if (button === 0) return BOTAO_ESQUERDO;
    if (button === 1) return BOTAO_MEIO;
    if (button === 2) return BOTAO_DIREITO;
    return -1;
}

export function mouseEntrou(e: MouseEvent) {
    botoesPressionados = 0;

    buffer[BOTAO_ESQUERDO] = (e.buttons & 1) !== 0;
    if (buffer[BOTAO_ESQUERDO]) botoesPressionados += 1;

    buffer[BOTAO_DIREITO] = (e.buttons & 2) !== 0;
    if (buffer[BOTAO_DIREITO]) botoesPressionados += 1;

    buffer[BOTAO_MEIO] = (e.buttons & 4) !== 0;
    if (buffer[BOTAO_MEIO]) botoesPressionados += 1;
}

export function mousePressionou(e: MouseEvent) {
    const botao = mapearBotao(e.button);
    if (botao !== -1 && !buffer[botao]) {
        buffer[botao] = true;
        botoesPressionados += 1;
    }
}

export function mouseSoltou(e: MouseEvent) {
    const botao = mapearBotao(e.button);
    if (botao !== -1 && buffer[botao]) {
        buffer[botao] = false;
        botoesPressionados -= 1;
        ultimoBotao = botao;
    }

    if (aguardandoBotao) acordarThread();
}

export function mouseMoveu(e: MouseEvent) {
    x = e.offsetX;
    y = e.offsetY;
}

export function mouseArrastou(e: MouseEvent) {
    x = e.offsetX;
    y = e.offsetY;
}

export function perdeuFoco(e: FocusEvent) {
    buffer[0] = false;
    buffer[1] = false;
    buffer[2] = false;

    ultimoBotao = -1;
    botoesPressionados = 0;

    if (aguardandoBotao) {
        aguardandoBotao = false;
        acordarThread();
    }
}

export function botaoPressionado(botao: number) {
    if (botao >= 0 && botao < buffer.length) {
        return buffer[botao];
    } else {
        throw new Error(`O código '${botao}' não é um código de botão válido`);
    }
}

export function algumBotaoPressionado() {
    return botoesPressionados > 0;
}

export async function lerBotao() {
    aguardandoBotao = true;

    await new Promise<void>(resolve => {
        resolverAguardarBotao = resolve as any;
    });

    aguardandoBotao = false;
    return ultimoBotao;
}

export function posicaoX() { return x }

export function posicaoY() { return y }

export function ocultarCursor() {
    for (const instalador of instaladores) {
        if (instalador && typeof instalador.definirCursor === "function") {
            instalador.definirCursor(cursorTransparente);
        }
    }
}

export function exibirCursor() {
    for (const instalador of instaladores) {
        if (instalador && typeof instalador.definirCursor === "function") {
            instalador.definirCursor(cursorPadrao);
        }
    }
}

function acordarThread() {
    if (resolverAguardarBotao) {
        resolverAguardarBotao(ultimoBotao);
        resolverAguardarBotao = null;
    }
}