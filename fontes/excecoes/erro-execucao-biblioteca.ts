export class ErroExecucaoBiblioteca extends Error {
    mensagem: string;

    constructor(mensagem: string) {
        super(mensagem);
        this.name = "ErroExecucaoBiblioteca";
    }
}