export class Teclado {
    TECLA_ENTER = 13;
    TECLA_BACKSPACE = 8;
    TECLA_TAB = 9;
    TECLA_CANCELAR = 3;
    TECLA_LIMPAR = 12;
    TECLA_SHIFT = 16;
    TECLA_CONTROL = 17;
    TECLA_ALT = 18;
    TECLA_PAUSE = 19;
    TECLA_CAPS_LOCK = 20;
    TECLA_ESC = 27;
    TECLA_ESPACO = 32;
    TECLA_PAGE_UP = 33;
    TECLA_PAGE_DOWN = 34;
    TECLA_END = 35;
    TECLA_HOME = 36;
    TECLA_VIRGULA = 188;
    TECLA_MENOS = 189;
    TECLA_PONTO_FINAL = 190;
    TECLA_BARRA = 191;
    TECLA_0 = 48;
    TECLA_1 = 49;
    TECLA_2 = 50;
    TECLA_3 = 51;
    TECLA_4 = 52;
    TECLA_5 = 53;
    TECLA_6 = 54;
    TECLA_7 = 55;
    TECLA_8 = 56;
    TECLA_9 = 57;
    TECLA_PONTO_VIRGULA = 59;
    TECLA_IGUAL = 61;
    TECLA_A = 65;
    TECLA_B = 66;
    TECLA_C = 67;
    TECLA_D = 68;
    TECLA_E = 69;
    TECLA_F = 70;
    TECLA_G = 71;
    TECLA_H = 72;
    TECLA_I = 73;
    TECLA_J = 74;
    TECLA_K = 75;
    TECLA_L = 76;
    TECLA_M = 77;
    TECLA_N = 78;
    TECLA_O = 79;
    TECLA_P = 80;
    TECLA_Q = 81;
    TECLA_R = 82;
    TECLA_S = 83;
    TECLA_T = 84;
    TECLA_U = 85;
    TECLA_V = 86;
    TECLA_W = 87;
    TECLA_X = 88;
    TECLA_Y = 89;
    TECLA_Z = 90;
    TECLA_ABRE_COLCHETES = 219;
    TECLA_BARRA_INVERTIDA = 220;
    TECLA_FECHA_COLCHETES = 221;
    TECLA_0_NUM = 96;
    TECLA_1_NUM = 97;
    TECLA_2_NUM = 98;
    TECLA_3_NUM = 99;
    TECLA_4_NUM = 100;
    TECLA_5_NUM = 101;
    TECLA_6_NUM = 102;
    TECLA_7_NUM = 103;
    TECLA_8_NUM = 104;
    TECLA_9_NUM = 105;
    TECLA_MULTIPLICACAO = 106;
    TECLA_ADICAO = 107;
    TECLA_NUM_SEPARADOR_DECIMAL = 108;
    TECLA_SUBTRACAO	= 109;
    TECLA_DECIMAL = 110;
    TECLA_DIVISAO = 111;
    TECLA_DELETAR = 46;
    TECLA_NUM_LOCK = 144;
    TECLA_SCROLL_LOCK = 145;
    TECLA_F1 = 112;
    TECLA_F2 = 113;
    TECLA_F3 = 114;
    TECLA_F4 = 115;
    TECLA_F5 = 116;
    TECLA_F6 = 117;
    TECLA_F7 = 118;
    TECLA_F8 = 119;
    TECLA_F9 = 120;
    TECLA_F10 = 121;
    TECLA_F11 = 122;
    TECLA_F12 = 123;
    TECLA_F13 = 124;
    TECLA_F14 = 125;
    TECLA_F15 = 126;
    TECLA_F16 = 127;
    TECLA_F17 = 128;
    TECLA_F18 = 129;
    TECLA_F19 = 130;
    TECLA_F20 = 131;
    TECLA_F21 = 132;
    TECLA_F22 = 133;
    TECLA_F23 = 134;
    TECLA_F24 = 135;
    TECLA_PRINTSCREEN = 44;
    TECLA_INSERT = 45;
    TECLA_AJUDA = 6;
    TECLA_META = 224;
    TECLA_BACK_QUOTE = 192;
    TECLA_QUOTE = 222;
    TECLA_DOUBLE_QUOTE = 162;
    TECLA_AMPERSAND = 166;
    TECLA_ASTERISK = 170;
    TECLA_LESS = 60;
    TECLA_GREATER = 62;
    // TECLA_BRACELEFT = ;
    // TECLA_BRACERIGHT = ;
    TECLA_AT = 64;
    TECLA_COLON = 58;
    TECLA_CIRCUMFLEX = 160;
    TECLA_DOLLAR = 164;
    // TECLA_EURO_SIGN = ;
    TECLA_EXCLAMATION = 161;
    // TECLA_INVERTED_EXCLAMATION_MARK = ;
    TECLA_OPEN_PARENTHESIS = 168;
    // TECLA_NUMBER_SIGN = ;
    TECLA_PLUS = 171;
    TECLA_CLOSE_PARENTHESIS = 169;
    TECLA_UNDERSCORE = 167;
    TECLA_WINDOWS = 91;
    TECLA_MENU_CONTEXTO = 93;

