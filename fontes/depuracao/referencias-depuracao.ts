import { EscopoExecucaoInterface } from '@designliquido/delegua/interfaces/escopo-execucao';

/**
 * Registro de referências numéricas (estilo `variablesReference`/`frameId` do DAP) para valores
 * que precisam ser endereçados em requisições futuras, como quadros de pilha e escopos de variáveis.
 * Compartilhado entre o depurador padrão (`servidor-depuracao.ts`) e o adaptador DAP
 * (`dap/ponte-tempo-execucao-depuracao.ts`) para que os dois mantenham a mesma semântica de
 * referências.
 */
export class RegistroReferencias<T> {
    private contador = 1;
    private mapa = new Map<number, T>();

    registrar(valor: T): number {
        const referencia = this.contador++;
        this.mapa.set(referencia, valor);
        return referencia;
    }

    obter(referencia: number): T | undefined {
        return this.mapa.get(referencia);
    }

    limpar(): void {
        this.contador = 1;
        this.mapa.clear();
    }
}

/**
 * Retorna a declaração atualmente em execução dentro de um escopo, considerando que
 * `declaracaoAtual` pode ultrapassar o tamanho do vetor de declarações ao final da execução do escopo.
 */
export function obterDeclaracaoAtual(escopo: EscopoExecucaoInterface): any {
    if (!escopo || !Array.isArray(escopo.declaracoes) || escopo.declaracoes.length <= 0) {
        return null;
    }

    const posicaoAtual =
        escopo.declaracaoAtual >= escopo.declaracoes.length
            ? escopo.declaracoes.length - 1
            : escopo.declaracaoAtual;
    return escopo.declaracoes[posicaoAtual];
}

/**
 * Formata um valor de variável Delégua para representação textual, usada tanto no protocolo
 * texto do depurador padrão quanto no corpo das respostas `variables` do DAP.
 */
export function formatarValor(valor: any): string {
    if (valor === null) {
        return 'nulo';
    }

    if (valor === undefined) {
        return 'indefinido';
    }

    if (typeof valor === 'string') {
        return valor;
    }

    if (typeof valor === 'number' || typeof valor === 'boolean') {
        return String(valor);
    }

    try {
        return JSON.stringify(valor);
    } catch {
        return String(valor);
    }
}
