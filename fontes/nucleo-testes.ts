import * as fs from 'fs';
import * as caminho from 'path';

import chalk from 'chalk';

import { Lexador } from '@designliquido/delegua/lexador';
import { ResultadoTeste } from '@designliquido/delegua/bibliotecas/testes/registro-testes';

import { Importador } from './importador';
import { AvaliadorSintaticoComImportacao } from './avaliador-sintatico/avaliador-sintatico-com-importacao';
import { InterpretadorComCobertura } from './interpretador/interpretador-com-cobertura';
import { DadosCobertura } from './interfaces/cobertura';
import { ResultadoArquivo } from './interfaces';
import { carregarConfiguracaoTestes } from './configuracao/configuracao-testes';
import { resolverReportadores } from './cobertura/reportadores';

const IGNORADOS = new Set(['node_modules', '.git', 'dist', 'coverage']);

function descobrirArquivosTeste(diretorio: string): string[] {
    const arquivos: string[] = [];
    let entradas: fs.Dirent[];
    try {
        entradas = fs.readdirSync(diretorio, { withFileTypes: true });
    } catch {
        return arquivos;
    }

    for (const entrada of entradas) {
        if (entrada.name.startsWith('.') || IGNORADOS.has(entrada.name)) {
            continue;
        }

        const caminhoCompleto = caminho.join(diretorio, entrada.name);
        if (entrada.isDirectory()) {
            arquivos.push(...descobrirArquivosTeste(caminhoCompleto));
        } else if (entrada.name.endsWith('.teste.delegua')) {
            arquivos.push(caminhoCompleto);
        }
    }

    return arquivos;
}

async function executarArquivoDeTeste(caminhoAbsoluto: string): Promise<{
    resultados: ResultadoTeste[];
    errosRuntime: string[];
    cobertura: DadosCobertura;
}> {
    const arquivosAbertos: { [id: string]: string } = {};
    const conteudoArquivos: { [id: string]: string[] } = {};

    const lexador = new Lexador(false);
    const importador = new Importador(lexador, arquivosAbertos, conteudoArquivos, false);
    const avaliador = new AvaliadorSintaticoComImportacao(importador);
    const interpretador = new InterpretadorComCobertura(
        importador,
        caminho.dirname(caminhoAbsoluto),
        () => {},
        () => {}
    );

    importador.diretorioBase = caminho.dirname(caminhoAbsoluto);
    interpretador.diretorioBase = caminho.dirname(caminhoAbsoluto);

    const retornoImportador = importador.importar(caminhoAbsoluto, -1);

    if (retornoImportador.retornoLexador.erros.length > 0) {
        const msgs = retornoImportador.retornoLexador.erros
            .map((e: any) => e.mensagem || String(e))
            .join('; ');
        throw new Error(`Erros de léxico: ${msgs}`);
    }

    const retornoAS = await avaliador.analisar(
        retornoImportador.retornoLexador,
        retornoImportador.hashArquivo
    );

    if (retornoAS.erros.length > 0) {
        const msgs = retornoAS.erros
            .map((e: any) => e.mensagem || String(e))
            .join('; ');
        throw new Error(`Erros de sintaxe: ${msgs}`);
    }

    const retornoInterpretador = await interpretador.interpretar(
        retornoAS.declaracoes,
        false
    );

    const errosRuntime = retornoInterpretador.erros
        .map((e: any) => {
            const erroInterno = e.erroInterno;
            if (erroInterno) {
                return erroInterno.mensagem || erroInterno.message || String(erroInterno);
            }
            return e.mensagem || e.message || String(e);
        });

    const resultados = (interpretador as any).registroTestes?.resultados as ResultadoTeste[] ?? [];

    return { resultados, errosRuntime, cobertura: interpretador.cobertura };
}

const SEPARADOR = '='.repeat(70);

