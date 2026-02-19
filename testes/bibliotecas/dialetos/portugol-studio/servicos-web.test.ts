import * as servicosWeb from '../../../../fontes/bibliotecas/dialetos/portugol-studio/servicos-web';

describe('Biblioteca Serviços Web', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Fluxo de Conexão Customizada (fazerRequisicao)', async () => {
        const endereco = 'https://api.teste.com/v1';
        const corpoEnviado = '{ "chave": "valor" }';
        const respostaMock = '{ "resultado": "sucesso" }';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue(respostaMock),
        });

        servicosWeb.abrirConexao(endereco);
        servicosWeb.adicionarCabecalho('X-Custom-Header', 'token-123');
        servicosWeb.adicionarParametros(corpoEnviado);

        const resultado = await servicosWeb.fazerRequisicao(servicosWeb.PUBLICAR);

        expect(global.fetch).toHaveBeenCalledWith(
            endereco,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'X-Custom-Header': 'token-123',
                    'Content-Type': 'application/json'
                }),
                body: corpoEnviado
            })
        );

        expect(resultado).toBe(respostaMock);
    });

    it('Método obterDados (GET)', async () => {
        const endereco = 'https://api.github.com/repos/DesignLiquido';
        const respostaEsperada = '{ "status": "ok" }';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            text: jest.fn().mockResolvedValue(respostaEsperada),
        });

        const resultado = await servicosWeb.obterDados(endereco);

        expect(global.fetch).toHaveBeenCalledWith(endereco);
        expect(resultado).toBe(respostaEsperada);
    });

    it('Método POST', async () => {
        const endereco = 'https://api.exemplo.com/usuarios';
        const corpoEnviado = JSON.stringify({ nome: 'Usuário', linguagem: 'Delégua' });
        const respostaEsperada = '{ "id": 1, "status": "criado" }';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 201,
            text: jest.fn().mockResolvedValue(respostaEsperada),
        });

        const resultado = await servicosWeb.publicarDados(endereco, corpoEnviado);

        expect(global.fetch).toHaveBeenCalledWith(
            endereco,
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: corpoEnviado
            })
        );

        expect(resultado).toBe(respostaEsperada);
    });

    it('Método PUT', async () => {
        const endereco = 'https://api.exemplo.com/usuarios';
        const corpoEnviado = JSON.stringify({ item: 'teste' });
        const respostaEsperada = '{ "status": "atualizado" }';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            text: jest.fn().mockResolvedValue(respostaEsperada),
        });

        const resultado = await servicosWeb.atualizarDados(endereco, corpoEnviado);

        expect(global.fetch).toHaveBeenCalledWith(
            endereco,
            expect.objectContaining({
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: corpoEnviado
            })
        );

        expect(resultado).toBe(respostaEsperada);
    });

    it('Método DELETE', async () => {
        const endereco = 'https://api.exemplo.com/usuarios';
        const respostaEsperada = '{ "status": "deletado" }';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            text: jest.fn().mockResolvedValue(respostaEsperada),
        });

        const resultado = await servicosWeb.excluirDados(endereco);

        expect(global.fetch).toHaveBeenCalledWith(
            endereco,
            expect.objectContaining({
                method: 'DELETE',
            })
        );

        expect(resultado).toBe(respostaEsperada);
    });
});