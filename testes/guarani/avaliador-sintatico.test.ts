import { ErroAvaliadorSintatico } from "@designliquido/delegua/fontes/avaliador-sintatico/erro-avaliador-sintatico";
import { AvaliadorSintaticoGuarani } from "@designliquido/delegua/fontes/avaliador-sintatico/dialetos/avaliador-sintatico-guarani";
import { LexadorGuarani } from "@designliquido/delegua/fontes/lexador/dialetos/lexador-guarani";

describe('Avaliador sintático (Guarani)', () => {
    describe('analisar()', () => {
        let lexador: LexadorGuarani;
        let avaliadorSintatico: AvaliadorSintaticoGuarani;

        beforeEach(() => {
            lexador = new LexadorGuarani();
            avaliadorSintatico = new AvaliadorSintaticoGuarani();
        });

        it('Sucesso - Olá Mundo', () => {
            const retornoLexador = lexador.mapear(
                [
                    'hai("Olá Mundo")'
                ],
                -1
            );
            const retornoAvaliadorSintatico =
                avaliadorSintatico.analisar(retornoLexador);

            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);
        });
    });
});
