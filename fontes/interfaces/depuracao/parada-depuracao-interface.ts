export interface ParadaDepuracao {
    caminhoArquivo: string;
    linha: number;
    motivo?: 'breakpoint' | 'step';
}
