import { createCanvas, loadImage, Canvas, Image, registerFont } from "canvas";
import * as fs from 'fs';
import path from 'path';
import { ErroExecucaoBiblioteca } from "../../../excecoes";

export type Color = number;

export interface Imagem {
    largura: number;
    altura: number;
    dados: Image | Canvas;
}

export interface ImagemGif {
    quadros: Canvas[];
    intervalos: number[];
    quadroAtual: number;
    largura: number;
    altura: number;
}

export const COR_PRETO: Color = 0xff000000;

export const COR_BRANCO: Color = 0xffffffff;

export const COR_AZUL: Color = 0xff0000ff;

export const COR_VERMELHO: Color = 0xffff0000;

export const COR_VERDE: Color = 0xff00ff00;

export const COR_AMARELO: Color = 0xffffff00;

export const GRADIENTE_DIREITA = 0;

export const GRADIENTE_ESQUERDA = 1;

export const GRADIENTE_ACIMA = 2;

export const GRADIENTE_ABAIXO = 3;

export const GRADIENTE_INFERIOR_DIREITO = 4;

export const GRADIENTE_INFERIOR_ESQUERDO = 5;

export const GRADIENTE_SUPERIOR_DIREITO = 6;

export const GRADIENTE_SUPERIOR_ESQUERDO = 7;

export const CANAL_R = 0;

export const CANAL_G = 1;

export const CANAL_B = 2;

export class ErroExcessoOperacoes extends ErroExecucaoBiblioteca {
    constructor() {
        super(
            "A função Graficos.renderizar() não foi chamada nenhuma vez " +
            "ou o número de operações de desenho que foi chamada antes do Graficos.renderizar() foi muito grande"
        );
        this.name = "ErroExcessoOperacoes";
    }
}

class CacheImagens {
    private imagens = new Map<number, Image | Canvas>();
    private gifs = new Map<number, ImagemGifInterna>();
    private proximoEndereco = 1;

    adicionarImagem(imagem: Image | Canvas): number {
        const endereco = this.proximoEndereco++;
        this.imagens.set(endereco, imagem);

        return endereco;
    }

    adicionarGif(gif: ImagemGifInterna): number {
        const endereco = this.proximoEndereco++;
        this.gifs.set(endereco, gif);

        return endereco;
    }

    obterImagem(endereco: number): Image | Canvas {
        const imagem = this.imagens.get(endereco);
        if (!imagem) throw new ErroExecucaoBiblioteca(
            `Imagem com endereço ${endereco} não encontrada`
        );

        return imagem;
    }

    obterGif(endereco: number): ImagemGifInterna {
        const gif = this.gifs.get(endereco);
        if (!gif) throw new ErroExecucaoBiblioteca(
            `GIF com endereço ${endereco} não encontrado`
        );

        return gif;
    }

    liberarImagem(endereco: number): void {
        this.imagens.delete(endereco);
        this.gifs.delete(endereco);
    }

    liberar(): void {
        this.imagens.clear();
        this.gifs.clear();
    }
}

class ImagemGifInterna {
    private quadros: Canvas[] = [];
    private intervalos: number[] = [];
    private indiceAtual = 0;
    largura: number;
    altura: number;

    constructor(
        quadros: Canvas[],
        intervalos: number[],
        largura: number,
        altura: number
    ) {
        this.quadros = quadros;
        this.intervalos = intervalos;
        this.largura = largura;
        this.altura = altura;
    }

    avancarQuadro(): void {
        this.indiceAtual = (this.indiceAtual + 1) % this.quadros.length;
    }

    getQuadroAtual(): Canvas {
        return this.quadros[this.indiceAtual];
    }

    getQuadro(indice: number): Canvas {
        if (indice < 0 || indice >= this.quadros.length) {
            throw new ErroExecucaoBiblioteca(
                `Quadro ${indice} não existe no GIF`
            );
        }

        return this.quadros[indice];
    }

    irParaQuadro(indice: number): void {
        if (indice < 0 || indice >= this.quadros.length) {
            throw new ErroExecucaoBiblioteca(
                `Quadro ${indice} não existe no GIF`
            );
        }

        this.indiceAtual = indice;
    }

    getIntervalo(): number {
        return this.intervalos[this.indiceAtual] ?? 100;
    }

    getNumeroFrames(): number {
        return this.quadros.length;
    }

    getIndiceQuadroAtual(): number {
        return this.indiceAtual;
    }

