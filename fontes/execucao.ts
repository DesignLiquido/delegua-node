import * as caminho from 'path';

import { Command } from 'commander';

import { Delegua } from './delegua';
import { AdaptadorDapDelegua } from './depuracao';

export const extensoesDialetos: { [extensao: string]: string } = {
    '.alg': 'visualg',
    '.birl': 'birl',
    '.egua': 'egua',
    '.mapler': 'mapler',
    '.pitugues': 'pitugues',
    '.por': 'portugol-studio',
};

/**
 * Infere o dialeto a partir da extensão do arquivo.
 * Retorna `undefined` se a extensão não for reconhecida.
 */
export function inferirDialetoPorExtensao(nomeArquivo: string): string | undefined {
    const extensao = caminho.extname(nomeArquivo).toLowerCase();
    return extensoesDialetos[extensao];
}

const principal = async () => {
    const analisadorArgumentos = new Command();
    analisadorArgumentos;
    let codigoOuNomeArquivo: string | undefined = undefined;
    let comandoTestar = false;

    analisadorArgumentos
        .helpOption('-h, --ajuda', 'Exibe a ajuda para o comando.')
        .option(
            '-a, --alvo <alvo>',
            'O alvo, para casos de tradução que são compilações. Para traduções do tipo `delegua-para-x64`, os alvos válidos são "linux" (padrão) e "windows". Para traduções do tipo `delegua-para-arm`, os alvos válidos são "linux-arm" (padrão) e "android".',
            ''
        )
        .option(
            '-c, --codigo <código>',
            'Código a ser avaliado.',
            ''
        )
        .option(
            '-d, --dialeto <dialeto>',
            'Dialeto a ser usado. Padrão: delegua.',
            'delegua'
        )
        .option(
            '-D, --depurador',
            'Habilita o depurador, permitindo depuração em um ambiente como o VSCode. Sempre desabilitada em modo LAIR.',
            false
        )
        .option(
            '--depurador-padrao',
            'Habilita o depurador padrão por socket.',
            false
        )
        .option(
            '--dap',
            'Inicia o processo como adaptador DAP por stdio.',
            false
        )
        .option(
            '-p, --performance',
            'Visualizar indicadores de performance. Desabilitado por padrão.',
            false
        )
        .option(
            '-s, --saida',
            'Gera arquivo de saida ao traduzir arquivo.',
            false
        )
        .option(
            '-t, --traduzir <linguagem-para-linguagem>',
            'Traduz o código do arquivo passado como parâmetro de arquivo. Valores válidos: delegua-para-arm, delegua-para-assemblyscript, delegua-para-as, delegua-para-elixir, delegua-para-js, delegua-para-javascript, delegua-para-py, delegua-para-python, delegua-para-ruby, delegua-para-x64, js-para-delegua, javascript-para-delegua, alg-para-delegua, visualg-para-delegua. Exemplo: `delegua-para-js`.',
        )
        .option(
            '-v, --versao',
            'Imprime o número da versão atual de Delégua',
            false
        )
        .argument('[arquivos...]', 'Nomes dos arquivos (opcional)')
        .action((argumentos) => {
            if (argumentos.length > 0) {
                codigoOuNomeArquivo = argumentos[0];
            }
        });

    analisadorArgumentos
        .command('testar')
        .description('Descobre e executa recursivamente arquivos .teste.delegua no diretório atual.')
        .action(() => {
            comandoTestar = true;
        });

    analisadorArgumentos.parse();
    const opcoes = analisadorArgumentos.opts();

    const indiceSeparador = process.argv.indexOf('--');
    const argumentosPrograma = indiceSeparador !== -1 ? process.argv.slice(indiceSeparador + 1) : [];

    if (comandoTestar) {
        const { executarTestes } = require('./nucleo-testes');
        await executarTestes(process.cwd());
        return;
    }

    if (opcoes.dap) {
        const adaptadorDap = new AdaptadorDapDelegua();
        adaptadorDap.iniciar();
        return;
    }

    const delegua = new Delegua();
    const usarDepuradorPadrao = opcoes.depuradorPadrao || opcoes.depurador;
    if (opcoes.versao) {
        console.log(delegua.versao());
        return;
    }

    if (opcoes.codigo) {
        return await delegua.executarCodigoComoArgumento(
            opcoes.codigo || codigoOuNomeArquivo,
            opcoes.dialeto,
            opcoes.performance,
            usarDepuradorPadrao,
            argumentosPrograma
        );
    } else if (codigoOuNomeArquivo) {
        // Se o dialeto não foi definido explicitamente pelo usuário, tenta inferir pela extensão do arquivo.
        let dialeto = opcoes.dialeto;
        if (analisadorArgumentos.getOptionValueSource('dialeto') === 'default') {
            dialeto = inferirDialetoPorExtensao(codigoOuNomeArquivo) ?? opcoes.dialeto;
        }

        if (opcoes.traduzir) {
            try {
                await delegua.traduzirArquivo(codigoOuNomeArquivo, opcoes.traduzir, opcoes.alvo, opcoes.saida);
            } catch (erro: any) {
                console.error(`Erro: ${erro.message}`);
                process.exit(1);
            }
        } else {
            if (codigoOuNomeArquivo === '-') {
                let codigo = '';
                for await (const chunk of process.stdin) {
                    codigo += chunk;
                }
                return await delegua.executarCodigoComoArgumento(
                    codigo,
                    dialeto,
                    opcoes.performance,
                    usarDepuradorPadrao,
                    argumentosPrograma
                );
            }

            await delegua.executarCodigoPorArquivo(
                codigoOuNomeArquivo,
                dialeto,
                opcoes.performance,
                usarDepuradorPadrao,
                argumentosPrograma
            );
        }
    } else {
        delegua.iniciarLair(opcoes.dialeto || 'delegua');
    }
};

export { principal };

if (require.main === module) {
    principal();
}
