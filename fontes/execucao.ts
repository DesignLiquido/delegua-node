import { Command } from 'commander';

import { Delegua } from './delegua';
import { AdaptadorDapDelegua } from './depuracao';

const principal = async () => {
    const analisadorArgumentos = new Command();
    analisadorArgumentos;
    let codigoOuNomeArquivo: string | undefined = undefined;

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
            '--depurador-legado',
            'Habilita explicitamente o depurador legado por socket.',
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

    analisadorArgumentos.parse();
    const opcoes = analisadorArgumentos.opts();

    if (opcoes.dap) {
        const adaptadorDap = new AdaptadorDapDelegua();
        adaptadorDap.iniciar();
        return;
    }

    const delegua = new Delegua();
    const usarDepuradorLegado = opcoes.depuradorLegado || opcoes.depurador;
    if (opcoes.versao) {
        console.log(delegua.versao());
        return;
    }

    if (opcoes.codigo) {
        return await delegua.executarCodigoComoArgumento(
            opcoes.codigo || codigoOuNomeArquivo,
            opcoes.dialeto,
            opcoes.performance,
            usarDepuradorLegado
        );
    } else if (codigoOuNomeArquivo) {
        if (opcoes.traduzir) {
            await delegua.traduzirArquivo(codigoOuNomeArquivo, opcoes.traduzir, opcoes.alvo, opcoes.saida);
        } else {
            if (codigoOuNomeArquivo === '-') {
                let codigo = '';
                for await (const chunk of process.stdin) {
                    codigo += chunk;
                }
                return await delegua.executarCodigoComoArgumento(
                    codigo,
                    opcoes.dialeto,
                    opcoes.performance,
                    usarDepuradorLegado
                );
            }

            await delegua.executarCodigoPorArquivo(
                codigoOuNomeArquivo,
                opcoes.dialeto,
                opcoes.performance,
                usarDepuradorLegado
            );
        }
    } else {
        delegua.iniciarLair(opcoes.dialeto || 'delegua');
    }
};

principal();
