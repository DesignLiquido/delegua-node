import { ModuloDeclaracoes } from "../../fontes/construtos/modulo-declaracoes";
import { InterpretadorComImportacaoInterface } from "../../fontes/interfaces/interpretador-com-importacao-interface";
import { Declaracao } from "@designliquido/delegua";

describe('Módulo de Declarações', () => {
    it('Deve criar uma instância com os parâmetros corretos', () => {
        const linha = 5;
        const hashArquivo = 54321;
        const declaracoes: Declaracao[] = [];

        const moduloDeclaracoes = new ModuloDeclaracoes(linha, hashArquivo, declaracoes);

        expect(moduloDeclaracoes.linha).toBe(linha);
        expect(moduloDeclaracoes.hashArquivo).toBe(hashArquivo);
        expect(moduloDeclaracoes.declaracoes).toBe(declaracoes);
    });

    it('Deve aceitar visitante e chamar o método correto', async () => {
        const moduloDeclaracoes = new ModuloDeclaracoes(1, 1, []);

        const visitanteMock = {
            visitarDeclaracaoModuloDeclaracoes: jest.fn().mockResolvedValue('resultado')
        } as unknown as InterpretadorComImportacaoInterface;

        const resultado = await moduloDeclaracoes.aceitar(visitanteMock);

        expect(visitanteMock.visitarDeclaracaoModuloDeclaracoes).toHaveBeenCalledWith(moduloDeclaracoes);
        expect(resultado).toBe('resultado');
    });

    it('Deve retornar texto formatado correto', () => {
        const moduloDeclaracoes = new ModuloDeclaracoes(1, 1, []);

        const texto = moduloDeclaracoes.paraTexto();

        expect(texto).toBe('<módulo-declarações />');
    });

    it('Deve lançar erro ao chamar paraTextoSaida', () => {
        const moduloDeclaracoes = new ModuloDeclaracoes(1, 1, []);

        expect(() => {
            moduloDeclaracoes.paraTextoSaida();
        }).toThrow('Método não implementado.');
    });

    it('Deve armazenar múltiplas declarações', () => {
        const declaracoesMock = [
            {} as Declaracao,
            {} as Declaracao,
            {} as Declaracao
        ];

        const moduloDeclaracoes = new ModuloDeclaracoes(10, 12345, declaracoesMock);

        expect(moduloDeclaracoes.declaracoes).toHaveLength(3);
        expect(moduloDeclaracoes.declaracoes).toBe(declaracoesMock);
    });

    it('Deve funcionar com declarações vazias', () => {
        const moduloDeclaracoes = new ModuloDeclaracoes(1, 1, []);

        expect(moduloDeclaracoes.declaracoes).toHaveLength(0);
        expect(moduloDeclaracoes.declaracoes).toEqual([]);
    });

    it('Deve permitir definir nome do módulo', () => {
        const moduloDeclaracoes = new ModuloDeclaracoes(1, 1, []);
        moduloDeclaracoes.nomeModulo = 'meu-modulo';

        expect(moduloDeclaracoes.nomeModulo).toBe('meu-modulo');
    });

    it('Deve ter nomeModulo indefinido por padrão', () => {
        const moduloDeclaracoes = new ModuloDeclaracoes(1, 1, []);

        expect(moduloDeclaracoes.nomeModulo).toBeUndefined();
    });
});
