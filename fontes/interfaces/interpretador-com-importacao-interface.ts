import { InterpretadorInterface } from "@designliquido/delegua";

import { ModuloDeclaracoes } from "../declaracoes";
import { ImportarBiblioteca } from "../construtos";

export interface InterpretadorComImportacaoInterface extends InterpretadorInterface {
    visitarConstrutoImportarBiblioteca(importarBiblioteca: ImportarBiblioteca): Promise<any> | void;
    visitarDeclaracaoModuloDeclaracoes(declaracao: ModuloDeclaracoes): Promise<any> | void;
}
