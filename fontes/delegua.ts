import * as caminho from 'path';

import {
    AvaliadorSintaticoInterface,
    LexadorInterface
} from '@designliquido/delegua/interfaces';

import { DeleguaInterface, ImportadorInterface } from './interfaces';
import { NucleoExecucao } from './nucleo-execucao';
import { NucleoTraducao } from './nucleo-traducao';

/**
 * O núcleo de execução e tradução de Delégua para Node.js.
 *
 * Responsável por avaliar a entrada fornecida, chamar o núcleo 
 * correspondente à operação solicitada e observar a execução.
 */
export class Delegua implements DeleguaInterface {
    lexador: LexadorInterface<any> | undefined;
    avaliadorSintatico: AvaliadorSintaticoInterface<any, any> | undefined;
    importador: ImportadorInterface<any> | undefined;

    funcaoDeRetorno: Function;
    funcaoDeRetornoMesmaLinha: Function;

    constructor(
        funcaoDeRetorno?: Function,
        funcaoDeRetornoMesmaLinha?: Function
    ) {
        this.funcaoDeRetorno = funcaoDeRetorno || console.log;
        // `process.stdout.write.bind(process.stdout)` é necessário por causa de 
        // https://stackoverflow.com/questions/28874665/node-js-cannot-read-property-defaultencoding-of-undefined
        this.funcaoDeRetornoMesmaLinha = funcaoDeRetornoMesmaLinha || process.stdout.write.bind(process.stdout);
    }

    versao(): string {
        // Tenta carregar o package.json de múltiplos locais:
        // - Durante desenvolvimento: ../package.json (relativo ao dist/)
        // - Após publicação: ./package.json (mesmo diretório)
        const caminhosPossiveis = [
            caminho.join(__dirname, '..', 'package.json'),  // Desenvolvimento (dist/ -> raiz)
            caminho.join(__dirname, 'package.json'),         // Publicado (raiz do pacote)
        ];

        for (const caminhoManifesto of caminhosPossiveis) {
            try {
                return require(caminhoManifesto).version;
            } catch {
                continue;
            }
        }

        return 'desconhecida';
    }

    async executarCodigoComoArgumento(
        codigo: string,
        dialeto: string = 'delegua',
        performance: boolean = false,
        depurador: boolean = false
    ): Promise<void> {
        const nucleoExecucao = new NucleoExecucao(this.versao(), this.funcaoDeRetorno, this.funcaoDeRetornoMesmaLinha);
        nucleoExecucao.configurarDialeto(dialeto, performance, depurador);
        return await nucleoExecucao.executarCodigoComoArgumento(codigo);
    }

    async executarCodigoPorArquivo(
        caminhoRelativoArquivo: string,
        dialeto: string = 'delegua',
        performance: boolean = false,
        depurador: boolean = false
    ): Promise<any> {
        const nucleoExecucao = new NucleoExecucao(this.versao(), this.funcaoDeRetorno, this.funcaoDeRetornoMesmaLinha);
        nucleoExecucao.configurarDialeto(dialeto, performance, depurador);
        return await nucleoExecucao.carregarEExecutarArquivo(caminhoRelativoArquivo);
    }

    async iniciarLair(dialeto: string = 'delegua'): Promise<void> { 
        const nucleoExecucao = new NucleoExecucao(this.versao(), this.funcaoDeRetorno, this.funcaoDeRetornoMesmaLinha);
        nucleoExecucao.configurarDialeto(dialeto, false);
        return await nucleoExecucao.iniciarLairDelegua();
    }

    async traduzirArquivo(
        caminhoRelativoArquivo: string, 
        comandoTraducao: string,
        alvo: string = '',
        gerarArquivoSaida: boolean = false
    ): Promise<void> {
        const nucleoTraducao = new NucleoTraducao(
            this.funcaoDeRetorno, 
            this.funcaoDeRetornoMesmaLinha
        );
        nucleoTraducao.iniciarTradutor(comandoTraducao, alvo);
        await nucleoTraducao.traduzirArquivo(caminhoRelativoArquivo, gerarArquivoSaida);
    }
}
