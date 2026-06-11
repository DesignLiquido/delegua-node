import * as caminho from 'path';

import { ImportadorPitugues } from '../fontes/importador/importador-pitugues';
import { ErroImportacao } from '../fontes/excecoes';

const caminhoExemplo = caminho.resolve(
    __dirname,
    '..',
    'exemplos',
    'dialetos',
    'pitugues',
    'fibonacci.pitugues'
);
const diretorioExemplo = caminho.dirname(caminhoExemplo);

describe('ImportadorPitugues', () => {
    let arquivosAbertos: { [identificador: string]: string };
    let conteudoArquivosAbertos: { [identificador: string]: string[] };

    beforeEach(() => {
        arquivosAbertos = {};
        conteudoArquivosAbertos = {};
    });

    describe('importar', () => {
        it('Deve importar arquivo .pitugues com hashArquivoAnterior < 0', () => {
            const importador = new ImportadorPitugues(arquivosAbertos, conteudoArquivosAbertos, false);
            const caminhoRelativo = caminho.relative(process.cwd(), caminhoExemplo);

            const retorno = importador.importar(caminhoRelativo, -1);

            expect(retorno).toBeTruthy();
            expect(retorno.nomeArquivo).toBe('fibonacci.pitugues');
            expect(retorno.hashArquivo).toBeGreaterThan(0);
            expect(retorno.retornoLexador).toBeTruthy();
        });

        it('Deve importar arquivo .pitugues com hashArquivoAnterior >= 0', () => {
            const importador = new ImportadorPitugues(arquivosAbertos, conteudoArquivosAbertos, false);
            const hashAnterior = 42;
            arquivosAbertos[hashAnterior] = caminho.join(diretorioExemplo, 'outro.pitugues');

            const retorno = importador.importar('fibonacci.pitugues', hashAnterior);

            expect(retorno).toBeTruthy();
            expect(retorno.nomeArquivo).toBe('fibonacci.pitugues');
            expect(retorno.hashArquivo).toBeGreaterThan(0);
        });

        it('Deve lançar ErroImportacao para arquivo não encontrado', () => {
            const importador = new ImportadorPitugues(arquivosAbertos, conteudoArquivosAbertos, false);

            expect(() => {
                importador.importar('arquivo-inexistente.pitugues', -1);
            }).toThrow(ErroImportacao);
        });

        it('Deve preencher conteudoArquivosAbertos quando depuracao = verdadeiro', () => {
            const importador = new ImportadorPitugues(arquivosAbertos, conteudoArquivosAbertos, true);
            const caminhoRelativo = caminho.relative(process.cwd(), caminhoExemplo);

            const retorno = importador.importar(caminhoRelativo, -1);

            expect(conteudoArquivosAbertos[retorno.hashArquivo]).toBeTruthy();
            expect(conteudoArquivosAbertos[retorno.hashArquivo].length).toBeGreaterThan(0);
        });

        it('Não deve preencher conteudoArquivosAbertos quando depuracao = falso', () => {
            const importador = new ImportadorPitugues(arquivosAbertos, conteudoArquivosAbertos, false);
            const caminhoRelativo = caminho.relative(process.cwd(), caminhoExemplo);

            const retorno = importador.importar(caminhoRelativo, -1);

            expect(conteudoArquivosAbertos[retorno.hashArquivo]).toBeUndefined();
        });

        it('Deve registrar caminho absoluto em arquivosAbertos após importação', () => {
            const importador = new ImportadorPitugues(arquivosAbertos, conteudoArquivosAbertos, false);
            const caminhoRelativo = caminho.relative(process.cwd(), caminhoExemplo);

            const retorno = importador.importar(caminhoRelativo, -1);

            expect(arquivosAbertos[retorno.hashArquivo]).toBeTruthy();
            expect(caminho.isAbsolute(arquivosAbertos[retorno.hashArquivo])).toBe(true);
        });
    });
});
