import * as caminho from 'path';
import * as sistemaArquivos from 'fs';
import * as sistemaOperacional from 'os';

import {
    removerComentariosJsonc,
    resolverPacotePacoteca,
} from '../fontes/mecanismo-importacao-bibliotecas/resolvedor-pacoteca';

describe('Resolvedor de pacotes da Pacoteca', () => {
    let raiz: string;

    const criarPacote = (nome: string, manifesto: string, arquivos: { [caminho: string]: string } = {}) => {
        const diretorio = caminho.join(raiz, 'pacotes', 'node', nome);
        sistemaArquivos.mkdirSync(diretorio, { recursive: true });
        sistemaArquivos.writeFileSync(caminho.join(diretorio, 'pacoteca.jsonc'), manifesto);
        for (const [relativo, conteudo] of Object.entries(arquivos)) {
            const destino = caminho.join(diretorio, relativo);
            sistemaArquivos.mkdirSync(caminho.dirname(destino), { recursive: true });
            sistemaArquivos.writeFileSync(destino, conteudo);
        }
        return diretorio;
    };

    beforeEach(() => {
        raiz = sistemaArquivos.mkdtempSync(caminho.join(sistemaOperacional.tmpdir(), 'pacoteca-'));
    });

    afterEach(() => {
        sistemaArquivos.rmSync(raiz, { recursive: true, force: true });
    });

    describe('removerComentariosJsonc', () => {
        it('Remove comentários de linha e de bloco', () => {
            const texto = '{\n // linha\n "a": 1, /* bloco */ "b": 2\n}';
            expect(JSON.parse(removerComentariosJsonc(texto))).toEqual({ a: 1, b: 2 });
        });

        it('Preserva // e /* dentro de textos', () => {
            const texto = '{ "url": "https://x.com/*y*/", "e": "a\\"//b" }';
            expect(JSON.parse(removerComentariosJsonc(texto))).toEqual({ url: 'https://x.com/*y*/', e: 'a"//b' });
        });

        it('Rejeita comentário de bloco não fechado', () => {
            expect(() => removerComentariosJsonc('{ /* }')).toThrow('não fechado');
        });
    });

    describe('resolverPacotePacoteca', () => {
        it('Resolve o pontoDeEntrada de um pacote instalado', () => {
            const diretorio = criarPacote('mat', '{ "nome": "mat", "pontoDeEntrada": "mat.delegua" }', { 'mat.delegua': '' });
            expect(resolverPacotePacoteca('mat', raiz)).toBe(caminho.join(diretorio, 'mat.delegua'));
        });

        it('Sobe a árvore de diretórios até encontrar pacotes/', () => {
            const diretorio = criarPacote('mat', '{ "pontoDeEntrada": "mat.delegua" }', { 'mat.delegua': '' });
            const profundo = caminho.join(raiz, 'rotas', 'api', 'v1');
            sistemaArquivos.mkdirSync(profundo, { recursive: true });
            expect(resolverPacotePacoteca('mat', profundo)).toBe(caminho.join(diretorio, 'mat.delegua'));
        });

        it('Retorna null quando o pacote não está instalado', () => {
            expect(resolverPacotePacoteca('inexistente', raiz)).toBeNull();
        });

        it('Retorna null para pacote sem pontoDeEntrada .delegua (ex.: apenas pacoteNpm)', () => {
            criarPacote('http', '{ "nome": "http", "pacoteNpm": "@designliquido/delegua-http" }');
            expect(resolverPacotePacoteca('http', raiz)).toBeNull();
        });

        it('Ignora nomes que não são nomes simples de pacote', () => {
            expect(resolverPacotePacoteca('../fora', raiz)).toBeNull();
            expect(resolverPacotePacoteca('@designliquido/delegua-json', raiz)).toBeNull();
            expect(resolverPacotePacoteca('./local', raiz)).toBeNull();
        });

        it('Aceita nomes com acentos', () => {
            const diretorio = criarPacote('matemática', '{ "pontoDeEntrada": "m.delegua" }', { 'm.delegua': '' });
            expect(resolverPacotePacoteca('matemática', raiz)).toBe(caminho.join(diretorio, 'm.delegua'));
        });

        it('Rejeita pontoDeEntrada fora do diretório do pacote', () => {
            criarPacote('mau', '{ "pontoDeEntrada": "../../../segredo.delegua" }');
            expect(() => resolverPacotePacoteca('mau', raiz)).toThrow('fora do pacote');
        });

        it('Rejeita pontoDeEntrada inexistente', () => {
            criarPacote('quebrado', '{ "pontoDeEntrada": "nao-existe.delegua" }');
            expect(() => resolverPacotePacoteca('quebrado', raiz)).toThrow('não existe');
        });

        it('Rejeita pacoteca.jsonc inválido', () => {
            criarPacote('invalido', '{ "pontoDeEntrada": ');
            expect(() => resolverPacotePacoteca('invalido', raiz)).toThrow('Erro ao analisar');
        });
    });
});
