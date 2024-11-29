import { FormatadorJson } from "../../fontes/formatadores";
import { LexadorJson } from "../../fontes/lexador/lexador-json";

describe('Formatador JSON', () => {
    it('Trivial', () => {
        const lexadorJson = new LexadorJson();
        const formatadorJson = new FormatadorJson();

        const resultadoLexador: {type: string, value: string}[] = lexadorJson.getTokens('{"1": 2, "tres": "quatro"}');
        const resultado = formatadorJson.formatar(resultadoLexador);

        expect(resultado).toBe('{\n  "1":    2,\n     "tres":    "quatro"\n}');
    });
});