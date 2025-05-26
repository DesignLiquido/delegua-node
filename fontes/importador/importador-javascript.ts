import * as sistemaArquivos from 'fs';
import * as caminho from 'path';
import * as sistemaOperacional from 'os';
import { Statement, Directive, ModuleDeclaration } from 'estree';

import cyrb53 from '@designliquido/delegua/depuracao/cyrb53';

import { LexadorJavaScript } from "@designliquido/delegua/lexador/traducao/lexador-javascript";

import { ImportadorInterface } from "../interfaces";
import { RetornoImportador } from "./retorno-importador";

export class ImportadorJavaScript implements ImportadorInterface<(Statement | Directive | ModuleDeclaration)> {
    diretorioBase: string;
    conteudoArquivosAbertos: { [identificador: string]: string[]; };
    lexador: LexadorJavaScript;

    constructor() {
        this.lexador = new LexadorJavaScript();
    }

    importar(caminhoRelativoArquivo: string, hashArquivoAnterior: number): RetornoImportador<(Statement | Directive | ModuleDeclaration)> {
        const nomeArquivo = caminho.basename(caminhoRelativoArquivo);
        let caminhoAbsolutoArquivo = caminho.resolve(this.diretorioBase, caminhoRelativoArquivo);
        if (hashArquivoAnterior < 0) {
            caminhoAbsolutoArquivo = caminho.resolve(caminhoRelativoArquivo);
        }

        const hashArquivo = cyrb53(caminhoAbsolutoArquivo.toLowerCase());
        const dadosDoArquivo: Buffer = sistemaArquivos.readFileSync(caminhoAbsolutoArquivo);
        const conteudoDoArquivo: string[] = dadosDoArquivo.toString().replace(sistemaOperacional.EOL, '\n').split('\n');

        const retornoLexador = this.lexador.mapear(conteudoDoArquivo, hashArquivo);
        // TODO: Verificar se vai ser necessário.
        // this.arquivosAbertos[hashArquivo] = caminho.resolve(caminhoRelativoArquivo);

        return {
            nomeArquivo,
            hashArquivo,
            retornoLexador
        } as RetornoImportador<(Statement | Directive | ModuleDeclaration)>;
    }
}
