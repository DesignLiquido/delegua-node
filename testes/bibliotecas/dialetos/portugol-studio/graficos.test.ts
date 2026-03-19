import {
    Graficos,
    COR_PRETO,
    COR_BRANCO,
    COR_AZUL,
    COR_VERMELHO,
    COR_VERDE,
    COR_AMARELO,
    GRADIENTE_DIREITA,
    GRADIENTE_ESQUERDA,
    GRADIENTE_ACIMA,
    GRADIENTE_ABAIXO,
    GRADIENTE_INFERIOR_DIREITO,
    GRADIENTE_INFERIOR_ESQUERDO,
    GRADIENTE_SUPERIOR_DIREITO,
    GRADIENTE_SUPERIOR_ESQUERDO,
    CANAL_R,
    CANAL_G,
    CANAL_B,
} from '../../../../fontes/bibliotecas/dialetos/portugol-studio/graficos';
import { ErroExecucaoBiblioteca } from '../../../../fontes/excecoes';

function criarGraficosInicializado(): Graficos {
    const g = new Graficos();
    g.iniciar_modo_grafico();
    return g;
}

describe("iniciar_modo_grafico", () => {
    test("inicializa o canvas com dimensões padrão 640x480", () => {
        const g = criarGraficosInicializado();

        expect(g.largura_janela()).toBe(640);
        expect(g.altura_janela()).toBe(480);
    });

    test("não faz nada se já estiver inicializado", () => {
        const g = criarGraficosInicializado();
        g.definir_dimensoes_janela(800, 600);
        g.iniciar_modo_grafico()

        expect(g.largura_janela()).toBe(800);
        expect(g.altura_janela()).toBe(600);
    });
});

describe("definir_dimensoes_janela", () => {
    test("altera as dimensões do canvas", () => {
        const g = criarGraficosInicializado();
        g.definir_dimensoes_janela(1280, 720);

        expect(g.largura_janela()).toBe(1280);
        expect(g.altura_janela()).toBe(720);
    });

    test("lança erro se o modo gráfico não foi inicializado", () => {
        const g = new Graficos();

        expect(() => g.definir_dimensoes_janela(800, 600)).toThrow(ErroExecucaoBiblioteca);
    });
});

describe("constantes de cor", () => {
    test("COR_PRETO tem canal alpha 255 e RGB 0,0,0", () => {
        const g = new Graficos();

        expect(g.obter_RGB(COR_PRETO, CANAL_R)).toBe(0);
        expect(g.obter_RGB(COR_PRETO, CANAL_G)).toBe(0);
        expect(g.obter_RGB(COR_PRETO, CANAL_B)).toBe(0);
    });

    test("COR_BRANCO tem RGB 255,255,255", () => {
        const g = new Graficos();

        expect(g.obter_RGB(COR_BRANCO, CANAL_R)).toBe(255);
        expect(g.obter_RGB(COR_BRANCO, CANAL_G)).toBe(255);
        expect(g.obter_RGB(COR_BRANCO, CANAL_B)).toBe(255);
    });

    test("COR_VERMELHO tem R=255, G=0, B=0", () => {
        const g = new Graficos();

        expect(g.obter_RGB(COR_VERMELHO, CANAL_R)).toBe(255);
        expect(g.obter_RGB(COR_VERMELHO, CANAL_G)).toBe(0);
        expect(g.obter_RGB(COR_VERMELHO, CANAL_B)).toBe(0);
    });

    test("COR_VERDE tem R=0, G=255, B=0", () => {
        const g = new Graficos();

        expect(g.obter_RGB(COR_VERDE, CANAL_R)).toBe(0);
        expect(g.obter_RGB(COR_VERDE, CANAL_G)).toBe(255);
        expect(g.obter_RGB(COR_VERDE, CANAL_B)).toBe(0);
    });

    test("COR_AZUL tem R=0, G=0, B=255", () => {
        const g = new Graficos();

        expect(g.obter_RGB(COR_AZUL, CANAL_R)).toBe(0);
        expect(g.obter_RGB(COR_AZUL, CANAL_G)).toBe(0);
        expect(g.obter_RGB(COR_AZUL, CANAL_B)).toBe(255);
    });

    test("COR_AMARELO tem R=255, G=255, B=0", () => {
        const g = new Graficos();

        expect(g.obter_RGB(COR_AMARELO, CANAL_R)).toBe(255);
        expect(g.obter_RGB(COR_AMARELO, CANAL_G)).toBe(255);
        expect(g.obter_RGB(COR_AMARELO, CANAL_B)).toBe(0);
    });
});