    clonar(): ImagemGifInterna {
        return new ImagemGifInterna(
            [...this.quadros],
            [...this.intervalos],
            this.largura,
            this.altura
        );
    }

    setDimensoes(
        largura: number,
        altura: number
    ): void {
        this.largura = largura;
        this.altura = altura;
        this.quadros = this.quadros.map((quadro) => {
            const canvas = createCanvas(largura, altura);
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(quadro, 0, 0, largura, altura);
            return canvas;
        });
    }
}

class SuperficieDesenho {
    private canvas: Canvas;
    private ctx: ReturnType<Canvas["getContext"]>;
    private backBuffer: Canvas;
    private backCtx: ReturnType<Canvas["getContext"]>;
    private corAtual: string = "#000000";
    private opacidadeAtual: number = 1;
    private rotacaoAtual: number = 0;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;

        this.backBuffer = createCanvas(canvas.width, canvas.height);
        this.backCtx = this.backBuffer.getContext("2d")!;
    }

    limpar(): void {
        this.backCtx.fillStyle = this.corAtual;
        this.backCtx.fillRect(0, 0, this.backBuffer.width, this.backBuffer.height);
    }

    renderizar(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.backBuffer, 0, 0);
    }

    renderizarImagem(largura: number, altura: number): Canvas {
        const novaImagem = createCanvas(largura, altura);
        const ctx = novaImagem.getContext("2d")!;

        ctx.drawImage(this.backBuffer, 0, 0, largura, altura);

        return novaImagem;
    }

    private aplicarTransformacao(
        ctx: ReturnType<Canvas["getContext"]>,
        x: number,
        y: number,
        largura: number,
        altura: number,
        fn: () => void
    ): void {
        ctx.save();
        ctx.globalAlpha = this.opacidadeAtual;

        if (this.rotacaoAtual !== 0) {
            ctx.translate(x + largura / 2, y + altura / 2);
            ctx.rotate((this.rotacaoAtual * Math.PI) / 180);
            ctx.translate(-(x + largura / 2), -(y + altura / 2));
        }

        fn();
        ctx.restore();
    }

    desenharRetangulo(
        x: number,
        y: number,
        largura: number,
        altura: number,
        arredondarCantos: boolean,
        preencher: boolean
    ): void {
        this.aplicarTransformacao(this.backCtx, x, y, largura, altura, () => {
            this.backCtx.fillStyle = this.corAtual;
            this.backCtx.strokeStyle = this.corAtual;

            if (arredondarCantos) {
                const raio = Math.min(largura, altura) * 0.1;
                this.backCtx.beginPath();
                this.backCtx.roundRect(x, y, largura, altura, raio);
                preencher ? this.backCtx.fill() : this.backCtx.stroke();
            } else {
                preencher
                    ? this.backCtx.fillRect(x, y, largura, altura)
                    : this.backCtx.strokeRect(x, y, largura, altura);
            }
        });
    }

    desenharPoligono(pontos: number[][], preencher: boolean): void {
        if (pontos.length < 2) return;

        this.backCtx.save();
        this.backCtx.globalAlpha = this.opacidadeAtual;
        this.backCtx.fillStyle = this.corAtual;
        this.backCtx.strokeStyle = this.corAtual;
        this.backCtx.beginPath();
        this.backCtx.moveTo(pontos[0][0], pontos[0][1]);

        for (let i = 1; i < pontos.length; i++) {
            this.backCtx.lineTo(pontos[i][0], pontos[i][1]);
        }

        this.backCtx.closePath();
        preencher ? this.backCtx.fill() : this.backCtx.stroke();
        this.backCtx.restore();
    }

    desenharElipse(
        x: number,
        y: number,
        largura: number,
        altura: number,
        preencher: boolean
    ): void {
        this.aplicarTransformacao(this.backCtx, x, y, largura, altura, () => {
            this.backCtx.fillStyle = this.corAtual;
            this.backCtx.strokeStyle = this.corAtual;
            this.backCtx.beginPath();
            this.backCtx.ellipse(
                x + largura / 2,
                y + altura / 2,
                largura / 2,
                altura / 2,
                0,
                0,
                2 * Math.PI
            );
            preencher ? this.backCtx.fill() : this.backCtx.stroke();
        });
    }

    desenharPonto(x: number, y: number): void {
        this.backCtx.save();
        this.backCtx.globalAlpha = this.opacidadeAtual;
        this.backCtx.fillStyle = this.corAtual;
        this.backCtx.fillRect(x, y, 1, 1);
        this.backCtx.restore();
    }

    desenharLinha(x1: number, y1: number, x2: number, y2: number): void {
        this.backCtx.save();
        this.backCtx.globalAlpha = this.opacidadeAtual;
        this.backCtx.strokeStyle = this.corAtual;
        this.backCtx.beginPath();
        this.backCtx.moveTo(x1, y1);
        this.backCtx.lineTo(x2, y2);
        this.backCtx.stroke();
        this.backCtx.restore();
    }

    desenharImagem(x: number, y: number, imagem: Image | Canvas): void {
        this.backCtx.save();
        this.backCtx.globalAlpha = this.opacidadeAtual;

        if (this.rotacaoAtual !== 0) {
            const w = imagem.width;
            const h = imagem.height;

            this.backCtx.translate(x + w / 2, y + h / 2);
            this.backCtx.rotate((this.rotacaoAtual * Math.PI) / 180);
            this.backCtx.drawImage(imagem, -w / 2, -h / 2);
        } else {
            this.backCtx.drawImage(imagem, x, y);
        }

        this.backCtx.restore();
    }

    desenharPorcaoImagem(
        x: number,
        y: number,
        xi: number,
        yi: number,
        largura: number,
        altura: number,
        imagem: Image | Canvas
    ): void {
        this.backCtx.save();
        this.backCtx.globalAlpha = this.opacidadeAtual;
        this.backCtx.drawImage(
            imagem,
            xi,
            yi,
            largura,
            altura,
            x,
            y,
            largura,
            altura
        );
        this.backCtx.restore();
    }

    desenharTexto(texto: string, x: number, y: number): void {
        this.backCtx.save();
        this.backCtx.globalAlpha = this.opacidadeAtual;
        this.backCtx.fillStyle = this.corAtual;
        this.backCtx.fillText(texto, x, y);
        this.backCtx.restore();
    }

    definirCor(cor: number): void {
        this.corAtual = corParaCss(cor);
    }

    definirGradiente(tipo: number, cor1: number, cor2: number): void {
        const w = this.backBuffer.width;
        const h = this.backBuffer.height;
        let gradiente: CanvasGradient;

        switch (tipo) {
            case GRADIENTE_DIREITA:
                gradiente = this.backCtx.createLinearGradient(0, 0, w, 0);
                break;
            case GRADIENTE_ESQUERDA:
                gradiente = this.backCtx.createLinearGradient(w, 0, 0, 0);
                break;
            case GRADIENTE_ACIMA:
                gradiente = this.backCtx.createLinearGradient(0, h, 0, 0);
                break;
            case GRADIENTE_ABAIXO:
                gradiente = this.backCtx.createLinearGradient(0, 0, 0, h);
                break;
            case GRADIENTE_INFERIOR_DIREITO:
                gradiente = this.backCtx.createLinearGradient(0, 0, w, h);
                break;
            case GRADIENTE_INFERIOR_ESQUERDO:
                gradiente = this.backCtx.createLinearGradient(w, 0, 0, h);
                break;
            case GRADIENTE_SUPERIOR_DIREITO:
                gradiente = this.backCtx.createLinearGradient(0, h, w, 0);
                break;
            case GRADIENTE_SUPERIOR_ESQUERDO:
                gradiente = this.backCtx.createLinearGradient(w, h, 0, 0);
                break;
            default:
                gradiente = this.backCtx.createLinearGradient(0, 0, w, 0);
        }

        gradiente.addColorStop(0, corParaCss(cor1));
        gradiente.addColorStop(1, corParaCss(cor2));
        this.corAtual = gradiente as unknown as string;
    }

    definirFonteTexto(nome: string): void {
        const fonteAtual = this.backCtx.font;
        const partes = fonteAtual.match(/(\d+)px\s(.+)/);
        const tamanho = partes ? partes[1] : "16";
        this.backCtx.font = `${tamanho}px ${nome}`;
    }

    definirTamanhoTexto(tamanho: number): void {
        const fonteAtual = this.backCtx.font;
        const partes = fonteAtual.match(/\d+px\s(.+)/);
        const nome = partes ? partes[1] : "sans-serif";
        this.backCtx.font = `${tamanho}px ${nome}`;
    }

    definirEstiloTexto(
        italico: boolean,
        negrito: boolean,
        _sublinhado: boolean
    ): void {
        const fonteAtual = this.backCtx.font;
        const partes = fonteAtual.match(/(\d+)px\s(.+)/);

        const tamanho = partes ? partes[1] : "16";
        const nome = partes ? partes[2] : "sans-serif";
        const prefixo = [italico ? "italic" : "", negrito ? "bold" : ""]
            .filter(Boolean)
            .join(" ");

        this.backCtx.font = `${prefixo} ${tamanho}px ${nome}`.trim();
    }

    larguraTexto(texto: string): number {
        return this.backCtx.measureText(texto).width;
    }

    alturaTexto(_texto: string): number {
        const metrics = this.backCtx.measureText("M");
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }

    definirOpacidade(opacidade: number): void {
        if (opacidade < 0 || opacidade > 255) {
            throw new ErroExecucaoBiblioteca(
                "O valor da opacidade deve estar entre 0 e 255"
            );
        }
        this.opacidadeAtual = opacidade / 255;
    }

    definirRotacao(rotacao: number): void {
        this.rotacaoAtual = rotacao;
    }
}

