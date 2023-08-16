import * as sistemaArquivos from 'fs';
import * as caminho from 'path';
import * as sistemaOperacional from 'os';

import cyrb53 from '@designliquido/delegua/fontes/depuracao/cyrb53';

import { LexadorJavaScript } from "@designliquido/delegua/fontes/lexador/traducao/lexador-javascript";
import { AvaliadorSintaticoJavaScript } from "@designliquido/delegua/fontes/avaliador-sintatico/traducao/avaliador-sintatico-javascript";

import { ImportadorInterface } from "../interfaces";
import { RetornoImportador } from "./retorno-importador";

export class ImportadorJavaScript implements ImportadorInterface {
    diretorioBase: string;
    conteudoArquivosAbertos: { [identificador: string]: string[]; };
    lexador: LexadorJavaScript;
    avaliadorSintatico: AvaliadorSintaticoJavaScript;

    importar(caminhoRelativoArquivo: string, importacaoInicial: boolean): RetornoImportador {
        const nomeArquivo = caminho.basename(caminhoRelativoArquivo);
        let caminhoAbsolutoArquivo = caminho.resolve(this.diretorioBase, caminhoRelativoArquivo);
        if (importacaoInicial) {
            caminhoAbsolutoArquivo = caminho.resolve(caminhoRelativoArquivo);
        }

        const hashArquivo = cyrb53(caminhoAbsolutoArquivo.toLowerCase());
        const dadosDoArquivo: Buffer = sistemaArquivos.readFileSync(caminhoAbsolutoArquivo);
        const conteudoDoArquivo: string[] = dadosDoArquivo.toString().replace(sistemaOperacional.EOL, '\n').split('\n');

        for (let linha = 0; linha < conteudoDoArquivo.length; linha++) {
            conteudoDoArquivo[linha] += '\0';
        }

        const retornoLexador = this.lexador.mapear(conteudoDoArquivo, hashArquivo);
        const retornoAvaliadorSintatico = this.avaliadorSintatico.analisar(retornoLexador, hashArquivo);
        // TODO: Verificar se vai ser necessário.
        // this.arquivosAbertos[hashArquivo] = caminho.resolve(caminhoRelativoArquivo);

        return {
            nomeArquivo,
            hashArquivo,
            retornoLexador,
            retornoAvaliadorSintatico,
        } as RetornoImportador;
    }
    
}