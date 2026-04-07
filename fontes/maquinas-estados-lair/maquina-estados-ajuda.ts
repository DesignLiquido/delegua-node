import * as readline from "readline";
import chalk from "chalk";
import { listarTopicos as listarTopicosAjuda } from "../interpretador/conteudo-ajuda";
import { aplicarRealceSintaxe } from "../interpretador/realcador-sintaxe-ajuda";

/**
 * Máquina de estados para o modo de ajuda interativo.
 * Similar ao sistema help() do Python, permite consultas interativas
 * sobre funções, palavras-chave e outros elementos da linguagem.
 *
 * Reutiliza a interface readline existente do REPL, apenas modificando
 * o prompt e os manipuladores de eventos.
 */
export class MaquinaEstadosAjuda {
    interfaceLeitura: readline.Interface;
    funcaoDeRetorno: Function;
    obterAjudaTopico: (topico: string) => string | null;
    funcaoSaida: () => void;

    constructor(
        interfaceLeitura: readline.Interface,
        funcaoDeRetorno: Function,
        obterAjudaTopico: (topico: string) => string | null,
        funcaoSaida: () => void
    ) {
        this.interfaceLeitura = interfaceLeitura;
        this.funcaoDeRetorno = funcaoDeRetorno;
        this.obterAjudaTopico = obterAjudaTopico;
        this.funcaoSaida = funcaoSaida;
    }

    /**
     * Normaliza uma string removendo acentos e convertendo para minúsculas.
     * Permite que comandos funcionem com ou sem acentos.
     */
    private normalizarTexto(texto: string): string {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Exibe a mensagem de boas-vindas ao modo de ajuda.
     */
    exibirMensagemBoasVindas(): void {
        const mensagem = `
${chalk.bold.cyan('═══════════════════════════════════════════════════════════════')}
${chalk.bold('Bem-vindo ao sistema de ajuda de Delégua!')}
${chalk.bold.cyan('═══════════════════════════════════════════════════════════════')}

Este é um utilitário de ajuda interativo.

Digite o nome de qualquer ${chalk.yellow('função')}, ${chalk.yellow('palavra-chave')} ou ${chalk.yellow('tópico')}
para obter ajuda sobre esse item.

${chalk.bold('Comandos disponíveis:')}
  ${chalk.green('tópicos')} ou ${chalk.green('topicos')} - Lista todos os tópicos disponíveis
  ${chalk.green('sair')}                  - Sai do modo de ajuda
  ${chalk.green('<tecla Enter>')}         - Exibe esta mensagem novamente

${chalk.dim('Exemplo: digite "escreva" para ver a ajuda sobre a função escreva()')}
`;
        this.funcaoDeRetorno(mensagem);
    }

    /**
     * Lista todos os tópicos de ajuda disponíveis.
     */
    listarTopicos(): void {
        const todosTopicos = listarTopicosAjuda();

        // Agrupa os tópicos por categoria
        const categorias = {
            'Entrada/Saída': ['escreva', 'leia'],
            'Conversão de Tipos': ['numero', 'número', 'inteiro', 'real', 'texto'],
            'Aleatoriedade': ['aleatorio', 'aleatório', 'aleatorioEntre'],
            'Funções de Vetor': ['mapear', 'filtrarPor', 'ordenar', 'paraCada', 'tamanho',
                                  'todosEmCondicao', 'encontrar', 'clonar', 'tupla'],
            'Palavras-Chave': ['var', 'const', 'se', 'senao', 'para', 'enquanto', 'fazer',
                               'funcao', 'retorna', 'verdadeiro', 'falso', 'nulo']
        };

        let mensagem = `\n${chalk.bold('Tópicos de Ajuda Disponíveis:')}\n`;

        for (const [categoria, topicos] of Object.entries(categorias)) {
            mensagem += `\n${chalk.yellow(categoria + ':')}`;

            // Filtra apenas os tópicos que existem na documentação
            const topicosDisponiveis = topicos.filter(t => todosTopicos.includes(t));

            if (topicosDisponiveis.length > 0) {
                mensagem += '\n  ' + topicosDisponiveis.join(', ');
            }
        }

        mensagem += `\n\n${chalk.dim('Digite o nome de qualquer tópico para ver mais informações.')}\n`;

        this.funcaoDeRetorno(mensagem);
    }

    /**
     * Processa a entrada do usuário no modo de ajuda.
     */
    processarEntrada(linha: string): void {
        const entrada = linha.trim();

        // Entrada vazia - exibe mensagem de boas-vindas
        if (!entrada) {
            this.exibirMensagemBoasVindas();
            this.interfaceLeitura.prompt();
            return;
        }

        // Normaliza a entrada para comparação (remove acentos)
        const entradaNormalizada = this.normalizarTexto(entrada);

        // Comandos especiais (apenas em português)
        switch (entradaNormalizada) {
            case 'sair':
                this.sair();
                return;

            case 'topicos':
                this.listarTopicos();
                this.interfaceLeitura.prompt();
                return;
        }

        // Buscar ajuda para o tópico
        try {
            const ajuda = this.obterAjudaTopico(entrada);
            if (ajuda) {
                // Aplica realce de sintaxe aos exemplos de código
                const ajudaComRealce = aplicarRealceSintaxe(ajuda);
                this.funcaoDeRetorno(ajudaComRealce);
            } else {
                this.funcaoDeRetorno(
                    chalk.red(`Nenhuma ajuda disponível para "${entrada}".`) + '\n' +
                    chalk.dim(`Digite ${chalk.green('tópicos')} para ver os tópicos disponíveis.`)
                );
            }
        } catch (erro) {
            this.funcaoDeRetorno(
                chalk.red(`Erro ao buscar ajuda: ${erro}`)
            );
        }

        this.interfaceLeitura.prompt();
    }

    /**
     * Inicia o modo de ajuda interativo.
     * Remove os listeners anteriores e adiciona os do modo de ajuda.
     */
    iniciar(): void {
        // Remove todos os listeners anteriores
        this.interfaceLeitura.removeAllListeners('line');

        // Adiciona o listener do modo de ajuda
        this.interfaceLeitura.on('line', (linha: string) => {
            this.processarEntrada(linha);
        });

        // Muda o prompt para o modo de ajuda
        this.interfaceLeitura.setPrompt(chalk.cyan('\najuda> '));

        // Exibe mensagem de boas-vindas
        this.exibirMensagemBoasVindas();
        this.interfaceLeitura.prompt();
    }

    /**
     * Sai do modo de ajuda e retorna ao REPL.
     */
    sair(): void {
        this.funcaoDeRetorno(
            chalk.dim('\nSaindo do modo de ajuda...\n')
        );

        // Remove o listener do modo de ajuda
        this.interfaceLeitura.removeAllListeners('line');

        // Chama a função de saída que restaurará o REPL
        this.funcaoSaida();
    }
}