export class Graficos {
    private canvas: Canvas | null = null;
    private superficieDesenho: SuperficieDesenho | null = null;
    private cacheImagens: CacheImagens = new CacheImagens();
    private inicializado: boolean = false;

    iniciar_modo_grafico(): void {
        if (this.inicializado) return;

        this.canvas = createCanvas(640, 480);
        this.superficieDesenho = new SuperficieDesenho(this.canvas);
        this.inicializado = true;
    }

    definir_dimensoes_janela(largura: number, altura: number): void {
        const janela = this.obterJanela();
        janela.width = largura;
        janela.height = altura;
    }

    limpar(): void {
        this.obterSuperficie().limpar();
    }

    renderizar(): void {
        this.obterSuperficie().renderizar();
    }

    renderizar_imagem(largura: number, altura: number): number {
        const canvas = this.obterSuperficie().renderizarImagem(largura, altura);

        return this.cacheImagens.adicionarImagem(canvas);
    }

    desenhar_retangulo(
        x: number,
        y: number,
        largura: number,
        altura: number,
        arredondarCantos: boolean,
        preencher: boolean
    ): void {
        this
            .obterSuperficie()
            .desenharRetangulo(
                x,
                y,
                largura,
                altura,
                arredondarCantos,
                preencher
            );
    }

