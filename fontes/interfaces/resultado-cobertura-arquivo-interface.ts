import { ResultadoTeste } from "@designliquido/delegua/bibliotecas/testes/registro-testes";
import { DadosCobertura } from "./cobertura";

export interface ResultadoArquivo {
    caminhoRelativo: string;
    resultados: ResultadoTeste[];
    errosRuntime: string[];
    cobertura: DadosCobertura;
    erroCarga?: string;
}
