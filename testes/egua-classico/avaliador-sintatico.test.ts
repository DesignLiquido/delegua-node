import { Delegua } from "../../fontes/delegua";
import { RetornoLexador } from "@designliquido/delegua/fontes/interfaces/retornos/retorno-lexador";

describe('Avaliador sintático (Égua Clássico)', () => {
    describe('analisar()', () => {
        let delegua: Delegua;

        beforeEach(() => {
            delegua = new Delegua('egua');
        });

        it('Sucesso - Olá Mundo', () => {
            const retornoLexador = delegua.lexador.mapear(["escreva('Olá mundo');"], -1);
            const retornoAvaliadorSintatico = delegua.avaliadorSintatico.analisar(retornoLexador, -1);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);
        });

        it('Falha - Vetor vazio', () => {
            expect(() => delegua.avaliadorSintatico.analisar({ simbolos: [] } as unknown as RetornoLexador, -1)).toThrow(TypeError);
        });

        it('Falha - Undefined', () => {
            expect(() => delegua.avaliadorSintatico.analisar(undefined as any, -1)).toThrow(TypeError);
        });

        it('Falha - Null', () => {
            expect(() => delegua.avaliadorSintatico.analisar(null as any, -1)).toThrow(TypeError);
        });
    });
});