    desenhar_poligono(pontos: number[][], preencher: boolean): void {
        this.obterSuperficie().desenharPoligono(pontos, preencher);
    }

    desenhar_elipse(
        x: number,
        y: number,
        largura: number,
        altura: number,
        preencher: boolean
    ): void {
        this.obterSuperficie().desenharElipse(x, y, largura, altura, preencher);
    }

    desenhar_ponto(x: number, y: number): void {
        this.obterSuperficie().desenharPonto(x, y);
    }

    desenhar_linha(x1: number, y1: number, x2: number, y2: number): void {
        this.obterSuperficie().desenharLinha(x1, y1, x2, y2);
    }

    async carregar_imagem(caminho: string): Promise<number> {
        try {
            const img = await loadImage(caminho);
            return this.cacheImagens.adicionarImagem(img);
        } catch {
            throw new ErroExecucaoBiblioteca(
                `A imagem '${caminho}' não foi encontrada`
            );
        }
    }

    proximo_frame_gif(endereco: number): void {
        this.cacheImagens.obterGif(endereco).avancarQuadro();
    }

    transformar_imagem(
        endereco: number,
        espelhamentoHorizontal: boolean,
        espelhamentoVertical: boolean,
        rotacao: number,
        corIgnorada: number
    ): number {
        const original = this.cacheImagens.obterImagem(endereco);
        let canvas = imagemParaCanvas(original);

        canvas = aplicarChromaKey(canvas, corIgnorada);
        canvas = espelharImagem(
            canvas,
            espelhamentoHorizontal,
            espelhamentoVertical
        );
        canvas = rotacionarImagem(canvas, rotacao);

        return this.cacheImagens.adicionarImagem(canvas);
    }

    redimensionar_imagem(
        endereco: number,
        largura: number,
        altura: number
    ): number {
        if (largura <= 0 && altura <= 0) {
            throw new ErroExecucaoBiblioteca(
                "Impossível transformar imagem para estas dimensões"
            );
        }

        const original = this.cacheImagens.obterImagem(endereco);
        const w = original.width;
        const h = original.height;

        if (altura === 0 && largura !== 0) {
            altura = Math.round(h * (largura / w));
        } else if (largura === 0 && altura !== 0) {
            largura = Math.round(w * (altura / h));
        }

        const canvas = createCanvas(largura, altura);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(original, 0, 0, largura, altura);

        return this.cacheImagens.adicionarImagem(canvas);
    }

