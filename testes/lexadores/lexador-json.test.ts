import { LexadorJson } from "../../fontes/lexador/lexador-json";

describe('Lexador JSON', () => {
    it('Trivial', () => {
        const lexadorJson = new LexadorJson();
        const resultado: {type: string, value: string}[] = lexadorJson.getTokens('{"1": 2, "tres": "quatro"}');
        expect(resultado).toHaveLength(12);
        expect(resultado[0].type).toBe("OPEN_BRACE");
        expect(resultado[1].type).toBe("STRING_KEY");
        expect(resultado[2].type).toBe("COLON");
        expect(resultado[3].type).toBe("WHITESPACE");
        expect(resultado[4].type).toBe("NUMBER_LITERAL");
        expect(resultado[5].type).toBe("COMMA");
        expect(resultado[6].type).toBe("WHITESPACE");
        expect(resultado[7].type).toBe("STRING_KEY");
        expect(resultado[8].type).toBe("COLON");
        expect(resultado[9].type).toBe("WHITESPACE");
        expect(resultado[10].type).toBe("STRING_LITERAL");
        expect(resultado[11].type).toBe("CLOSE_BRACE");
    });
});
