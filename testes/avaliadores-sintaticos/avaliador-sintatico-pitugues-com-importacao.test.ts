import { LexadorPitugues } from "@designliquido/delegua/lexador/dialetos";

import { AvaliadorSintaticoPituguesComImportacao } from "../../fontes/avaliador-sintatico/dialetos/avaliador-sintatico-pitugues-com-importacao";
import { Importador } from "../../fontes/importador";

describe('Avaliador Sintático Pitugues com Importação', () => {
    let lexador: LexadorPitugues;
    let avaliadorSintatico: AvaliadorSintaticoPituguesComImportacao;
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
    });

    it('Deve criar instância com importador', () => {
        expect(avaliadorSintatico).toBeInstanceOf(AvaliadorSintaticoPituguesComImportacao);
        expect(avaliadorSintatico.arquivosImportados).toEqual([]);
        expect(avaliadorSintatico.importador).toBeDefined();
    });

    it('Deve permitir configurar modo LAIR', () => {
        avaliadorSintatico.modoLair = true;
        expect(avaliadorSintatico.modoLair).toBe(true);

        avaliadorSintatico.modoLair = false;
        expect(avaliadorSintatico.modoLair).toBe(false);
    });

    it('Deve aceitar lista de arquivos importados no método analisar', () => {
        const arquivosPreImportados = ['./arquivo1.delegua', './arquivo2.delegua'];

        const retornoLexador = lexador.mapear([
            'x = 10'
        ], -1);

        const retornoAvaliadorSintatico = avaliadorSintatico.analisar(
            retornoLexador,
            -1,
            arquivosPreImportados
        );

        expect(retornoAvaliadorSintatico).toBeTruthy();
        expect(avaliadorSintatico.arquivosImportados).toEqual(arquivosPreImportados);
    });

    it('Deve inicializar lista vazia quando arquivosImportados não é fornecido', () => {
        const retornoLexador = lexador.mapear([
            'x = 10'
        ], -1);

        const retornoAvaliadorSintatico = avaliadorSintatico.analisar(retornoLexador, -1);

        expect(retornoAvaliadorSintatico).toBeTruthy();
        expect(avaliadorSintatico.arquivosImportados).toEqual([]);
    });

    it('Deve processar código simples sem erros', () => {
        const retornoLexador = lexador.mapear([
            'x = 5',
            'y = 10'
        ], -1);

        const retornoAvaliadorSintatico = avaliadorSintatico.analisar(retornoLexador, -1);

        expect(retornoAvaliadorSintatico).toBeTruthy();
        expect(retornoAvaliadorSintatico.erros).toEqual([]);
    });

    it('Deve manter estado entre múltiplas análises', () => {
        const retornoLexador1 = lexador.mapear(['x = 1'], -1);
        const retornoLexador2 = lexador.mapear(['y = 2'], -1);

        avaliadorSintatico.analisar(retornoLexador1, -1);
        const retorno2 = avaliadorSintatico.analisar(retornoLexador2, -1);

        expect(retorno2).toBeTruthy();
    });

    it('Deve herdar de AvaliadorSintaticoPitugues', () => {
        // Verifica que métodos herdados estão disponíveis
        expect(typeof avaliadorSintatico.analisar).toBe('function');
    });

    it('Deve ter importador configurado', () => {
        expect(avaliadorSintatico.importador).toBeDefined();
        expect(avaliadorSintatico.importador).toHaveProperty('importar');
    });
});
