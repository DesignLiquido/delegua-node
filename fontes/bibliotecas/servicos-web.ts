export class ServicosWeb {
    OBTER = 1;
    PUBLICAR = 2;
    ATUALIZAR = 3;
    EXCLUIR = 4;

    private conexaoCache: {
        endereco: string;
        cabecalhos: Record<string, string>;
        corpo: string | null;
    } | null = null;

    private obterConexaoEmCache() {
        if (this.conexaoCache == null) {
            throw new Error("É necessário criar uma conexão customizada antes de adicionar o cabeçalho ou parâmetros.");
        }

        return this.conexaoCache;
    }

    abrirConexao(endereco: string) {
        this.conexaoCache = {
            endereco: endereco,
            cabecalhos: {},
            corpo: null
        };
    }

    adicionarCabecalho(chave: string, valor: string) {
        const conexao = this.obterConexaoEmCache();
        conexao.cabecalhos[chave] = valor;
    }

    adicionarParametros(objeto: string) {
        const conexao = this.obterConexaoEmCache();
        conexao.corpo = objeto;
    }

    async fazerRequisicao(metodoHttp: number) {
        const conexao = this.obterConexaoEmCache();

        let metodo = 'GET';
        switch (metodoHttp) {
            case this.PUBLICAR:
                metodo = 'POST';
                break;
            case this.ATUALIZAR:
                metodo = 'PUT';
                break;
            case this.EXCLUIR:
                metodo = 'DELETE';
                break;
            case this.OBTER:
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

    async obterDados(endereco: string) {
        try {
            const resposta = await fetch(endereco);
            return await resposta.text();
        } catch (e) {
            throw new Error("Ocorreu um problema na requisição: " + e.message);
        }
    }

    async excluirDados(endereco: string) {
        try {
            const resposta = await fetch(endereco, { method: 'DELETE' });
            if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

            return await resposta.text();
        } catch (e) {
            throw new Error("Ocorreu um problema na requisição: " + e.message);
        }
    }

    async publicarDados(endereco: string, objeto: string) {
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

    async atualizarDados(endereco: string, objeto: string) {
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
}