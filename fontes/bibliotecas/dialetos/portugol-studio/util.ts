import { InterpretadorInterface } from '@designliquido/delegua/interfaces';
import * as os from 'os';

const horaInicial: number = Date.now();

export async function obter_diretorio_usuario(): Promise<string> {
    try {
        return os.homedir();
    } catch (error) {
        throw new Error('Não foi possível obter o diretório do usuário');
    }
}

export async function numero_elementos(interpretador: InterpretadorInterface, vetor: any[]): Promise<number> {
    return vetor.length;
}

export async function numero_linhas(interpretador: InterpretadorInterface, matriz: any[][]): Promise<number> {
    return matriz.length;
}

export async function numero_colunas(interpretador: InterpretadorInterface, matriz: any[][]): Promise<number> {
    return matriz[0].length;
}

export async function sorteia(interpretador: InterpretadorInterface, minimo: number, maximo: number): Promise<number> {
    if (minimo > maximo) {
        throw new Error(`O valor mínimo (${minimo}) é maior do que o valor máximo (${maximo})`);
    }

    if (minimo === maximo) {
        throw new Error(`Os valores mínimo e máximo são iguais: ${minimo}`);
    }

    return Math.floor(Math.random() * (maximo + 1 - minimo)) + minimo;
}

export async function aguarde(interpretador: InterpretadorInterface, intervalo: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, intervalo));
}

export async function tempo_decorrido(): Promise<number> {
    const tempoAtual = Date.now();
    return Math.floor(tempoAtual - horaInicial);
}
