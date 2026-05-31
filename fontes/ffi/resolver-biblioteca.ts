/**
 * Traduz um nome de biblioteca simples (e.g., `"m"`, `"ssl"`) para o
 * nome de arquivo específico da plataforma corrente.
 *
 * | Plataforma | Entrada | Saída        |
 * |------------|---------|--------------|
 * | Windows    | ssl     | ssl.dll      |
 * | macOS      | ssl     | libssl.dylib |
 * | Linux      | ssl     | libssl.so    |
 *
 * Se `nome` já contiver um separador de caminho ou extensão conhecida, é
 * devolvido sem alteração.
 */
export function resolverNomeBiblioteca(nome: string): string {
    const jaTemExtensao = /\.(dll|dylib|so(\.\d+)*)$/i.test(nome);
    if (jaTemExtensao || nome.includes('/') || nome.includes('\\')) {
        return nome;
    }

    if (process.platform === 'win32') {
        return `${nome}.dll`;
    }

    if (process.platform === 'darwin') {
        return `lib${nome}.dylib`;
    }

    return `lib${nome}.so`;
}