export async function executarTestes(diretorioBase: string = process.cwd()): Promise<void> {
    const arquivos = descobrirArquivosTeste(diretorioBase);

    if (arquivos.length === 0) {
        console.log(chalk.yellow('Nenhum arquivo .teste.delegua encontrado.'));
        return;
    }

    console.log(chalk.bold(`\nColetando arquivos de teste...`));
    console.log(chalk.dim(`  encontrado(s) ${arquivos.length} arquivo(s)\n`));

    const resultadosPorArquivo: ResultadoArquivo[] = [];

    for (const caminhoAbsoluto of arquivos) {
        const nomeRelativo = caminho.relative(diretorioBase, caminhoAbsoluto);
        process.stdout.write(chalk.dim(nomeRelativo) + ' ');

        let resultados: ResultadoTeste[] = [];
        let errosRuntime: string[] = [];
        let cobertura: DadosCobertura = { ramos: [], linhasExpressoes: new Set() };
        let erroCarga: string | undefined;

        try {
            ({ resultados, errosRuntime, cobertura } = await executarArquivoDeTeste(caminhoAbsoluto));
        } catch (erro: any) {
            erroCarga = erro.message || String(erro);
        }

        if (erroCarga) {
            process.stdout.write(chalk.red('E'));
        } else {
            for (const resultado of resultados) {
                process.stdout.write(
                    resultado.status === 'passou'
                        ? chalk.green('.')
                        : resultado.status === 'pulado'
                        ? chalk.yellow('p')
                        : chalk.red('F')
                );
            }

            // Erros de runtime fora de blocos teste() contam como um erro de arquivo
            if (errosRuntime.length > 0 && resultados.length === 0) {
                process.stdout.write(chalk.red('E'));
            }
        }

        process.stdout.write('\n');
        resultadosPorArquivo.push({ caminhoRelativo: nomeRelativo, resultados, errosRuntime, cobertura, erroCarga });
    }

    // Coletar falhas e erros
    const falhos: { caminhoRelativo: string; resultado: ResultadoTeste }[] = [];
    const errosCarga: { caminhoRelativo: string; mensagem: string }[] = [];
    const errosRuntime: { caminhoRelativo: string; mensagens: string[] }[] = [];

    for (const r of resultadosPorArquivo) {
        if (r.erroCarga) {
            errosCarga.push({ caminhoRelativo: r.caminhoRelativo, mensagem: r.erroCarga });
        } else {
            for (const resultado of r.resultados) {
                if (resultado.status === 'falhou') {
                    falhos.push({ caminhoRelativo: r.caminhoRelativo, resultado });
                }
            }
            if (r.errosRuntime.length > 0 && r.resultados.length === 0) {
                errosRuntime.push({ caminhoRelativo: r.caminhoRelativo, mensagens: r.errosRuntime });
            }
        }
    }

    const temFalhas = errosCarga.length > 0 || falhos.length > 0 || errosRuntime.length > 0;

    if (temFalhas) {
        console.log('\n' + chalk.red(SEPARADOR));
        console.log(chalk.bold.red('FALHAS'));
        console.log(chalk.red(SEPARADOR));

        for (const { caminhoRelativo, mensagem } of errosCarga) {
            console.log(chalk.red(`\nERRO AO CARREGAR: ${caminhoRelativo}`));
            console.log(`  ${mensagem}`);
        }

        for (const { caminhoRelativo, mensagens } of errosRuntime) {
            console.log(chalk.red(`\nERRO DE EXECUÇÃO: ${caminhoRelativo}`));
            for (const msg of mensagens) {
                console.log(`  ${msg}`);
            }
        }

        for (const { caminhoRelativo, resultado } of falhos) {
            const suite = resultado.nomeSuite ? `${resultado.nomeSuite} > ` : '';
            console.log(chalk.red(`\nFALHOU: ${caminhoRelativo} :: ${suite}${resultado.nomeTeste}`));
            if (resultado.mensagemErro) {
                console.log(chalk.red(`  Erro de asserção: ${resultado.mensagemErro}`));
            }
            console.log(chalk.dim(`  Tempo: ${resultado.tempoMs ?? 0}ms`));
        }
    }

    const todosResultados = resultadosPorArquivo.flatMap((r) => r.resultados);
    const totalPassou = todosResultados.filter((r) => r.status === 'passou').length;
    const totalPulado = todosResultados.filter((r) => r.status === 'pulado').length;
    const totalFalhou =
        todosResultados.filter((r) => r.status === 'falhou').length +
        errosCarga.length +
        errosRuntime.length;
    const totalTestes = totalPassou + totalPulado + totalFalhou;
    const tempoTotal = todosResultados.reduce((acc, r) => acc + (r.tempoMs ?? 0), 0);

    console.log('\n' + SEPARADOR);
    const resumo =
        `${totalTestes} ${totalTestes === 1 ? 'teste' : 'testes'} em ${arquivos.length} ${arquivos.length === 1 ? 'arquivo' : 'arquivos'}: ` +
        chalk.green(`${totalPassou} ${totalPassou === 1 ? 'passou' : 'passaram'}`) +
        ', ' +
        (totalFalhou > 0
            ? chalk.red(`${totalFalhou} ${totalFalhou === 1 ? 'falhou' : 'falharam'}`)
            : chalk.green('0 falharam')) +
        (totalPulado > 0 ? ', ' + chalk.yellow(`${totalPulado} ${totalPulado === 1 ? 'pulado' : 'pulados'}`) : '') +
        chalk.dim(` em ${tempoTotal}ms`);

    console.log(temFalhas ? chalk.red.bold(resumo) : chalk.green.bold(resumo));

    const configuracao = carregarConfiguracaoTestes(diretorioBase);
    const reportadores = resolverReportadores(configuracao.cobertura.reportadores);
    for (const reportador of reportadores) {
        await reportador({ resultadosPorArquivo, diretorioBase });
    }

    if (temFalhas) {
        process.exitCode = 1;
    }
}
