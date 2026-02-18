import { InterpretadorPortugolStudioComDepuracao } from "@designliquido/portugol-studio";
import { AvaliadorSintaticoPortugolStudio } from "@designliquido/portugol-studio/avaliador-sintatico";
import { LexadorPortugolStudio } from "@designliquido/portugol-studio/lexador";

describe('Interpretador do Portugol Studio com suporte a importação de arquivos', () => {
    let lexador: LexadorPortugolStudio;
    let avaliadorSintatico: AvaliadorSintaticoPortugolStudio;
    let interpretador: InterpretadorPortugolStudioComDepuracao;

    let _saidas: string[] = [];
    const funcaoSaida = (texto: string) => {
        _saidas.push(texto);
    }

    beforeEach(() => {
        _saidas = [];
        lexador = new LexadorPortugolStudio();
        avaliadorSintatico = new AvaliadorSintaticoPortugolStudio();
        interpretador = new InterpretadorPortugolStudioComDepuracao(process.cwd(), funcaoSaida, funcaoSaida);
    });

    describe('Uso com Bibliotecas', () => {
        it('Util.sorteio', async () => {
            let _saidas: string[] = [];
            interpretador.funcaoDeRetornoMesmaLinha = (saida: string) => {
                _saidas.push(saida);
            }

            const retornoLexador = lexador.mapear([
                'programa',
                '{',
                '    inclua biblioteca Util --> util',
                '    funcao inicio() ',
                '    {',
                '        inteiro vetor[10]',
                '        // preenche o vetor',
                '        para (inteiro posicao = 0; posicao < 10; posicao++)',
                '        {',
                '            vetor[posicao] = util.sorteia(1, 100) // Sorteia um número e atribui à posição do vetor',
                '        }',
                '        // Exibe o vetor na ordem original',
                '        escreva ("Vetor na ordem original:\n")',
                '        para(inteiro posicao = 0; posicao < 10; posicao++)',
                '        {',
                '            escreva (vetor[posicao], " ")',
                '        }',
                '        // Exibe o vetor na ordem inversa',
                '        escreva ("\n\nVetor na ordem inversa:\n")',
                '        para(inteiro posicao = 9; posicao >=0; posicao--)',
                '        {',
                '            escreva (vetor[posicao], " ")',
                '        }',
                '    }',
                '}'
            ], -1);

            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            const retornoInterpretador = await interpretador.interpretar(retornoAvaliadorSintatico.declaracoes);

            expect(retornoInterpretador.erros).toHaveLength(0);
            expect(_saidas).toHaveLength(22);
        });
    });
});