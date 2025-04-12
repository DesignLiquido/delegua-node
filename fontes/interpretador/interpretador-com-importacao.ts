import * as caminho from 'path';

import { Importar } from '@designliquido/delegua/declaracoes';
import { DeleguaModulo } from '@designliquido/delegua/estruturas';

import { ImportadorInterface } from '../interfaces/importador-interface';

import { SimboloInterface } from '@designliquido/delegua/interfaces';
import { Interpretador } from '@designliquido/delegua/interpretador';
import { InterpretadorComImportacaoInterface } from '../interfaces/interpretador-com-importacao-interface';
import { ModuloDeclaracoes } from '../declaracoes';

import * as comum from './comum';
import { ImportarBiblioteca } from '../construtos';


/**
 * O Interpretador visita todos os elementos complexos gerados pelo avaliador sintático (_parser_),
 * e de fato executa a lógica de programação descrita no código.
 */
export class InterpretadorComImportacao 
    extends Interpretador 
    implements InterpretadorComImportacaoInterface
{
    importador: ImportadorInterface<SimboloInterface>;

    constructor(
        importador: ImportadorInterface<SimboloInterface>,
        diretorioBase: string,
        performance = false,
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        super(diretorioBase, performance, funcaoDeRetorno, funcaoDeRetornoMesmaLinha);
        this.importador = importador;
    }

    async visitarConstrutoImportarBiblioteca(importarBiblioteca: ImportarBiblioteca) {
        return comum.visitarConstrutoImportarBiblioteca(this, importarBiblioteca);
    }

    async visitarDeclaracaoModuloDeclaracoes(declaracao: ModuloDeclaracoes) {
        return comum.visitarDeclaracaoModuloDeclaracoes(this, declaracao);
    }

    /**
     * Importa um arquivo como módulo.
     * @param declaracao A declaração de importação.
     * @returns Ou um `DeleguaModulo`, ou um dicionário de funções.
     */
    /* async visitarDeclaracaoImportar(declaracao: Importar): Promise<DeleguaModulo> {
        const caminhoRelativo = await this.avaliar(declaracao.caminho);
        const caminhoTotal = caminho.join(this.diretorioBase, caminhoRelativo);
        const nomeArquivo = caminho.basename(caminhoTotal);

        if (!caminhoTotal.endsWith('.delegua')) {
            try {
                return await carregarBibliotecaNode(caminhoRelativo);
            } catch (erro: any) {
                this.erros.push(erro);
                return null;
            }
        }

        const conteudoImportacao = this.importador.importar(caminhoRelativo, false);
        const retornoInterpretador = await this.interpretar(
            conteudoImportacao.retornoAvaliadorSintatico.declaracoes,
            true
        );

        const funcoesChamaveis = this.pilhaEscoposExecucao.obterTodasDeleguaFuncao();

        const declaracoesClasse = this.pilhaEscoposExecucao.obterTodasDeclaracaoClasse();

        if (declaracoesClasse.hasOwnProperty('super')) {
            delete declaracoesClasse['super'];
        }

        const novoModulo = new DeleguaModulo();

        const chavesFuncoesChamaveis = Object.keys(funcoesChamaveis);
        for (let i = 0; i < chavesFuncoesChamaveis.length; i++) {
            novoModulo.componentes[chavesFuncoesChamaveis[i]] = funcoesChamaveis[chavesFuncoesChamaveis[i]];
        }

        const chavesDeclaracoesClasse = Object.keys(declaracoesClasse);
        for (let i = 0; i < chavesDeclaracoesClasse.length; i++) {
            novoModulo.componentes[chavesDeclaracoesClasse[i]] = declaracoesClasse[chavesDeclaracoesClasse[i]];
        }

        return novoModulo;
    } */
}
