import * as sistemaArquivos from 'fs';
import * as caminho from 'path';
import * as sistemaOperacional from 'os';

import cyrb53 from '@designliquido/delegua/fontes/depuracao/cyrb53';
import { ErroEmTempoDeExecucao } from '@designliquido/delegua/fontes/excecoes';
import { AvaliadorSintaticoInterface, LexadorInterface } from '@designliquido/delegua/fontes/interfaces';

import { RetornoImportador } from './retorno-importador';
import { ImportadorInterface } from '../interfaces';

/**
 * O Importador é responsável por manusear arquivos. Coordena as fases de lexação, avaliação sintática,
 * cataloga informações do arquivo no núcleo da linguagem (através das referências `arquivosAbertos` e
 * `conteudoArquivosAbertos`) e aponta erros caso ocorram.
 *
 */
export class Importador implements ImportadorInterface {
    diretorioBase: string = process.cwd();
    lexador: LexadorInterface;
    avaliadorSintatico: AvaliadorSintaticoInterface;
    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };
    depuracao: boolean;

    constructor(
        lexador: LexadorInterface,
        avaliadorSintatico: AvaliadorSintaticoInterface,
        arquivosAbertos: { [identificador: string]: string },
        conteudoArquivosAbertos: { [identificador: string]: string[] },
        depuracao: boolean
    ) {
        this.lexador = lexador;
        this.avaliadorSintatico = avaliadorSintatico;
        this.arquivosAbertos = arquivosAbertos;
        this.conteudoArquivosAbertos = conteudoArquivosAbertos;
        this.depuracao = depuracao;
    }

    importar(
        caminhoRelativoArquivo: string,
        importacaoInicial: boolean = false,
        traduzirJavaScriptParaDelegua: boolean = false
    ): RetornoImportador {
        const nomeArquivo = caminho.basename(caminhoRelativoArquivo);
        let caminhoAbsolutoArquivo = caminho.resolve(this.diretorioBase, caminhoRelativoArquivo);
        if (importacaoInicial) {
            caminhoAbsolutoArquivo = caminho.resolve(caminhoRelativoArquivo);
        }

        const hashArquivo = cyrb53(caminhoAbsolutoArquivo.toLowerCase());

        if (!sistemaArquivos.existsSync(nomeArquivo)) {
            // TODO: Terminar.
            /* throw new ErroEmTempoDeExecucao(
                declaracao.simboloFechamento,
                'Não foi possível encontrar arquivo importado.',
                declaracao.linha
            ); */
        }

        const dadosDoArquivo: Buffer = sistemaArquivos.readFileSync(caminhoAbsolutoArquivo);
        const conteudoDoArquivo: string[] = dadosDoArquivo.toString().replace(sistemaOperacional.EOL, '\n').split('\n');

        if (traduzirJavaScriptParaDelegua) {
            return {
                conteudoArquivo: conteudoDoArquivo,
                nomeArquivo,
                hashArquivo,
            } as RetornoImportador;
        }

        for (let linha = 0; linha < conteudoDoArquivo.length; linha++) {
            conteudoDoArquivo[linha] += '\0';
        }

        const retornoLexador = this.lexador.mapear(conteudoDoArquivo, hashArquivo);
        const retornoAvaliadorSintatico = this.avaliadorSintatico.analisar(retornoLexador, hashArquivo);
        this.arquivosAbertos[hashArquivo] = caminho.resolve(caminhoRelativoArquivo);

        if (this.depuracao) {
            this.conteudoArquivosAbertos[hashArquivo] = conteudoDoArquivo;
        }

        return {
            nomeArquivo,
            hashArquivo,
            retornoLexador,
            retornoAvaliadorSintatico,
        } as RetornoImportador;
    }
}
