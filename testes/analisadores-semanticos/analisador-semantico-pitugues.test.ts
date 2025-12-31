import { LexadorPitugues } from "@designliquido/delegua/lexador/dialetos";
import { AnalisadorSemanticoPitugues } from "@designliquido/delegua/analisador-semantico/dialetos";

import { AvaliadorSintaticoPituguesComImportacao } from "../../fontes/avaliador-sintatico/dialetos/avaliador-sintatico-pitugues-com-importacao";
import { Importador } from "../../fontes/importador";

describe('Analisador Semântico + Avaliador Sintático com Importação de Pituguês', () => {
    let lexador: LexadorPitugues;
    let avaliadorSintatico: AvaliadorSintaticoPituguesComImportacao;
    let analisadorSemantico: AnalisadorSemanticoPitugues;
    let arquivosAbertos: { [identificador: string]: string };
    let conteudoArquivosAbertos: { [identificador: string]: string[] };

    beforeEach(() => {
        lexador = new LexadorPitugues();
        arquivosAbertos = {};
        conteudoArquivosAbertos = {};
        const importador = new Importador(
            lexador,
            arquivosAbertos,
            conteudoArquivosAbertos,
            false
        );
        avaliadorSintatico = new AvaliadorSintaticoPituguesComImportacao(importador);
        analisadorSemantico = new AnalisadorSemanticoPitugues();
    });

    // TODO: Reativar após próxima versão do núcleo de Delégua.
    it.skip('Sucesso - variável de importação usada em método matemático', async () => {
        const retornoLexador = lexador.mapear([
            `mate = importar("matematica")`,
            `x1 = inteiro(leia("Digite a coordenada x do ponto 1: "))`,
            `y1 = inteiro(leia("Digite a coordenada y do ponto 1: "))`,
            `x2 = inteiro(leia("Digite a coordenada x do ponto 2: "))`,
            `y2 = inteiro(leia("Digite a coordenada y do ponto 2: "))`,
            ``,
            `distancia = mate.raizQuadrada((x2 - x1) ^ 2 + (y2 - y1) ^ 2)`,
            `escreva("A distância entre os pontos é: " + distancia)`,
        ], -1);
        const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
        const retornoAnalisadorSemantico = await analisadorSemantico.analisar(retornoAvaliadorSintatico.declaracoes);

        expect(retornoAnalisadorSemantico).toBeTruthy();
        // Não deve haver avisos de variáveis não usadas:
        // - 'mate' é usada em mate.raizQuadrada()
        // - x1, y1, x2, y2 são usadas na expressão matemática
        // - distancia é usada no escreva()
        expect(retornoAnalisadorSemantico.diagnosticos).toHaveLength(0);
    });
});