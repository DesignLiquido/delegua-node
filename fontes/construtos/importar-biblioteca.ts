import { Construto } from "@designliquido/delegua";

import { InterpretadorComImportacaoInterface } from "../interfaces/interpretador-com-importacao-interface";

export class ImportarBiblioteca implements Construto {
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
}
