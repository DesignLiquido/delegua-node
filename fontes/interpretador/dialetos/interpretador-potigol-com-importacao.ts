import { AcessoMetodoOuPropriedade } from '@designliquido/delegua/construtos';
import { DeleguaModulo, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';
import { InterpretadorPotigol } from '@designliquido/potigol/interpretador';

import * as arquivo from '../../bibliotecas/dialetos/potigol/arquivo';
import { EstruturaURL, criarURL } from '../../bibliotecas/dialetos/potigol/url';

/**
 * Estende o `InterpretadorPotigol` com suporte a operações de sistema de arquivos
 * (`Arquivo.leia`, `Arquivo.salve`) e acesso à web (`URL(caminho).conteudo`, `.erro`).
 */
export class InterpretadorPotigolComImportacao extends InterpretadorPotigol {
    constructor(
        diretorioBase: string,
        performance = false,
        funcaoDeRetorno: Function = null,
        funcaoDeRetornoMesmaLinha: Function = null
    ) {
        super(diretorioBase, performance, funcaoDeRetorno, funcaoDeRetornoMesmaLinha);
        this.registrarBibliotecasExtras();
    }

    private registrarBibliotecasExtras(): void {
        const moduloArquivo = new DeleguaModulo('Arquivo');
        moduloArquivo.componentes = {
            leia: new FuncaoPadrao(1, arquivo.leia),
            salve: new FuncaoPadrao(2, arquivo.salve),
        };
        this.pilhaEscoposExecucao.definirVariavel('Arquivo', moduloArquivo);

        this.pilhaEscoposExecucao.definirVariavel('URL', new FuncaoPadrao(1, criarURL));
    }

    override async visitarExpressaoAcessoMetodoOuPropriedade(
        expressao: AcessoMetodoOuPropriedade
    ): Promise<any> {
        const variavelObjeto = await this.avaliar(expressao.objeto);
        const objeto = variavelObjeto?.hasOwnProperty('valor') ? variavelObjeto.valor : variavelObjeto;

        if (objeto instanceof EstruturaURL) {
            const chave = expressao.simbolo.lexema;
            if (chave === 'conteudo' || chave === 'conteúdo') {
                return objeto.conteudo;
            }
            if (chave === 'erro') {
                return objeto.erro;
            }
        }

        return super.visitarExpressaoAcessoMetodoOuPropriedade(expressao);
    }
}
