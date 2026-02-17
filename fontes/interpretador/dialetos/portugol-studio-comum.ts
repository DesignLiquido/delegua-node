import { ImportarComoConstruto } from "@designliquido/delegua/construtos";
import { Importar } from "@designliquido/delegua/declaracoes";
import { ErroEmTempoDeExecucao } from "@designliquido/delegua/excecoes";
import { DeleguaModulo } from "@designliquido/delegua/interpretador/estruturas";

import comumAncestral from "@designliquido/portugol-studio/interpretador/comum";

/* TODO: Reabilitar na próxima versão de Portugol Studio.
export async function visitarDeclaracaoImportarComum(declaracao: Importar): Promise<DeleguaModulo> {
    return Promise.resolve(logicaComumImportacao(declaracao.caminho.valor));
}

export async function visitarExpressaoImportarComum(expressao: ImportarComoConstruto): Promise<DeleguaModulo> {
    const caminho = typeof expressao.caminho.valor === 'string' ? expressao.caminho.valor : String(expressao.caminho.valor);
    return Promise.resolve(logicaComumImportacao(caminho));
}

function logicaComumImportacao(caminho: string): DeleguaModulo {
    switch (caminho) {
        case 'Arquivos':
            return comumAncestral.carregarBibliotecaArquivos();
        case 'Calendario':
            return comumAncestral.carregarBibliotecaCalendario();
        case 'Internet':
            return comumAncestral.carregarBibliotecaInternet();
        case 'Matematica':
            return comumAncestral.carregarBibliotecaMatematica();
        case 'Objetos':
            return comumAncestral.carregarBibliotecaObjetos();
        case 'Texto':
            return comumAncestral.carregarBibliotecaTexto();
        case 'Tipos':
            return comumAncestral.carregarBibliotecaTipos();
        case 'Util':
            return comumAncestral.carregarBibliotecaUtil();
        default:
            throw new ErroEmTempoDeExecucao(null, `Biblioteca não implementada: ${caminho}.`);
    }
}
*/