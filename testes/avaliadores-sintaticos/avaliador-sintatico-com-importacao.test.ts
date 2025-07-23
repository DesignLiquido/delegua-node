import { Lexador } from "@designliquido/delegua/lexador";

import { AvaliadorSintaticoComImportacao } from "../../fontes/avaliador-sintatico/avaliador-sintatico-com-importacao";
import { Importador } from "../../fontes/importador";

describe('Avaliador Sintático com Importação de Delégua', () => {
    let lexador: Lexador;
    let avaliadorSintatico: AvaliadorSintaticoComImportacao;
    let arquivosAbertos: { [identificador: string]: string };
    let conteudoArquivosAbertos: { [identificador: string]: string[] };

    beforeEach(() => {
        lexador = new Lexador();
        arquivosAbertos = {};
        conteudoArquivosAbertos = {};
        const importador = new Importador(
            lexador,
            arquivosAbertos,
            conteudoArquivosAbertos,
            false
        );
        avaliadorSintatico = new AvaliadorSintaticoComImportacao(importador);
    });

    it('Trivial', () => {
        const retornoLexador = lexador.mapear([
            `var json = importar("json")`,
            `const retorno = json.textoParaJson('{"funcionarios":[{"id":0,"nome":"Marcelo","sobrenome":"Silva","salario":3200,"area":"SM"},{"id":1,"nome":"Washington","sobrenome":"Ramos","salario":2700,"area":"UD"},{"id":2,"nome":"Sergio","sobrenome":"Pinheiro","salario":2450,"area":"SD"},{"id":3,"nome":"Bernardo","sobrenome":"Costa","salario":3700,"area":"SM"},{"id":4,"nome":"Cleverton","sobrenome":"Farias","salario":2750,"area":"SD"},{"id":5,"nome":"Abraão","sobrenome":"Campos","salario":2550,"area":"SD"},{"id":6,"nome":"Letícia","sobrenome":"Farias","salario":2450,"area":"UD"},{"id":7,"nome":"Fernando","sobrenome":"Ramos","salario":2450,"area":"SD"},{"id":8,"nome":"Marcelo","sobrenome":"Farias","salario":2550,"area":"UD"},{"id":9,"nome":"Fabio","sobrenome":"Souza","salario":2750,"area":"SD"},{"id":10,"nome":"Clederson","sobrenome":"Oliveira","salario":2500,"area":"SD"}],"areas":[{"codigo":"SD","nome":"Desenvolvimento de Software"},{"codigo":"SM","nome":"Gerenciamento de Software"},{"codigo":"UD","nome":"Designer de UI/UX"}]}')`,
            `escreva(retorno["funcionarios"])`
        ], -1);
        const retornoAvaliadorSintatico = avaliadorSintatico.analisar(retornoLexador, -1);

        expect(retornoAvaliadorSintatico).toBeTruthy();
        expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(3);
    });
});