    /*
    @DocumentacaoConstante(descricao = "Código numérico da tecla { no teclado")
    public static final int TECLA_BRACELEFT				= KeyEvent.VK_BRACELEFT;

    @DocumentacaoConstante(descricao = "Código numérico da tecla } no teclado")
    public static final int TECLA_BRACERIGHT			= KeyEvent.VK_BRACERIGHT;

    @DocumentacaoConstante(descricao = "Código numérico da tecla € no teclado")
    public static final int TECLA_EURO_SIGN				= KeyEvent.VK_EURO_SIGN;

    @DocumentacaoConstante(descricao = "Código numérico da tecla ¡ no teclado")
    public static final int TECLA_INVERTED_EXCLAMATION_MARK		= KeyEvent.VK_INVERTED_EXCLAMATION_MARK;

    @DocumentacaoConstante(descricao = "Código numérico da tecla # no teclado")
    public static final int TECLA_NUMBER_SIGN			= KeyEvent.VK_NUMBER_SIGN;
    */

    private buffer: { [key: number]: boolean } = {};
    private ultimaTecla: number = -1;
    private resolvidoresEsperando: ((tecla: number) => void)[] = [];

    private mapeamentoSequencias: { [key: string]: number } = {
        '\u001b[A': 38, // TECLA_SETA_ACIMA
        '\u001b[B': 40, // TECLA_SETA_ABAIXO
        '\u001b[C': 39, // TECLA_SETA_DIREITA
        '\u001b[D': 37, // TECLA_SETA_ESQUERDA
    };

    private lidarComDados = (data: string | Buffer) => {
        const entrada = data.toString();
        let codigo: number;

        if (this.mapeamentoSequencias[entrada]) {
            codigo = this.mapeamentoSequencias[entrada];
        } else {
            codigo = entrada.charCodeAt(0);
        }

        this.registrarPressionamento(codigo);

        if (entrada === '\u0003') process.exit();
    }

    constructor() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf-8');
        }

        process.stdin.on('data', this.lidarComDados);
    }

    private registrarPressionamento(codigo: number) {
        this.buffer[codigo] = true;
        this.ultimaTecla = codigo;

        while (this.resolvidoresEsperando.length > 0) {
            const resolver = this.resolvidoresEsperando.shift();
            if (resolver) resolver(codigo);
        }

        setTimeout(() => {
            this.buffer[codigo] = false;
        }, 100);
    }

    tecla_pressionada(tecla: number): boolean {
        return !!this.buffer[tecla];
    }

    async ler_tecla(): Promise<number> {
        return new Promise((resolve) => {
            this.resolvidoresEsperando.push(resolve);
        });
    }

    finalizar(): void {
        process.stdin.removeListener('data', this.lidarComDados);

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            if (process.stdin.unref) process.stdin.unref();
        }
    }
}