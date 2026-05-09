import { ResultadoArquivo } from '../../interfaces';

export interface ContextoRelatorio {
    resultadosPorArquivo: ResultadoArquivo[];
    diretorioBase: string;
}
