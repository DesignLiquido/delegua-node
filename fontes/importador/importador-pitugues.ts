import * as sistemaArquivos from 'fs';
import * as caminho from 'path';
import * as sistemaOperacional from 'os';

import { LexadorInterface, SimboloInterface } from '@designliquido/delegua/interfaces';
import { cyrb53 } from '@designliquido/delegua/geracao-identificadores';

import { LexadorPitugues } from '@designliquido/delegua';
import { RetornoImportador } from './retorno-importador';
import { ImportadorInterface } from '../interfaces';
import { ErroImportacao } from '../excecoes';

export class ImportadorPitugues implements ImportadorInterface<SimboloInterface> {
    diretorioBase: string = process.cwd();
    lexador: LexadorInterface<SimboloInterface>;
    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };
    depuracao: boolean;

    constructor(
        arquivosAbertos: { [identificador: string]: string },
        conteudoArquivosAbertos: { [identificador: string]: string[] },
        depuracao: boolean
    ) {
        this.lexador = new LexadorPitugues();
        this.arquivosAbertos = arquivosAbertos;
        this.conteudoArquivosAbertos = conteudoArquivosAbertos;
        this.depuracao = depuracao;
    }

    importar(
        caminhoRelativoArquivo: string,
        hashArquivoAnterior: number
    ): RetornoImportador<SimboloInterface> {
        const nomeArquivo = caminho.basename(caminhoRelativoArquivo);
        let caminhoAbsolutoArquivo: string;

        if (hashArquivoAnterior < 0) {
            caminhoAbsolutoArquivo = caminho.resolve(caminhoRelativoArquivo);
        } else {
            const diretorioFonte = caminho.dirname(
                this.arquivosAbertos[hashArquivoAnterior]
            );
            caminhoAbsolutoArquivo = caminho.resolve(
                diretorioFonte,
                caminhoRelativoArquivo
            );
        }

        const hashArquivo = cyrb53(caminhoAbsolutoArquivo.toLowerCase());

        if (!sistemaArquivos.existsSync(caminhoAbsolutoArquivo)) {
            throw new ErroImportacao(
                caminhoAbsolutoArquivo,
                `Não foi possível encontrar arquivo importado: ${nomeArquivo}.`,
            );
        }

        const dadosDoArquivo: Buffer = sistemaArquivos.readFileSync(
            caminhoAbsolutoArquivo
        );
        const conteudoDoArquivo: string[] = dadosDoArquivo
            .toString()
            .replace(sistemaOperacional.EOL, '\n')
            .split('\n')
            .map(linha => linha + '\0');

        const retornoLexador = this.lexador.mapear(
            conteudoDoArquivo,
            hashArquivo
        );
        this.arquivosAbertos[hashArquivo] = caminho.resolve(
            caminhoAbsolutoArquivo
        );

        if (this.depuracao) {
            this.conteudoArquivosAbertos[hashArquivo] = conteudoDoArquivo;
        }

        return {
            nomeArquivo,
            hashArquivo,
            retornoLexador
        } as RetornoImportador<SimboloInterface>;
    }
}
