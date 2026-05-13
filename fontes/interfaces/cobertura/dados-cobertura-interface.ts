import { EntradaRamo } from "./entrada-ramo-interface";

export interface DadosCobertura {
    ramos: EntradaRamo[];
    linhasExpressoes: Set<number>;
    totalRamos: number;
    totalFuncoes: number;
    funcoesCobertas: number;
}
