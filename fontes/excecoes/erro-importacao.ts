export class ErroImportacao extends Error {
    caminhoArquivo: string;
    mensagem: string;

    constructor(caminhoArquivo: string, mensagem: string) {
        super(mensagem);
        this.caminhoArquivo = caminhoArquivo;
        Object.setPrototypeOf(this, ErroImportacao.prototype);
    }
}
