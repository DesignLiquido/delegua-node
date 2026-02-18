export const [OBTER, PUBLICAR, ATUALIZAR, EXCLUIR] = [1, 2, 3, 4];

let conexaoCache: {
    endereco: string;
    cabecalhos: Record<string, string>;
    corpo: string | null;
} | null = null;

export function obterConexaoEmCache() {
    if (conexaoCache == null) {
        throw new Error("É necessário criar uma conexão customizada antes de adicionar o cabeçalho ou parâmetros.");
    }

    return conexaoCache;
}

export function abrirConexao(endereco: string) {
    conexaoCache = {
        endereco: endereco,
        cabecalhos: {},
        corpo: null
    };
}

export function adicionarCabecalho(chave: string, valor: string) {
    const conexao = obterConexaoEmCache();
    conexao.cabecalhos[chave] = valor;
}

export function adicionarParametros(objeto: string) {
    const conexao = obterConexaoEmCache();
    conexao.corpo = objeto;
}

export async function fazerRequisicao(metodoHttp: number) {
    const conexao = obterConexaoEmCache();

    let metodo = 'GET';
    switch (metodoHttp) {
        case PUBLICAR:
            metodo = 'POST';
            break;
        case ATUALIZAR:
            metodo = 'PUT';
            break;
        case EXCLUIR:
            metodo = 'DELETE';
            break;
        case OBTER:
        default:
            metodo = 'GET';
            break;
    }

    if (conexao.corpo && !conexao.cabecalhos['Content-Type']) {
        conexao.cabecalhos['Content-Type'] = 'application/json';
    }

    try {
        const resposta = await fetch(conexao.endereco, {
            method: metodo,
            headers: conexao.cabecalhos,
            body: metodo !== 'GET' ? conexao.corpo : null
        });
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        return await resposta.text();
    } catch (e) {
        throw new Error("Ocorreu um problema na requisição: " + e.message);
    }
}

export async function obterDados(endereco: string) {
    try {
        const resposta = await fetch(endereco);
        return await resposta.text();
    } catch (e) {
        throw new Error("Ocorreu um problema na requisição: " + e.message);
    }
}

export async function excluirDados(endereco: string) {
    try {
        const resposta = await fetch(endereco, { method: 'DELETE' });
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        return await resposta.text();
    } catch (e) {
        throw new Error("Ocorreu um problema na requisição: " + e.message);
    }
}

export async function publicarDados(endereco: string, objeto: string) {
    try {
        const resposta = await fetch(endereco, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: objeto
        });
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        return await resposta.text();
    } catch (e) {
        throw new Error("Ocorreu um problema na requisição: " + e.message);
    }
}

export async function atualizarDados(endereco: string, objeto: string) {
    try {
        const resposta = await fetch(endereco, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: objeto
        });
        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        return await resposta.text();
    } catch (e) {
        throw new Error("Ocorreu um problema na requisição: " + e.message);
    }
}