    obter_cor_pixel(endereco: number, x: number, y: number): number {
        const imagem = this.cacheImagens.obterImagem(endereco);
        const canvas = imagemParaCanvas(imagem);
        const ctx = canvas.getContext("2d")!;
        const pixel = ctx.getImageData(x, y, 1, 1).data;

        return (
            (pixel[3] << 24) | (pixel[0] << 16) | (pixel[1] << 8) | pixel[2]
        ) >>> 0;
    }

    obter_RGB(cor: number, canal: number): number {
        switch (canal) {
            case CANAL_R:
                return (cor & 0xff0000) >> 16;
            case CANAL_G:
                return (cor & 0x00ff00) >> 8;
            case CANAL_B:
                return cor & 0x0000ff;
            default:
                return 0;
        }
    }

    transformar_porcao_imagem(
        endereco: number,
        x: number,
        y: number,
        largura: number,
        altura: number,
        espelhamentoHorizontal: boolean,
        espelhamentoVertical: boolean,
        rotacao: number,
        corIgnorada: number
    ): number {
        const original = this.cacheImagens.obterImagem(endereco);

        const porcao = createCanvas(largura, altura);
        const ctx = porcao.getContext("2d")!;
        ctx.drawImage(original, x, y, largura, altura, 0, 0, largura, altura);

        let canvas = aplicarChromaKey(porcao, corIgnorada);
        canvas = espelharImagem(
            canvas,
            espelhamentoHorizontal,
            espelhamentoVertical
        );
        canvas = rotacionarImagem(canvas, rotacao);

        return this.cacheImagens.adicionarImagem(canvas);
    }

    desenhar_imagem(x: number, y: number, endereco: number): void {
        const imagem = this.cacheImagens.obterImagem(endereco);
        this.obterSuperficie().desenharImagem(x, y, imagem);
    }

    salvar_imagem(endereco: number, caminho: string): void {
        const imagem = this.cacheImagens.obterImagem(endereco);
        const canvas = imagemParaCanvas(imagem);
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(caminho, buffer);
    }

    desenhar_quadro_atual_gif(x: number, y: number, endereco: number): void {
        const quadro = this.cacheImagens.obterGif(endereco).getQuadroAtual();
        this.obterSuperficie().desenharImagem(x, y, quadro);
    }

    desenhar_porcao_imagem(
        x: number,
        y: number,
        xi: number,
        yi: number,
        largura: number,
        altura: number,
        endereco: number
    ): void {
        const imagem = this.cacheImagens.obterImagem(endereco);
        this.obterSuperficie().desenharPorcaoImagem(
            x,
            y,
            xi,
            yi,
            largura,
            altura,
            imagem
        );
    }

    obter_intervalo_gif(endereco: number): number {
        return this.cacheImagens.obterGif(endereco).getIntervalo();
    }

    obter_numero_quadros_gif(endereco: number): number {
        return this.cacheImagens.obterGif(endereco).getNumeroFrames();
    }

    obter_numero_quadro_atual_gif(endereco: number): number {
        return this.cacheImagens.obterGif(endereco).getIndiceQuadroAtual();
    }

    obter_quadro_gif(endereco: number, quadro: number): number {
        const canvas = this.cacheImagens.obterGif(endereco).getQuadro(quadro);
        return this.cacheImagens.adicionarImagem(canvas);
    }

    definir_quadro_gif(endereco: number, quadro: number): void {
        this.cacheImagens.obterGif(endereco).irParaQuadro(quadro);
    }

    liberar_imagem(endereco: number): void {
        this.cacheImagens.liberarImagem(endereco);
    }

    desenhar_texto(x: number, y: number, texto: string): void {
        this.obterSuperficie().desenharTexto(texto, x, y);
    }

    definir_cor(cor: number): void {
        this.obterSuperficie().definirCor(cor);
    }

    definir_gradiente(tipo: number, cor1: number, cor2: number): void {
        this.obterSuperficie().definirGradiente(tipo, cor1, cor2);
    }

    definir_fonte_texto(nome: string): void {
        this.obterSuperficie().definirFonteTexto(nome);
    }

