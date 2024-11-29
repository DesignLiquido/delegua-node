# delegua-node

Versão de Delégua com suporte a funcionalidades do ecossistema do Node.js. Também funciona com o [Bun](https://bun.sh/).

<p align="center">
    <a href="https://github.com/DesignLiquido/delegua-node/issues" target="_blank">
        <img src="https://img.shields.io/github/issues/Designliquido/delegua-node" />
    </a>
    <img src="https://img.shields.io/github/stars/Designliquido/delegua-node" />
    <img src="https://img.shields.io/github/forks/Designliquido/delegua-node" />
    <a href="https://www.npmjs.com/package/@designliquido/delegua-node" target="_blank">
        <img src="https://img.shields.io/npm/v/@designliquido/delegua-node" />
    </a>
    <img src="https://img.shields.io/npm/dw/@designliquido/delegua-node" />
    <img src="https://img.shields.io/github/license/Designliquido/delegua-node" />
</p>

## Motivação

Em versões anteriores, o suporte ao ecossistema Node vinha embutido no pacote do núcleo da linguagem. Isso virou um problema quando tentamos importar o pacote numa aplicação com [Webpack](https://webpack.js.org/). 

Como o Webpack tenta ler todas as referências de todos os módulos recursivamente, independente se estamos importando um módulo ou vários, há problemas quando tentamos importar `child_process` ou `net` na parte de navegador de internet e as aplicações falham.

Mais adiante, este pacote ganhou a função de concentrar todos os dialetos em um único lugar, já que implementa a funcionalidade de execução de código por linha de comando.

### Implicações

Se sua aplicação:

- Precisa suportar importações, seja de outros fontes, seja de bibliotecas NPM
- Executa código Delégua, ou outros dialetos, remotamente
- Deve executar no ambiente Node.js ou Bun, ou qualquer outro motor de JavaScript fora do navegador de internet

Ela deve, então, usar este pacote. Caso contrário, o uso apenas do [núcleo de Delégua](https://github.com/DesignLiquido/delegua), ou pacote de dialeto, é uma escolha melhor.

## Instalação

Se quiser instalar no seu computador,
[você deve ter antes o Node.js instalado em seu ambiente](https://dicasdejavascript.com.br/instalacao-do-nodejs-e-npm-no-windows-passo-a-passo).

Com o Node.js instalado, execute o seguinte comando em um _prompt_ de comando (Terminal, PowerShell ou `cmd` no Windows, Terminal ou `sh` em Mac e Linux):

```
npm install -g @designliquido/delegua-node
```

No entanto, este pacote por si só não contém as bibliotecas que fazem parte do ecossistema de Delégua, como `delegua-matematica`, `delegua-http` e outras. Para instalar [a solução completa, com todas essas bibliotecas](https://github.com/DesignLiquido/delegua-completo), utilize o comando:

```
npm install -g delegua
```

A implementação do [Modo LAIR (Leia-Avalie-Imprima-Repita)] fica neste pacote, mas o recomendado é a utilização da solução completa, ao invés deste pacote puro.
