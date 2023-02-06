# delegua-node

Versão de Delégua com suporte a importação de pacotes pelo ecossistema do Node.js.

## Motivação

Em versões anteriores, o suporte ao ecossistema Node vinha embutido no pacote. Isso virou um problema quando tentamos importar o pacote numa aplicação com Webpack. 

Como o Webpack tenta ler tudo, independente se estamos importando um módulo ou vários, há problemas quando tentamos importar `node:child_process` na parte de navegador de internet. 