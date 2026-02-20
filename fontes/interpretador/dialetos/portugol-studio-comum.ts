import { ImportarComoConstruto } from "@designliquido/delegua/construtos";
import { Importar } from "@designliquido/delegua/declaracoes";
import { DeleguaModulo, FuncaoPadrao } from "@designliquido/delegua/interpretador/estruturas";

import comumAncestral from "@designliquido/portugol-studio/interpretador/comum";

import * as arquivos from '../../bibliotecas/dialetos/portugol-studio/arquivos';
import * as internet from '../../bibliotecas/dialetos/portugol-studio/internet';
import * as teclado from '../../bibliotecas/dialetos/portugol-studio/teclado';
import * as util from '../../bibliotecas/dialetos/portugol-studio/util';
import * as servicosWeb from '../../bibliotecas/dialetos/portugol-studio/servicos-web';

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
            return carregarBibliotecaArquivos();
        case 'Internet':
            return carregarBibliotecaInternet();
        case 'Teclado':
            return carregarBibliotecaTeclado();
        case 'Util':
            return carregarBibliotecaUtil();
        case 'ServicosWeb':
            return carregarBibliotecaServicosWeb();
        default:
            return comumAncestral.logicaComumImportacao(caminho);
    }
}

function carregarBibliotecaArquivos(): DeleguaModulo {
    const metodos: { [nome: string]: FuncaoPadrao } = {
        abrir_arquivo: new FuncaoPadrao(2, arquivos.abrir_arquivo),
        fechar_arquivo: new FuncaoPadrao(1, arquivos.fechar_arquivo),
        fim_arquivo: new FuncaoPadrao(1, arquivos.fim_arquivo),
        ler_linha: new FuncaoPadrao(1, arquivos.ler_linha),
        escrever_linha: new FuncaoPadrao(2, arquivos.escrever_linha),
        substituir_texto: new FuncaoPadrao(4, arquivos.substituir_texto),
        arquivo_existe: new FuncaoPadrao(1, arquivos.arquivo_existe),
        apagar_arquivo: new FuncaoPadrao(1, arquivos.apagar_arquivo),
        criar_pasta: new FuncaoPadrao(1, arquivos.criar_pasta),
        listar_pastas: new FuncaoPadrao(2, arquivos.listar_pastas),
        listar_arquivos: new FuncaoPadrao(2, arquivos.listar_arquivos),
        listar_arquivos_por_tipo: new FuncaoPadrao(3, arquivos.listar_arquivos_por_tipo),
    };

    const objetoArquivos = new DeleguaModulo('Arquivos');
    objetoArquivos.componentes = metodos;
    return objetoArquivos;
}

function carregarBibliotecaInternet(): DeleguaModulo {
    const metodos: { [nome: string]: FuncaoPadrao } = {
        definir_tempo_limite: new FuncaoPadrao(1, internet.definir_tempo_limite),
        obter_texto: new FuncaoPadrao(1, internet.obter_texto),
        baixar_imagem: new FuncaoPadrao(2, internet.baixar_imagem),
        endereco_disponivel: new FuncaoPadrao(1, internet.endereco_disponivel),
    };

    const objetoInternet = new DeleguaModulo('Internet');
    objetoInternet.componentes = metodos;
    return objetoInternet;
}

function carregarBibliotecaTeclado(): DeleguaModulo {
    const objetoClasseTeclado = new teclado.Teclado();
    const metodos: { [nome: string]: FuncaoPadrao } = {
        tecla_pressionada: new FuncaoPadrao(1, objetoClasseTeclado.tecla_pressionada.bind(objetoClasseTeclado)),
        ler_tecla: new FuncaoPadrao(0, objetoClasseTeclado.ler_tecla.bind(objetoClasseTeclado)),
    };

    const objetoTeclado = new DeleguaModulo('Teclado');
    objetoTeclado.componentes = metodos;
    return objetoTeclado;
}

function carregarBibliotecaUtil(): DeleguaModulo {
    const metodos: { [nome: string]: FuncaoPadrao } = {
        obter_diretorio_usuario: new FuncaoPadrao(0, util.obter_diretorio_usuario),
        numero_elementos: new FuncaoPadrao(1, util.numero_elementos),
        numero_linhas: new FuncaoPadrao(1, util.numero_linhas),
        numero_colunas: new FuncaoPadrao(1, util.numero_colunas),
        sorteia: new FuncaoPadrao(2, util.sorteia),
        aguarde: new FuncaoPadrao(1, util.aguarde),
        tempo_decorrido: new FuncaoPadrao(0, util.tempo_decorrido),
    };

    const objetoUtil = new DeleguaModulo('Util');
    objetoUtil.componentes = metodos;
    return objetoUtil;
}

function carregarBibliotecaServicosWeb(): DeleguaModulo {
    const metodos: { [nome: string]: FuncaoPadrao } = {
        obterConexaoEmCache: new FuncaoPadrao(0, servicosWeb.obterConexaoEmCache),
        abrirConexao: new FuncaoPadrao(1, servicosWeb.abrirConexao),
        adicionarCabecalho: new FuncaoPadrao(2, servicosWeb.adicionarCabecalho),
        adicionarParametros: new FuncaoPadrao(1, servicosWeb.adicionarParametros),
        fazerRequisicao: new FuncaoPadrao(1, servicosWeb.fazerRequisicao),
        obterDados: new FuncaoPadrao(1, servicosWeb.obterDados),
        excluirDados: new FuncaoPadrao(1, servicosWeb.excluirDados),
        publicarDados: new FuncaoPadrao(2, servicosWeb.publicarDados),
        atualizarDados: new FuncaoPadrao(2, servicosWeb.atualizarDados),
    };

    const objetoServicosWeb = new DeleguaModulo('ServicosWeb');
    objetoServicosWeb.componentes = metodos;
    return objetoServicosWeb;
}