    definir_tamanho_texto(tamanho: number): void {
        this.obterSuperficie().definirTamanhoTexto(tamanho);
    }

    definir_estilo_texto(
        italico: boolean,
        negrito: boolean,
        sublinhado: boolean
    ): void {
        this.obterSuperficie().definirEstiloTexto(italico, negrito, sublinhado);
    }

    largura_texto(texto: string): number {
        return this.obterSuperficie().larguraTexto(texto);
    }

    altura_texto(texto: string): number {
        return this.obterSuperficie().alturaTexto(texto);
    }

    largura_imagem(endereco: number): number {
        const img = this.cacheImagens.obterImagem(endereco);
        return img.width;
    }

    altura_imagem(endereco: number): number {
        const img = this.cacheImagens.obterImagem(endereco);
        return img.height;
    }

    criar_cor(vermelho: number, verde: number, azul: number): number {
        if (
            vermelho < 0 || vermelho > 255 ||
            verde < 0 || verde > 255 ||
            azul < 0 || azul > 255
        ) {
            throw new ErroExecucaoBiblioteca(
                "Erro ao criar a cor, os valores dos tons devem estar entre 0 e 255"
            );
        }

        return ((0xff << 24) | (vermelho << 16) | (verde << 8) | azul) >>> 0;
    }

    carregar_fonte(caminhoFonte: string): void {
        if (!fs.existsSync(caminhoFonte)) {
            throw new ErroExecucaoBiblioteca(
                `A fonte '${caminhoFonte}' não foi encontrada`
            );
        }

        const nome = path.basename(caminhoFonte, path.extname(caminhoFonte));
        registerFont(caminhoFonte, { family: nome });
    }

    definir_opacidade(opacidade: number): void {
        this.obterSuperficie().definirOpacidade(opacidade);
    }

    definir_rotacao(rotacao: number): void {
        this.obterSuperficie().definirRotacao(rotacao);
    }

    largura_janela(): number {
        return this.obterJanela().width;
    }

    altura_janela(): number {
        return this.obterJanela().height;
    }

    private obterJanela(): Canvas {
        if (!this.inicializado || !this.canvas) {
            throw new ErroExecucaoBiblioteca(
                "O modo gráfico não foi inicializado"
            );
        }

        return this.canvas;
    }

    private obterSuperficie(): SuperficieDesenho {
        if (!this.inicializado || !this.superficieDesenho) {
            throw new ErroExecucaoBiblioteca(
                "O modo gráfico não foi inicializado"
            );
        }

        return this.superficieDesenho;
    }
}

function corParaCss(cor: number): string {
    const a = (cor >>> 24) & 0xff;
    const r = (cor >>> 16) & 0xff;
    const g = (cor >>> 8) & 0xff;
    const b = cor & 0xff;

    return a < 255
        ? `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
        : `rgb(${r}, ${g}, ${b})`;
}

function imagemParaCanvas(imagem: Image | Canvas): Canvas {
    if (imagem instanceof Canvas) return imagem;

    const canvas = createCanvas(imagem.width, imagem.height);
    canvas.getContext("2d").drawImage(imagem, 0, 0);

    return canvas;
}

function aplicarChromaKey(canvas: Canvas, cor: number): Canvas {
    if (cor === 0) return canvas;

    const r = (cor >>> 16) & 0xff;
    const g = (cor >>> 8) & 0xff;
    const b = cor & 0xff;

    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function espelharImagem(
    canvas: Canvas,
    horizontal: boolean,
    vertical: boolean
): Canvas {
    if (!horizontal && !vertical) return canvas;

    const novo = createCanvas(canvas.width, canvas.height);
    const ctx = novo.getContext("2d")!;

    ctx.translate(horizontal ? canvas.width : 0, vertical ? canvas.height : 0);
    ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
    ctx.drawImage(canvas, 0, 0);

    return novo;
}

function rotacionarImagem(
    canvas: Canvas,
    graus: number
): Canvas {
    if (graus % 360 === 0) return canvas;

    const rad = (graus * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));

    const novaLargura = Math.round(canvas.width * cos + canvas.height * sin);
    const novaAltura = Math.round(canvas.width * sin + canvas.height * cos);

    const novo = createCanvas(novaLargura, novaAltura);
    const ctx = novo.getContext("2d")!;

    ctx.translate(novaLargura / 2, novaAltura / 2);
    ctx.rotate(rad);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

    return novo;
}