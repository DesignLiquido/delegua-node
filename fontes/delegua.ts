import {
    AvaliadorSintaticoInterface,
    LexadorInterface
} from '@designliquido/delegua/fontes/interfaces';

import { DeleguaInterface, ImportadorInterface } from './interfaces';
import { NucleoExecucao } from './nucleo-execucao';
import { NucleoTraducao } from './nucleo-traducao';

/**
 * O núcleo da linguagem.
 *
 * Responsável por avaliar a entrada fornecida, chamar o núcleo 
 * correspondente à operação solicitada e observar a execução.
 */
export class Delegua implements DeleguaInterface {
    lexador: LexadorInterface<any>;
    avaliadorSintatico: AvaliadorSintaticoInterface<any, any>;
    importador: ImportadorInterface<any, any>;

    funcaoDeRetorno: Function;
    funcaoDeRetornoMesmaLinha: Function;

    constructor(
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        this.funcaoDeRetorno = funcaoDeRetorno || console.log;
        // `process.stdout.write.bind(process.stdout)` é necessário por causa de 
        // https://stackoverflow.com/questions/28874665/node-js-cannot-read-property-defaultencoding-of-undefined
        this.funcaoDeRetornoMesmaLinha = funcaoDeRetornoMesmaLinha || process.stdout.write.bind(process.stdout);
    }

    async executarCodigoComoArgumento(
        codigo: string,
        dialeto: string = 'delegua',
        performance: boolean = false
    ): Promise<void> {
        const nucleoExecucao = new NucleoExecucao(this.funcaoDeRetorno, this.funcaoDeRetornoMesmaLinha);
        nucleoExecucao.configurarDialeto(dialeto, performance);
        await nucleoExecucao.executarCodigoComoArgumento(codigo);
    }

    async executarCodigoPorArquivo(
        caminhoRelativoArquivo: string,
        dialeto: string = 'delegua',
        performance: boolean = false
    ): Promise<any> {
        const nucleoExecucao = new NucleoExecucao(this.funcaoDeRetorno, this.funcaoDeRetornoMesmaLinha);
        nucleoExecucao.configurarDialeto(dialeto, performance);
        await nucleoExecucao.carregarEExecutarArquivo(caminhoRelativoArquivo);
    }

    async iniciarLair(dialeto: string = 'delegua'): Promise<void> { 
        const nucleoExecucao = new NucleoExecucao(this.funcaoDeRetorno, this.funcaoDeRetornoMesmaLinha);
        nucleoExecucao.configurarDialeto(dialeto, false);
        await nucleoExecucao.iniciarLairDelegua();
    }

    traduzirArquivo(
        caminhoRelativoArquivo: string, 
        comandoTraducao: string,
        gerarArquivoSaida: boolean = false
    ): void {
        const nucleoTraducao = new NucleoTraducao(this.funcaoDeRetorno, this.funcaoDeRetornoMesmaLinha);
        nucleoTraducao.iniciarTradutor(comandoTraducao);
        nucleoTraducao.traduzirArquivo(caminhoRelativoArquivo, gerarArquivoSaida);
    }
}
