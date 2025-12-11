import { ErroImportacao } from "../../fontes/excecoes/erro-importacao";

describe('Erro de Importação', () => {
    it('Deve criar uma instância de ErroImportacao com os parâmetros corretos', () => {
        const caminhoArquivo = './arquivo-teste.delegua';
        const mensagemErro = 'Arquivo não encontrado';

        const erro = new ErroImportacao(caminhoArquivo, mensagemErro);

        expect(erro).toBeInstanceOf(ErroImportacao);
        expect(erro).toBeInstanceOf(Error);
        expect(erro.caminhoArquivo).toBe(caminhoArquivo);
        expect(erro.message).toBe(mensagemErro);
    });

    it('Deve preservar a cadeia de protótipos', () => {
        const erro = new ErroImportacao('./teste.delegua', 'Erro de teste');

        expect(Object.getPrototypeOf(erro)).toBe(ErroImportacao.prototype);
    });

    it('Deve ser possível capturar como exceção', () => {
        const caminhoArquivo = './modulo-inexistente.delegua';
        const mensagemErro = 'Módulo não pode ser importado';

        expect(() => {
            throw new ErroImportacao(caminhoArquivo, mensagemErro);
        }).toThrow(ErroImportacao);

        expect(() => {
            throw new ErroImportacao(caminhoArquivo, mensagemErro);
        }).toThrow(mensagemErro);
    });

    it('Deve armazenar caminho de arquivo com barras invertidas', () => {
        const caminhoArquivo = 'C:\\projetos\\delegua\\teste.delegua';
        const mensagemErro = 'Erro ao processar arquivo';

        const erro = new ErroImportacao(caminhoArquivo, mensagemErro);

        expect(erro.caminhoArquivo).toBe(caminhoArquivo);
    });

    it('Deve armazenar caminho de arquivo com barras normais', () => {
        const caminhoArquivo = '/home/usuario/projetos/delegua/teste.delegua';
        const mensagemErro = 'Erro ao processar arquivo';

        const erro = new ErroImportacao(caminhoArquivo, mensagemErro);

        expect(erro.caminhoArquivo).toBe(caminhoArquivo);
    });

    it('Deve funcionar com mensagens vazias', () => {
        const erro = new ErroImportacao('./arquivo.delegua', '');

        expect(erro.message).toBe('');
        expect(erro.caminhoArquivo).toBe('./arquivo.delegua');
    });
});
