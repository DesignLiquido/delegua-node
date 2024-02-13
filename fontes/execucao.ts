import { Delegua } from './delegua';
import { Command } from 'commander';

const principal = async () => {
    const analisadorArgumentos = new Command();
    analisadorArgumentos;
    let codigoOuNomeArquivo: string | undefined = undefined;

    analisadorArgumentos
        .helpOption('-h, --ajuda', 'Exibe a ajuda para o comando.')
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
            'Traduz o código do arquivo passado como parâmetro de arquivo. O argumento deve ser no formato linguagem-para-linguagem, como por exemplo `delegua-para-js`.',
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

    const delegua = new Delegua();
    if (opcoes.versao) {
        console.log(delegua.versao());
        return;
    }

    if (opcoes.codigo) {
        return await delegua.executarCodigoComoArgumento(
            opcoes.codigo || codigoOuNomeArquivo,
            opcoes.dialeto,
            Boolean(opcoes.performance)
        );
    } else {
        if (codigoOuNomeArquivo) {
            if (opcoes.traduzir) {
                delegua.traduzirArquivo(codigoOuNomeArquivo, opcoes.traduzir, opcoes.saida);
            } else {
                await delegua.executarCodigoPorArquivo(codigoOuNomeArquivo, opcoes.dialeto);
            }
        } else {
            delegua.iniciarLair();
        }
    }   
};

principal();
