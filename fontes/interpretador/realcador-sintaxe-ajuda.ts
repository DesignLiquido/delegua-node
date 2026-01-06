import chalk from "chalk";

/**
 * Realçador de sintaxe para código Delégua em exemplos de ajuda.
 * Aplica cores usando chalk para melhorar a legibilidade.
 */

// Palavras-chave da linguagem
const PALAVRAS_CHAVE = new Set([
    'var', 'const', 'se', 'senao', 'senão', 'para', 'enquanto', 'fazer',
    'funcao', 'função', 'retorna', 'classe', 'herda', 'construtor',
    'isto', 'super', 'tente', 'pegue', 'finalmente', 'sustar', 'continua',
    'escolha', 'caso', 'padrao', 'padrão', 'importar', 'de', 'como'
]);

// Valores literais
const LITERAIS = new Set([
    'verdadeiro', 'falso', 'nulo'
]);

// Funções nativas conhecidas
const FUNCOES_NATIVAS = new Set([
    'escreva', 'leia', 'mapear', 'filtrarPor', 'ordenar', 'paraCada',
    'numero', 'número', 'inteiro', 'real', 'texto', 'tamanho',
    'aleatorio', 'aleatório', 'aleatorioEntre', 'clonar', 'tupla',
    'todosEmCondicao', 'encontrar', 'somar', 'maximo', 'máximo',
    'minimo', 'mínimo'
]);

/**
 * Aplica realce de sintaxe a uma linha de código Delégua.
 */
function realcarLinha(linha: string): string {
    let resultado = '';
    let i = 0;

    while (i < linha.length) {
        // Comentários de linha
        if (linha.substring(i, i + 2) === '//') {
            resultado += chalk.gray(linha.substring(i));
            break;
        }

        // Strings com aspas duplas
        if (linha[i] === '"') {
            let j = i + 1;
            let temInterpolacao = false;

            while (j < linha.length) {
                if (linha[j] === '\\' && j + 1 < linha.length) {
                    j += 2;
                    continue;
                }
                if (linha.substring(j, j + 2) === '${') {
                    temInterpolacao = true;
                }
                if (linha[j] === '"') {
                    j++;
                    break;
                }
                j++;
            }

            const stringCompleta = linha.substring(i, j);
            if (temInterpolacao) {
                // Realça strings com interpolação
                resultado += realcarStringInterpolada(stringCompleta);
            } else {
                resultado += chalk.green(stringCompleta);
            }
            i = j;
            continue;
        }

        // Strings com aspas simples
        if (linha[i] === "'") {
            let j = i + 1;
            while (j < linha.length && linha[j] !== "'") {
                if (linha[j] === '\\') j++;
                j++;
            }
            resultado += chalk.green(linha.substring(i, j + 1));
            i = j + 1;
            continue;
        }

        // Números
        if (/\d/.test(linha[i])) {
            let j = i;
            while (j < linha.length && /[\d.]/.test(linha[j])) {
                j++;
            }
            resultado += chalk.cyan(linha.substring(i, j));
            i = j;
            continue;
        }

        // Identificadores e palavras-chave
        if (/[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ_]/.test(linha[i])) {
            let j = i;
            while (j < linha.length && /[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9_]/.test(linha[j])) {
                j++;
            }
            const palavra = linha.substring(i, j);

            if (PALAVRAS_CHAVE.has(palavra)) {
                resultado += chalk.magenta(palavra);
            } else if (LITERAIS.has(palavra)) {
                resultado += chalk.yellow(palavra);
            } else if (FUNCOES_NATIVAS.has(palavra)) {
                resultado += chalk.blue(palavra);
            } else {
                resultado += palavra;
            }
            i = j;
            continue;
        }

        // Operadores especiais
        if ('(){}[]'.includes(linha[i])) {
            resultado += chalk.yellow(linha[i]);
            i++;
            continue;
        }

        // Outros caracteres
        resultado += linha[i];
        i++;
    }

    return resultado;
}

/**
 * Realça strings com interpolação ${variavel}.
 */
function realcarStringInterpolada(str: string): string {
    let resultado = '';
    let i = 0;

    while (i < str.length) {
        if (str.substring(i, i + 2) === '${') {
            // Encontra o fim da interpolação
            let j = i + 2;
            let nivel = 1;
            while (j < str.length && nivel > 0) {
                if (str[j] === '{') nivel++;
                if (str[j] === '}') nivel--;
                j++;
            }

            // A parte antes do ${ em verde
            const antes = str.substring(Math.max(0, resultado.length === 0 ? 0 : i), i);
            if (antes) resultado += chalk.green(antes);

            // A interpolação em amarelo
            resultado += chalk.yellow(str.substring(i, j));
            i = j;
        } else {
            i++;
        }
    }

    // Adiciona o resto em verde
    if (i === str.length) {
        return chalk.green(str);
    }

    return resultado || chalk.green(str);
}

/**
 * Detecta se uma linha é código (indentada com espaços).
 */
function ehLinhaDeCodigo(linha: string): boolean {
    // Linha vazia
    if (linha.trim() === '') return false;

    // Começa com espaços (indentação de código)
    if (/^  [^ ]/.test(linha)) return true;

    return false;
}

/**
 * Aplica realce de sintaxe ao conteúdo de ajuda.
 * Detecta blocos de código e aplica cores apropriadas.
 */
export function aplicarRealceSintaxe(conteudo: string): string {
    const linhas = conteudo.split('\n');
    const resultado: string[] = [];
    let emBlocoExemplo = false;

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];

        // Detecta início de seção de exemplos
        if (linha.includes('**Exemplos:**') || linha.includes('**Exemplo:**')) {
            emBlocoExemplo = true;
            resultado.push(linha);
            continue;
        }

        // Detecta fim de seção de exemplos (nova seção com **)
        if (emBlocoExemplo && linha.includes('**') && !linha.includes('Exemplo')) {
            emBlocoExemplo = false;
        }

        // Aplica realce se for linha de código
        if (emBlocoExemplo && ehLinhaDeCodigo(linha)) {
            // Remove a indentação, aplica realce, recoloca indentação
            const indentacao = linha.match(/^(\s*)/)?.[1] || '';
            const codigo = linha.trimStart();
            resultado.push(indentacao + realcarLinha(codigo));
        } else {
            resultado.push(linha);
        }
    }

    return resultado.join('\n');
}
