import { ImportarComoConstruto } from "@designliquido/delegua/construtos";
import { Importar } from "@designliquido/delegua/declaracoes";
import { DeleguaModulo } from "@designliquido/delegua/interpretador/estruturas";
import { InterpretadorPortugolStudioComDepuracao } from "@designliquido/portugol-studio";

import * as portugolStudioComum from './portugol-studio-comum';

/**
 * Classe que representa o interpretador do Portugol Studio com suporte a importação de arquivos e depuração,
 * mais bibliotecas que envolvem uso de recursos do sistema operacional, como leitura e escrita de arquivos, 
 * acesso a banco de dados, etc.
 */
export class InterpretadorPortugolStudioComDepuracaoImportacao extends InterpretadorPortugolStudioComDepuracao{
    override async visitarDeclaracaoImportar(declaracao: Importar): Promise<DeleguaModulo> {
        return portugolStudioComum.visitarDeclaracaoImportarComum(declaracao);
    }

    override async visitarExpressaoImportar(expressao: ImportarComoConstruto): Promise<DeleguaModulo> {
        return portugolStudioComum.visitarExpressaoImportarComum(expressao);
    }
}