describe("criar_cor", () => {
    test("cria uma cor corretamente a partir de componentes RGB", () => {
        const g = new Graficos();
        const cor = g.criar_cor(100, 150, 200);

        expect(g.obter_RGB(cor, CANAL_R)).toBe(100);
        expect(g.obter_RGB(cor, CANAL_G)).toBe(150);
        expect(g.obter_RGB(cor, CANAL_B)).toBe(200);
    });

    test("aceita os valores extremos 0 e 255", () => {
        const g = new Graficos();

        expect(() => g.criar_cor(0, 0, 0)).not.toThrow();
        expect(() => g.criar_cor(255, 255, 255)).not.toThrow();
    });

    test("lança erro se algum componente for menor que 0", () => {
        const g = new Graficos();

        expect(() => g.criar_cor(-1, 0, 0)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.criar_cor(0, -1, 0)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.criar_cor(0, 0, -1)).toThrow(ErroExecucaoBiblioteca);
    });

    test("lança erro se algum componente for maior que 255", () => {
        const g = new Graficos();

        expect(() => g.criar_cor(256, 0, 0)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.criar_cor(0, 256, 0)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.criar_cor(0, 0, 256)).toThrow(ErroExecucaoBiblioteca);
    });
});

describe("obter_RGB", () => {
    test("retorna 0 para canal inválido", () => {
        const g = new Graficos();

        expect(g.obter_RGB(COR_VERMELHO, 99)).toBe(0);
    });
});

describe("definir_cor / limpar / renderizar", () => {
    test("não lança erro ao definir cor e renderizar", () => {
        const g = criarGraficosInicializado();

        expect(() => {
            g.definir_cor(COR_AZUL);
            g.limpar();
            g.renderizar();
        }).not.toThrow();
    });

    test("lança erro ao chamar limpar sem inicializar", () => {
        const g = new Graficos();

        expect(() => g.limpar()).toThrow(ErroExecucaoBiblioteca);
    });

    test("lança erro ao chamar renderizar sem inicializar", () => {
        const g = new Graficos();

        expect(() => g.renderizar()).toThrow(ErroExecucaoBiblioteca);
    });
});

describe("primitivas de desenho", () => {
    test("desenhar_retangulo não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.desenhar_retangulo(10, 10, 100, 50, false, true)).not.toThrow();
        expect(() => g.desenhar_retangulo(10, 10, 100, 50, true, false)).not.toThrow();
    });

    test("desenhar_elipse não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.desenhar_elipse(50, 50, 100, 60, true)).not.toThrow();
        expect(() => g.desenhar_elipse(50, 50, 100, 60, false)).not.toThrow();
    });

    test("desenhar_linha não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.desenhar_linha(0, 0, 100, 100)).not.toThrow();
    });

    test("desenhar_ponto não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.desenhar_ponto(50, 50)).not.toThrow();
    });

    test("desenhar_poligono não lança erro", () => {
        const g = criarGraficosInicializado();
        const pontos = [[10, 10], [50, 10], [30, 50]];

        expect(() => g.desenhar_poligono(pontos, true)).not.toThrow();
    });

    test("desenhar_poligono com menos de 2 pontos não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.desenhar_poligono([[10, 10]], false)).not.toThrow();
    });

    test("lança erro ao desenhar sem inicializar", () => {
        const g = new Graficos();

        expect(() => g.desenhar_retangulo(0, 0, 10, 10, false, true)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.desenhar_elipse(0, 0, 10, 10, true)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.desenhar_linha(0, 0, 10, 10)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.desenhar_ponto(0, 0)).toThrow(ErroExecucaoBiblioteca);
    });
});

