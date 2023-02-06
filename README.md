# delegua-node

Versão de Delégua com suporte a importação de pacotes pelo ecossistema do Node.js.

## Motivação

Em versões anteriores, o suporte ao ecossistema Node vinha embutido no pacote do núcleo da linguagem. Isso virou um problema quando tentamos importar o pacote numa aplicação com [Webpack](https://webpack.js.org/). 

Como o Webpack tenta ler todas as referências de todos os módulos recursivamente, independente se estamos importando um módulo ou vários, há problemas quando tentamos importar `node:child_process` na parte de navegador de internet e as aplicações falham.

## Instalação

Se quiser instalar no seu computador,
[você deve ter antes o Node.js instalado em seu ambiente](https://dicasdejavascript.com.br/instalacao-do-nodejs-e-npm-no-windows-passo-a-passo).

Com o Node.js instalado, execute o seguinte comando em um _prompt_ de comando (Terminal, PowerShell ou `cmd` no Windows, Terminal ou `sh` em Mac e Linux):

```
npm install -g delegua
```

### Usando como LAIR (Leia-Avalie-Imprima-Repita) em console

Feita a instalação no seu ambiente, execute o seguinte comando:

```
delegua
```

Você terá um interpretador Delégua que avalia expressões linha a linha.

Um exemplo de uso é como uma calculadora:

```js
delegua> 2 + 2
4

delegua> 2 * 3
6

delegua> 2 ** 10
1024
```

Para finalizar a execução do interpretador LAIR Delégua, use o atalho <key>Ctrl</key> + <key>C</key> (todos os sistemas operacionais).

### Executando arquivos

É possível usar o interpretador com outros dialetos, como Égua.

```
delegua --dialeto egua
```

[Veja aqui todos os dialetos suportados](https://github.com/DesignLiquido/delegua/wiki/Dialetos).

Se não quiser instalar as bibliotecas que acompanham Delégua, apenas [o núcleo da linguagem](https://github.com/DesignLiquido/delegua) pode ser instalado:

```
npm install -g @designliquido/delegua
```

## Tradução para outras linguagens

Delégua traduz para JavaScript e vice-versa. [Mais informações aqui](https://github.com/DesignLiquido/delegua/wiki/Tradu%C3%A7%C3%A3o-para-outras-linguagens). 
