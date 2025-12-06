import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { AvaliadorSintaticoInterface, SimboloInterface, TradutorInterface } from '@designliquido/delegua/interfaces';
import { PlataformaAlvoARM, TradutorAssemblyARM, TradutorJavaScript, TradutorPython, TradutorReversoJavaScript } from '@designliquido/delegua/tradutores';
import { TradutorAssemblyScript } from '@designliquido/delegua/tradutores/tradutor-assemblyscript';
import { Lexador } from '@designliquido/delegua/lexador';
import { AvaliadorSintatico } from '@designliquido/delegua/avaliador-sintatico';
import { LexadorVisuAlg } from '@designliquido/visualg/lexador';
import { AvaliadorSintaticoVisuAlg } from '@designliquido/visualg/avaliador-sintatico';
import { TradutorReversoVisuAlg } from '@designliquido/visualg/tradutores';
import { PlataformaAlvo, TradutorAssemblyX64 } from '@designliquido/delegua/tradutores/tradutor-assembly-x64';
import { AvaliadorSintaticoJavaScript } from "@designliquido/delegua/avaliador-sintatico/traducao/avaliador-sintatico-javascript";

import { ImportadorInterface } from './interfaces';
import { NucleoComum } from './nucleo-comum';
import { Importador } from './importador';
import { ImportadorJavaScript } from './importador/importador-javascript';

export class NucleoTraducao 
    extends NucleoComum
{
    importador: ImportadorInterface<any>;
    avaliadorSintatico: AvaliadorSintaticoInterface<any, any>;
    tradutor: TradutorInterface<any>;
    funcaoDeRetorno: Function;
    funcaoDeRetornoMesmaLinha: Function;

    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    comandoTraducao: string = '';

    extensoes = {
        assemblyscript: '.as',
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

    iniciarTradutor(comandoTraducao: string, alvo: string = '') {
        switch (comandoTraducao) {
            case 'delegua-para-x64':
                this.importador = new Importador(
                    new Lexador(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );
                this.avaliadorSintatico = new AvaliadorSintatico();
                let alvoResolvidoARM: PlataformaAlvoARM = 'linux-arm';
                if (alvo === 'android') {
                    alvoResolvidoARM = 'android';
                }

                this.tradutor = new TradutorAssemblyARM(alvoResolvidoARM);
                break;
            case 'delegua-para-assemblyscript':
            case 'delegua-para-as':
                this.importador = new Importador(
                    new Lexador(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );
                this.avaliadorSintatico = new AvaliadorSintatico();
                this.tradutor = new TradutorAssemblyScript();
                break;
            case 'delegua-para-js':
            case 'delegua-para-javascript':
                this.importador = new Importador(
                    new Lexador(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );

                this.avaliadorSintatico = new AvaliadorSintatico();
                this.tradutor = new TradutorJavaScript();
                break;
            case 'delegua-para-py':
            case 'delegua-para-python':
                this.importador = new Importador(
                    new Lexador(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );
                this.avaliadorSintatico = new AvaliadorSintatico();
                this.tradutor = new TradutorPython();
                break;
            case 'delegua-para-x64':
                this.importador = new Importador(
                    new Lexador(false),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos, 
                    false
                );
                this.avaliadorSintatico = new AvaliadorSintatico();
                let alvoResolvido: PlataformaAlvo = 'linux';
                if (alvo === 'windows') {
                    alvoResolvido = 'windows';
                }

                this.tradutor = new TradutorAssemblyX64(alvoResolvido);
                break;
            case 'js-para-delegua':
            case 'javascript-para-delegua':
                this.importador = new ImportadorJavaScript();
                this.avaliadorSintatico = new AvaliadorSintaticoJavaScript();
                this.tradutor = new TradutorReversoJavaScript();
                break;
            case 'alg-para-delegua':
            case 'visualg-para-delegua':
                this.importador = new Importador(
                    new LexadorVisuAlg(),
                    this.arquivosAbertos,
                    this.conteudoArquivosAbertos,
                    false
                );
                this.avaliadorSintatico = new AvaliadorSintaticoVisuAlg()
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
            -1
        );

        let resultado = null;
        if (this.afericaoErrosLexador(retornoImportador.retornoLexador)) {
            process.exit(65); // Código para erro de avaliação antes da tradução
        }

        const retornoAvaliadorSintatico = this.avaliadorSintatico.analisar(
            retornoImportador.retornoLexador, 
            retornoImportador.hashArquivo
        );

        resultado = this.tradutor.traduzir(retornoAvaliadorSintatico.declaracoes);

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
