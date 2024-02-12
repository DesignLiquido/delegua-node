import * as caminho from 'path';

import { InterpretadorBirl } from "@designliquido/delegua/interpretador/dialetos";
import { SimboloInterface } from '@designliquido/delegua/interfaces';
import { Declaracao, Importar } from "@designliquido/delegua/declaracoes";
import { DeleguaModulo } from "@designliquido/delegua/estruturas";

import { ImportadorInterface } from "../../interfaces";
import carregarBibliotecaNode from '../mecanismo-importacao-bibliotecas';

export class InterpretadorBirlImportacao extends InterpretadorBirl {
    importador: ImportadorInterface<SimboloInterface, Declaracao>

    constructor(
        importador: ImportadorInterface<SimboloInterface, Declaracao>,
        diretorioBase: string,
        funcaoDeRetorno: Function,
        funcaoDeRetornoMesmaLinha: Function
    ) {
        super(diretorioBase, funcaoDeRetorno, funcaoDeRetornoMesmaLinha);
        this.importador = importador;
    }

    // @Todo: Revisitar
    async visitarDeclaracaoImportar(declaracao: Importar): Promise<DeleguaModulo> {
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
    }
}