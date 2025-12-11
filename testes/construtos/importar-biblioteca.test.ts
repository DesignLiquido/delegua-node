import { ImportarBiblioteca } from "../../fontes/construtos/importar-biblioteca";
import { InterpretadorComImportacaoInterface } from "../../fontes/interfaces/interpretador-com-importacao-interface";

describe('Importar Biblioteca', () => {
    it('Deve criar uma instância com os parâmetros corretos', () => {
        const hashArquivo = 12345;
        const linha = 10;
        const nomeBiblioteca = 'matematica';

        const importarBiblioteca = new ImportarBiblioteca(hashArquivo, linha, nomeBiblioteca);

        expect(importarBiblioteca.hashArquivo).toBe(hashArquivo);
        expect(importarBiblioteca.linha).toBe(linha);
        expect(importarBiblioteca.nomeBiblioteca).toBe(nomeBiblioteca);
    });

    it('Deve aceitar visitante e chamar o método correto', async () => {
        const importarBiblioteca = new ImportarBiblioteca(1, 1, 'teste');

        const visitanteMock = {
            visitarConstrutoImportarBiblioteca: jest.fn().mockResolvedValue('resultado')
        } as unknown as InterpretadorComImportacaoInterface;

        const resultado = await importarBiblioteca.aceitar(visitanteMock);

        expect(visitanteMock.visitarConstrutoImportarBiblioteca).toHaveBeenCalledWith(importarBiblioteca);
        expect(resultado).toBe('resultado');
    });

    it('Deve retornar texto formatado correto', () => {
        const importarBiblioteca = new ImportarBiblioteca(1, 1, 'json');

        const texto = importarBiblioteca.paraTexto();

        expect(texto).toBe('<importar-biblioteca />');
    });

    it('Deve lançar erro ao chamar paraTextoSaida', () => {
        const importarBiblioteca = new ImportarBiblioteca(1, 1, 'teste');

        expect(() => {
            importarBiblioteca.paraTextoSaida();
        }).toThrow('Método não implementado.');
    });

    it('Deve funcionar com nomes de biblioteca diferentes', () => {
        const bibliotecas = ['json', 'matematica', 'texto', 'arquivo'];

        bibliotecas.forEach((nomeBiblioteca, indice) => {
            const importar = new ImportarBiblioteca(indice, indice, nomeBiblioteca);
            expect(importar.nomeBiblioteca).toBe(nomeBiblioteca);
        });
    });

    it('Deve armazenar linha e hashArquivo corretamente', () => {
        const importarBiblioteca = new ImportarBiblioteca(99999, 250, 'biblioteca');

        expect(importarBiblioteca.hashArquivo).toBe(99999);
        expect(importarBiblioteca.linha).toBe(250);
    });
});
