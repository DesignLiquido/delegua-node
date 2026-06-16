import { aplicarRealceSintaxe } from '../../fontes/interpretador/realcador-sintaxe-ajuda';

describe('realcador-sintaxe-ajuda', () => {
    describe('aplicarRealceSintaxe', () => {
        it('Deve retornar string para conteúdo vazio', () => {
            const resultado = aplicarRealceSintaxe('');
            expect(typeof resultado).toBe('string');
        });

        it('Deve processar título markdown com #', () => {
            const conteudo = '# escreva(valores...)';
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
            expect(resultado.length).toBeGreaterThan(0);
        });

        it('Deve processar lista markdown com -', () => {
            const conteudo = '- item da lista';
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
        });

        it('Deve processar texto em negrito (**texto**)', () => {
            const conteudo = '**Sintaxe:**';
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
        });

        it('Deve detectar bloco de código markdown (```) e alternar estado', () => {
            const conteudo = '```\nescreva(1)\n```';
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
            expect(resultado.split('\n')).toHaveLength(3);
        });

        it('Deve realçar código dentro de bloco de exemplos', () => {
            const conteudo = [
                '**Exemplos:**',
                '  escreva(1)',
                '  var x = 2'
            ].join('\n');
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
            expect(resultado.split('\n')).toHaveLength(3);
        });

        it('Deve finalizar bloco de exemplos ao encontrar nova seção com **', () => {
            const conteudo = [
                '**Exemplos:**',
                '  escreva(1)',
                '**Retorno:**',
                '  nulo'
            ].join('\n');
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
            expect(resultado.split('\n')).toHaveLength(4);
        });

        it('Deve processar linha de separação ---', () => {
            const conteudo = '---';
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
        });

        it('Deve processar código inline com acento grave', () => {
            const conteudo = 'Use `escreva()` para imprimir';
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
        });

        it('Deve processar múltiplas linhas mantendo quantidade', () => {
            const linhas = [
                '# Título',
                '',
                'Descrição normal',
                '**Negrito:**',
                '- lista item'
            ];
            const conteudo = linhas.join('\n');
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado.split('\n')).toHaveLength(linhas.length);
        });

        it('Deve processar bloco de código markdown com código Delégua', () => {
            const conteudo = [
                '```delegua',
                'var x = 10',
                'escreva(x)',
                '```'
            ].join('\n');
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
            expect(resultado.split('\n')).toHaveLength(4);
        });

        it('Deve processar string com barra invertida no código (bloco exemplos)', () => {
            // Cobre o caminho de escape de backslash no realcador de linha
            // ehLinhaDeCodigo requer pelo menos 2 espaços de indentação
            const conteudo = [
                '**Exemplos:**',
                '  escreva("caminho\\\\arquivo")'
            ].join('\n');
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
        });

        it('Deve processar linha de citação markdown (blockquote)', () => {
            const conteudo = '> Esta é uma citação de exemplo';
            const resultado = aplicarRealceSintaxe(conteudo);
            expect(resultado).toBeTruthy();
        });
    });
});
