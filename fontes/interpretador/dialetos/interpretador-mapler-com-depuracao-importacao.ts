import { Declaracao, Importar } from "@designliquido/delegua/fontes/declaracoes";
import { DeleguaModulo } from "@designliquido/delegua/fontes/estruturas";
import { InterpretadorMaplerComDepuracao } from "@designliquido/delegua/fontes/interpretador/dialetos/mapler/interpretador-mapler-com-depuracao";
import { ImportadorInterface } from "../../interfaces";
import { SimboloInterface } from "@designliquido/delegua/fontes/interfaces";

export class InterpretadorMaplerComDepuracaoImportacao extends InterpretadorMaplerComDepuracao {
    importador: ImportadorInterface<SimboloInterface, Declaracao>;

    constructor(
        importador: ImportadorInterface<SimboloInterface, Declaracao>,
        diretorioBase: string, 
        funcaoDeRetorno: Function, 
        funcaoDeRetornoMesmaLinha: Function) 
    {
        super(diretorioBase, funcaoDeRetorno, funcaoDeRetornoMesmaLinha);
        this.importador = importador;
    }

    /**
     * Importa um arquivo como módulo.
     * @param declaracao A declaração de importação.
     * @returns Ou um `DeleguaModulo`, ou um dicionário de funções.
     */
    async visitarDeclaracaoImportar(declaracao: Importar): Promise<DeleguaModulo> {
        const caminhoRelativo = await this.avaliar(declaracao.caminho);

        const conteudoImportacao = this.importador.importar(caminhoRelativo, false);
        const retornoInterpretador = await this.interpretar(
            conteudoImportacao.retornoAvaliadorSintatico.declaracoes,
            true
        );

        const funcoesChamaveis = this.pilhaEscoposExecucao.obterTodasDeleguaFuncao();

        const novoModulo = new DeleguaModulo();

        const chavesFuncoesChamaveis = Object.keys(funcoesChamaveis);
        for (let i = 0; i < chavesFuncoesChamaveis.length; i++) {
            novoModulo.componentes[chavesFuncoesChamaveis[i]] = funcoesChamaveis[chavesFuncoesChamaveis[i]];
        }

        return novoModulo;
    }
}