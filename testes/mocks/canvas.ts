type Rgba = [number, number, number, number];

class CanvasGradientMock {
    public stops: Array<{ offset: number; color: string }> = [];

    addColorStop(offset: number, color: string): void {
        this.stops.push({ offset, color });
    }
}

function corCssParaRgba(cor: string | CanvasGradientMock): Rgba {
    if (cor instanceof CanvasGradientMock) {
        const ultimaCor = cor.stops[cor.stops.length - 1]?.color ?? 'rgb(0, 0, 0)';
        return corCssParaRgba(ultimaCor);
    }

    const rgba = cor.match(/rgba?\(([^)]+)\)/i);
    if (!rgba) return [0, 0, 0, 255];

    const partes = rgba[1].split(',').map((parte) => parte.trim());
    const r = Number(partes[0]) || 0;
    const g = Number(partes[1]) || 0;
    const b = Number(partes[2]) || 0;
    const a = partes[3] !== undefined
        ? Math.round((Number(partes[3]) || 0) * 255)
        : 255;

    return [r, g, b, a];
}

class Contexto2dMock {
    public fillStyle: string | CanvasGradientMock = 'rgb(0, 0, 0)';
    public strokeStyle: string | CanvasGradientMock = 'rgb(0, 0, 0)';
    public globalAlpha = 1;
    public font = '16px sans-serif';
    private canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    clearRect(x: number, y: number, largura: number, altura: number): void {
        this.pintarRetangulo(x, y, largura, altura, [0, 0, 0, 0]);
    }

    fillRect(x: number, y: number, largura: number, altura: number): void {
        this.pintarRetangulo(x, y, largura, altura, this.obterCorAtual(this.fillStyle));
    }

    strokeRect(_x: number, _y: number, _largura: number, _altura: number): void {}
    beginPath(): void {}
    roundRect(_x: number, _y: number, _largura: number, _altura: number, _raio: number): void {}
    fill(): void {}
    stroke(): void {}
    moveTo(_x: number, _y: number): void {}
    lineTo(_x: number, _y: number): void {}
    closePath(): void {}
    ellipse(
        _x: number,
        _y: number,
        _raioX: number,
        _raioY: number,
        _rotacao: number,
        _anguloInicial: number,
        _anguloFinal: number
    ): void {}
    fillText(_texto: string, _x: number, _y: number): void {}
    save(): void {}
    restore(): void {}
    translate(_x: number, _y: number): void {}
    rotate(_angulo: number): void {}
    scale(_x: number, _y: number): void {}

    drawImage(imagem: Canvas | Image, ...args: number[]): void {
        const origem = imagem instanceof Canvas ? imagem : imagem.canvasInterno;
        const cor = origem.obterPixel(0, 0);

        if (args.length === 2) {
            this.pintarRetangulo(args[0], args[1], origem.width, origem.height, cor);
            return;
        }

        if (args.length === 4) {
            this.pintarRetangulo(args[0], args[1], args[2], args[3], cor);
            return;
        }

        if (args.length === 8) {
            this.pintarRetangulo(args[4], args[5], args[6], args[7], cor);
        }
    }

    createLinearGradient(
        _x0: number,
        _y0: number,
        _x1: number,
        _y1: number
    ): CanvasGradientMock {
        return new CanvasGradientMock();
    }

    measureText(texto: string): { width: number; actualBoundingBoxAscent: number; actualBoundingBoxDescent: number } {
        return {
            width: texto.length * 8,
            actualBoundingBoxAscent: 12,
            actualBoundingBoxDescent: 4
        };
    }

    getImageData(x: number, y: number, largura: number, altura: number): { data: Uint8ClampedArray } {
        const dados = new Uint8ClampedArray(largura * altura * 4);
        let indice = 0;

        for (let yi = 0; yi < altura; yi++) {
            for (let xi = 0; xi < largura; xi++) {
                const [r, g, b, a] = this.canvas.obterPixel(x + xi, y + yi);
                dados[indice++] = r;
                dados[indice++] = g;
                dados[indice++] = b;
                dados[indice++] = a;
            }
        }

        return { data: dados };
    }

    putImageData(imageData: { data: Uint8ClampedArray }, x: number, y: number): void {
        const dados = imageData.data;
        const totalPixels = dados.length / 4;
        const largura = Math.max(1, Math.round(Math.sqrt(totalPixels)));
        const altura = Math.max(1, Math.ceil(totalPixels / largura));

        let indice = 0;
        for (let yi = 0; yi < altura; yi++) {
            for (let xi = 0; xi < largura; xi++) {
                this.canvas.definirPixel(x + xi, y + yi, [
                    dados[indice++] ?? 0,
                    dados[indice++] ?? 0,
                    dados[indice++] ?? 0,
                    dados[indice++] ?? 0
                ]);
            }
        }
    }

    private obterCorAtual(cor: string | CanvasGradientMock): Rgba {
        const [r, g, b, a] = corCssParaRgba(cor);
        return [r, g, b, Math.round(a * this.globalAlpha)];
    }

    private pintarRetangulo(x: number, y: number, largura: number, altura: number, cor: Rgba): void {
        const inicioX = Math.max(0, Math.floor(x));
        const inicioY = Math.max(0, Math.floor(y));
        const fimX = Math.min(this.canvas.width, Math.ceil(x + largura));
        const fimY = Math.min(this.canvas.height, Math.ceil(y + altura));

        for (let yi = inicioY; yi < fimY; yi++) {
            for (let xi = inicioX; xi < fimX; xi++) {
                this.canvas.definirPixel(xi, yi, cor);
            }
        }
    }
}

export class Canvas {
    public width: number;
    public height: number;
    private dados: Uint8ClampedArray;
    private contexto2d: Contexto2dMock;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.dados = new Uint8ClampedArray(width * height * 4);
        this.contexto2d = new Contexto2dMock(this);
    }

    getContext(tipo: string): Contexto2dMock {
        if (tipo !== '2d') {
            throw new Error(`Contexto não suportado: ${tipo}`);
        }

        return this.contexto2d;
    }

    toBuffer(_tipo?: string): Buffer {
        return Buffer.from(this.dados);
    }

    definirPixel(x: number, y: number, cor: Rgba): void {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;

        const indice = (y * this.width + x) * 4;
        this.dados[indice] = cor[0];
        this.dados[indice + 1] = cor[1];
        this.dados[indice + 2] = cor[2];
        this.dados[indice + 3] = cor[3];
    }

    obterPixel(x: number, y: number): Rgba {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return [0, 0, 0, 0];
        }

        const indice = (y * this.width + x) * 4;
        return [
            this.dados[indice],
            this.dados[indice + 1],
            this.dados[indice + 2],
            this.dados[indice + 3]
        ];
    }
}

export class Image {
    public width: number;
    public height: number;
    public canvasInterno: Canvas;

    constructor(width = 1, height = 1) {
        this.width = width;
        this.height = height;
        this.canvasInterno = new Canvas(width, height);
    }
}

export function createCanvas(width: number, height: number): Canvas {
    return new Canvas(width, height);
}

export async function loadImage(_caminho: string): Promise<Image> {
    return new Image();
}

export function registerFont(_caminhoFonte: string, _opcoes: { family: string }): void {}
