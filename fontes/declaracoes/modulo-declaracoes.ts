import { Declaracao, Decorador } from "@designliquido/delegua";

import { InterpretadorComImportacaoInterface } from "../interfaces/interpretador-com-importacao-interface";

/**
 * Declaração devolvida ao importar um módulo.
 */
export class ModuloDeclaracoes extends Declaracao {
    nomeModulo?: string;
    declaracoes: Declaracao[];

    constructor(linha: number, hashArquivo: number, decoradores: Decorador[], declaracoes: Declaracao[]) {
        super(linha, hashArquivo, decoradores);
        this.declaracoes = declaracoes;
    }
    
    async aceitar(visitante: InterpretadorComImportacaoInterface): Promise<any> {
        return visitante.visitarDeclaracaoModuloDeclaracoes(this);
    }

    paraTexto(): string {
        return `<módulo-declarações />`;
    }
}