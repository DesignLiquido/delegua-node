import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { TradutorInterface } from '@designliquido/delegua/fontes/interfaces';
import { TradutorJavaScript, TradutorPython, TradutorReversoJavaScript, TradutorReversoVisuAlg } from '@designliquido/delegua/fontes/tradutores';
import { ImportadorInterface } from './interfaces';
import { NucleoComum } from './nucleo-comum';
import { TradutorAssemblyScript } from '@designliquido/delegua/fontes/tradutores/tradutor-assemblyscript';
import { Importador } from './importador';
import { Lexador } from '@designliquido/delegua/fontes/lexador';
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico';
import { ImportadorJavaScript } from './importador/importador-javascript';
import { LexadorVisuAlg } from '@designliquido/delegua/fontes/lexador/dialetos';
import { AvaliadorSintaticoVisuAlg } from '@designliquido/delegua/fontes/avaliador-sintatico/dialetos';

export class NucleoTraducao 
    extends NucleoComum
{
    importador: ImportadorInterface<any, any>;
    tradutor: TradutorInterface;
    funcaoDeRetorno: Function;
    funcaoDeRetornoMesmaLinha: Function;

    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    comandoTraducao: string = '';

    extensoes = {
        assemblyscript: '.wat',
        delegua: '.delegua',
        javascript: '.js',
        js: '.js',
        alg: '.alg',
        visualg: '.alg',
        python: '.py',
        py: '.py',
    }

    constructor(
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        super();
        this.arquivosAbertos = {};
        this.conteudoArquivosAbertos = {};

        this.funcaoDeRetorno = funcaoDeRetorno || console.log;
        // `process.stdout.write.bind(process.stdout)` é necessário por causa de 
        // https://stackoverflow.com/questions/28874665/node-js-cannot-read-property-defaultencoding-of-undefined
        this.funcaoDeRetornoMesmaLinha = funcaoDeRetornoMesmaLinha || process.stdout.write.bind(process.stdout);
    }

    iniciarTradutor(comandoTraducao: string) {
        switch (comandoTraducao) {
            case 'delegua-para-assemblyscript':
            case 'delegua-para-wat':
                this.importador = new Importador(
                    new Lexador(false),
                    new AvaliadorSintatico(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );
                this.tradutor = new TradutorAssemblyScript();
            case 'delegua-para-js':
            case 'delegua-para-javascript':
                this.importador = new Importador(
                    new Lexador(false),
                    new AvaliadorSintatico(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );
                this.tradutor = new TradutorJavaScript();
                break;
            case 'delegua-para-py':
            case 'delegua-para-python':
                this.importador = new Importador(
                    new Lexador(false),
                    new AvaliadorSintatico(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );
                this.tradutor = new TradutorPython();
                break;
            case 'js-para-delegua':
            case 'javascript-para-delegua':
                this.importador = new ImportadorJavaScript();
                this.tradutor = new TradutorReversoJavaScript();
                break;
            case 'alg-para-delegua':
            case 'visualg-para-delegua':
                this.importador = new Importador(
                    new LexadorVisuAlg(),
                    new AvaliadorSintaticoVisuAlg(),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    false
                );
                this.tradutor = new TradutorReversoVisuAlg();
                break;
            default:
                throw new Error(`Tradutor '${comandoTraducao}' não implementado.`);
        }
    }

    /**
     * Realiza a tradução do arquivo passado como parâmetro no comando de execução.
     * @param caminhoRelativoArquivo O caminho do arquivo.
     * @param gerarArquivoSaida Se o resultado da tradução deve ser escrito em arquivo.
     *                          Se verdadeiro, os arquivos de saída são escritos no mesmo diretório
     *                          do arquivo passado no primeiro parâmetro.
     */
    traduzirArquivo(caminhoRelativoArquivo: string, gerarArquivoSaida: boolean): void {
        const caminhoAbsolutoPrimeiroArquivo = caminho.resolve(caminhoRelativoArquivo);
        const novoDiretorioBase = caminho.dirname(caminhoAbsolutoPrimeiroArquivo);

        this.importador.diretorioBase = novoDiretorioBase;

        const retornoImportador = this.importador.importar(
            caminhoRelativoArquivo,
            true
        );

        let resultado = null;
        if (this.afericaoErros(retornoImportador)) {
            process.exit(65); // Código para erro de avaliação antes da tradução
        }

        resultado = this.tradutor.traduzir(retornoImportador.retornoAvaliadorSintatico.declaracoes);

        if (gerarArquivoSaida) {
            const linguagem = this.comandoTraducao?.split('-')[2] || '';
            const extensaoAlvo = this.extensoes[linguagem]
            if (extensaoAlvo) {
                ['.delegua', '.js', '.alg'].map((extensao) => {
                    if (caminhoAbsolutoPrimeiroArquivo.includes(extensao)) {
                        sistemaArquivos.writeFile(caminhoAbsolutoPrimeiroArquivo.replace(extensao, `${extensaoAlvo}`), resultado, (erro) => {
                            if (erro) throw erro;
                        });
                        return;
                    }
                });
            }
        }

        this.funcaoDeRetorno(resultado);
    }    
}
