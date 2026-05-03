import { ConstrutoInterface } from "@designliquido/delegua/interfaces";

import { InterpretadorComImportacaoInterface } from "../interfaces/interpretador-com-importacao-interface";

export class ImportarBiblioteca implements ConstrutoInterface {
    linha: number;
    hashArquivo: number;
    nomeBiblioteca: string;

    constructor(
        hashArquivo: number,
        linha: number,
        nomeBiblioteca: string
    ) {
        this.linha = linha;
        this.hashArquivo = hashArquivo;
        this.nomeBiblioteca = nomeBiblioteca;
    }

    async aceitar(visitante: InterpretadorComImportacaoInterface): Promise<any> {
        return visitante.visitarConstrutoImportarBiblioteca(this);
    }

    paraTexto(): string {
        return `<importar-biblioteca />`;
    }

    paraTextoSaida(): string {
        throw new Error("Método não implementado.");
    }
}