describe("texto", () => {
    test("desenhar_texto não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.desenhar_texto(10, 50, "Olá, mundo!")).not.toThrow();
    });

    test("definir_fonte_texto não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.definir_fonte_texto("serif")).not.toThrow();
    });

    test("definir_tamanho_texto não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.definir_tamanho_texto(24)).not.toThrow();
    });

    test("definir_estilo_texto não lança erro", () => {
        const g = criarGraficosInicializado();

        expect(() => g.definir_estilo_texto(true, true, false)).not.toThrow();
        expect(() => g.definir_estilo_texto(false, false, false)).not.toThrow();
    });

    test("largura_texto retorna valor positivo", () => {
        const g = criarGraficosInicializado();

        expect(g.largura_texto("Teste")).toBeGreaterThan(0);
    });

    test("largura_texto retorna 0 para string vazia", () => {
        const g = criarGraficosInicializado();

        expect(g.largura_texto("")).toBe(0);
    });

    test("altura_texto retorna valor positivo", () => {
        const g = criarGraficosInicializado();

        expect(g.altura_texto("Teste")).toBeGreaterThan(0);
    });
});

describe("definir_opacidade", () => {
    test("aceita valores entre 0 e 255", () => {
        const g = criarGraficosInicializado();

        expect(() => g.definir_opacidade(0)).not.toThrow();
        expect(() => g.definir_opacidade(128)).not.toThrow();
        expect(() => g.definir_opacidade(255)).not.toThrow();
    });

    test("lança erro para valores fora do intervalo", () => {
        const g = criarGraficosInicializado();

        expect(() => g.definir_opacidade(-1)).toThrow(ErroExecucaoBiblioteca);
        expect(() => g.definir_opacidade(256)).toThrow(ErroExecucaoBiblioteca);
    });
});

describe("definir_rotacao", () => {
    test("não lança erro para qualquer valor de grau", () => {
        const g = criarGraficosInicializado();

        expect(() => g.definir_rotacao(0)).not.toThrow();
        expect(() => g.definir_rotacao(90)).not.toThrow();
        expect(() => g.definir_rotacao(-45)).not.toThrow();
        expect(() => g.definir_rotacao(360)).not.toThrow();
    });
});

describe("definir_gradiente", () => {
    test("não lança erro para todos os tipos de gradiente", () => {
        const g = criarGraficosInicializado();
        const tipos = [
            GRADIENTE_DIREITA,
            GRADIENTE_ESQUERDA,
            GRADIENTE_ACIMA,
            GRADIENTE_ABAIXO,
            GRADIENTE_INFERIOR_DIREITO,
            GRADIENTE_INFERIOR_ESQUERDO,
            GRADIENTE_SUPERIOR_DIREITO,
            GRADIENTE_SUPERIOR_ESQUERDO,
        ];

        for (const tipo of tipos) {
            expect(() =>
                g.definir_gradiente(tipo, COR_VERMELHO, COR_AZUL)
            ).not.toThrow();
        }
    });

    test("não lança erro para tipo inválido (usa default)", () => {
        const g = criarGraficosInicializado();

        expect(() => g.definir_gradiente(99, COR_PRETO, COR_BRANCO)).not.toThrow();
    });
});

describe("renderizar_imagem", () => {
    test("retorna um endereço válido (maior que 0)", () => {
        const g = criarGraficosInicializado();
        g.desenhar_retangulo(0, 0, 100, 100, false, true);

        const endereco = g.renderizar_imagem(100, 100);

        expect(endereco).toBeGreaterThan(0);
    });

    test("a imagem gerada tem as dimensões corretas", () => {
        const g = criarGraficosInicializado();
        const endereco = g.renderizar_imagem(200, 150);

        expect(g.largura_imagem(endereco)).toBe(200);
        expect(g.altura_imagem(endereco)).toBe(150);
    });
});

describe("obter_cor_pixel", () => {
    test("pixel de canvas limpo com cor vermelha retorna vermelho", () => {
        const g = criarGraficosInicializado();

        g.definir_cor(COR_VERMELHO);
        g.limpar();
        const endereco = g.renderizar_imagem(10, 10);
        const cor = g.obter_cor_pixel(endereco, 5, 5);

        expect(g.obter_RGB(cor, CANAL_R)).toBe(255);
        expect(g.obter_RGB(cor, CANAL_G)).toBe(0);
        expect(g.obter_RGB(cor, CANAL_B)).toBe(0);
    });
});