# Elementos de depuração remota

O `delegua-node` oferece dois modos de depuração:

| Característica        | Depurador Padrão (`--depurador-padrao`) | Adaptador DAP (`--dap`)         |
|-----------------------|-----------------------------------------|---------------------------------|
| Protocolo             | Texto simples por TCP socket            | Debug Adapter Protocol (stdio)  |
| Transporte            | Socket TCP (porta 7777)                 | stdio (stdin/stdout)            |
| Clientes suportados   | Netcat, extensão delegua-vscode legada  | VS Code, Code::Blocks, qualquer cliente DAP |
| Comandos              | Texto livre (ex.: `continuar`, `proximo`) | JSON-RPC com `Content-Length`  |
| Integração com IDEs   | Requer cliente customizado              | Padrão Microsoft DAP            |

---

## Depurador Padrão (socket TCP)

O depurador padrão abre um servidor TCP na porta 7777. O cliente envia comandos em texto simples e recebe respostas delimitadas por marcadores.

### Iniciando

```sh
delegua --depurador-padrao arquivo.delegua
```

Ou, de forma equivalente, usando a flag `-D`:

```sh
delegua -D arquivo.delegua
```

### Conectando um cliente

Qualquer cliente TCP pode ser usado. A forma mais simples é com o `nc` (Netcat):

```sh
nc localhost 7777
```

Para desenvolvimento em Windows, o Netcat pode ser instalado via [Cygwin](http://ptcomputador.com/Sistemas/windows/228426.html) ou [Nmap](https://nmap.org/download#windows).

### Comandos disponíveis

O depurador padrão existe também para fins didáticos: cada comando abaixo tem um equivalente direto
no Adaptador DAP (seção seguinte), só que expresso em texto simples por TCP em vez de JSON-RPC. A
tabela ["Comando padrão × DAP"](#comando-padrão--dap) no fim desta seção traz o mapeamento completo.

-   `adentrar-escopo`: _Step Into_. Adentra o bloco de escopo da instrução atual, se houver;
-   `adicionar-ponto-parada <arquivo> <linha>`: adiciona um ponto de parada no arquivo e linha indicados;
-   `avaliar <código>`: avalia um trecho de código Delégua no contexto atual;
-   `avaliar-variavel <nome>`: retorna o valor e tipo de uma variável pelo nome;
-   `capacidades`: descreve a sessão atual (versão do `delegua`, dialeto e lista de comandos suportados);
-   `continuar`: retoma a execução até o próximo ponto de parada ou o fim do programa;
-   `definir-pontos-parada <arquivo> <l1,l2,...>`: substitui, numa única chamada, todos os pontos de parada do arquivo indicado;
-   `encerrar-sessao`: finaliza a depuração do programa em execução e avisa todos os clientes conectados;
-   `escopos <frameId>`: retorna a referência de variáveis (`variablesReference`) de um quadro obtido via `pilha-execucao`;
-   `pilha-execucao`: exibe a pilha de execução atual, agora com um `frameId` ao fim de cada linha;
-   `pontos-parada`: lista todos os pontos de parada ativos;
-   `proximo`: executa a instrução atual e para na próxima (_Step Over_);
-   `reiniciar <arquivo>`: carrega e prepara um novo arquivo para depuração, sem reiniciar o processo;
-   `remover-ponto-parada <arquivo> <linha>`: remove um ponto de parada específico;
-   `sair-escopo`: _Step Out_. Executa o restante do escopo atual e retorna ao escopo anterior;
-   `tchau`: encerra a conexão atual (a sessão de depuração continua ativa para outros clientes);
-   `linhas-execucao`: lista as linhas de execução disponíveis (sempre uma: a linha de execução principal);
-   `variaveis`: lista todas as variáveis no escopo atual (atalho plano, sem referências);
-   `variaveis-referencia <variablesReference>`: lista as variáveis de uma referência obtida via `escopos`, permitindo navegar em objetos e vetores aninhados.

**Exemplo de uso de `adicionar-ponto-parada`:**

```
adicionar-ponto-parada ./exemplos/importacao/dinamica/importacao-2.egua 5
remover-ponto-parada ./exemplos/importacao/dinamica/importacao-2.egua 5
```

**Exemplo de navegação por escopos/variáveis (drill-down):**

```
pilha-execucao
--- pilha-execucao-resposta ---
calcular(); --- D:\delegua\testes\index.delegua::<principal>::7::1
--- fim-pilha-execucao-resposta ---

escopos 1
--- escopos-resposta ---
Locais :: 1
--- fim-escopos-resposta ---

variaveis-referencia 1
--- variaveis-referencia-resposta ---
x :: Número :: 10 :: 0
y :: Número :: 20 :: 0
--- fim-variaveis-referencia-resposta ---
```

### Eventos assíncronos

Além de respostas a comandos, o servidor envia eventos a todos os clientes conectados sem que
precisem perguntar — equivalentes aos eventos `stopped`/`continued`/`terminated` do DAP:

```
--- evento: parado ---
motivo:breakpoint
arquivo:D:\delegua\testes\index.delegua::linha:5
--- fim-evento ---
```

-   `continuado`: emitido assim que `continuar`/`proximo`/`adentrar-escopo`/`sair-escopo` retomam a execução;
-   `parado`: emitido quando a execução para num ponto de parada (`motivo:breakpoint`) ou após um passo (`motivo:proximo`), com o arquivo e a linha atuais;
-   `encerrado`: emitido quando o programa roda até o fim sem mais paradas, ou após `encerrar-sessao`.

### Formato das respostas

Cada resposta é delimitada por marcadores de início e fim. Exemplo do comando `pilha-execucao`:

```
Recebido comando 'pilha-execucao'
--- pilha-execucao-resposta ---
escreva('testando'); --- D:\delegua\testes\index.delegua::<principal>::1::1
--- fim-pilha-execucao-resposta ---
```

Formato de cada linha da pilha:

```
instrução --- caminho-do-arquivo::assinatura-do-método::número-da-linha::frameId
```

> **Nota:** o comando `avaliar` possui um problema de condição de corrida e não é recomendado. Use `avaliar-variavel` para consultar valores.

### Comando padrão × DAP

| Comando padrão                | Requisição/evento DAP equivalente |
|--------------------------------|------------------------------------|
| `capacidades`                  | `initialize`                       |
| `reiniciar`                    | `launch`                           |
| `definir-pontos-parada`        | `setBreakpoints`                   |
| `linhas-execucao`               | `threads`                          |
| `pilha-execucao` (com `frameId`) | `stackTrace`                     |
| `escopos`                      | `scopes`                           |
| `variaveis-referencia`         | `variables`                        |
| `continuar`                    | `continue`                         |
| `proximo`                      | `next`                             |
| `adentrar-escopo`              | `stepIn`                           |
| `sair-escopo`                  | `stepOut`                          |
| evento `continuado`            | evento `continued`                 |
| evento `parado`                | evento `stopped`                   |
| evento `encerrado`             | eventos `terminated`/`exited`      |
| `encerrar-sessao`              | `disconnect`                       |

---

## Adaptador DAP (stdio)

O adaptador DAP implementa o [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/) da Microsoft. Qualquer IDE ou editor que suporte DAP pode depurar programas Delégua sem cliente customizado.

### Iniciando

```sh
delegua --dap
```

O processo lê requisições de `stdin` e escreve respostas em `stdout` no formato JSON-RPC com cabeçalho `Content-Length`.

### Clientes compatíveis

-   **VS Code**: via `launch.json` com `"type": "delegua"` e `"request": "launch"` (requer extensão que delegue ao adaptador);
-   **Code::Blocks**: via integração DAP (repositório `DesignLiquido/codeblocks`);
-   Qualquer cliente que implemente o protocolo DAP.

### Fluxo de handshake

```
Cliente → initialize       → Adaptador responde com capabilities + evento initialized
Cliente → launch           → Adaptador carrega o programa
Cliente → setBreakpoints   → Adaptador valida e registra pontos de parada
Cliente → configurationDone → Adaptador inicia execução; emite stopped ao atingir breakpoint
```

### Comandos suportados (MVP)

| Comando DAP        | Descrição                                              |
|--------------------|--------------------------------------------------------|
| `initialize`       | Handshake inicial; retorna capabilities                |
| `launch`           | Carrega o programa (argumento `program`) e dialeto     |
| `setBreakpoints`   | Define pontos de parada por arquivo e linha            |
| `configurationDone`| Inicia execução até o primeiro ponto de parada         |
| `threads`          | Retorna a lista de threads (sempre uma: thread 1)      |
| `stackTrace`       | Retorna a pilha de execução do frame atual             |
| `scopes`           | Retorna os escopos de um frame                         |
| `variables`        | Retorna as variáveis de um escopo                      |
| `continue`         | Retoma execução até o próximo ponto de parada          |
| `next`             | Executa a instrução atual (_Step Over_)                |
| `stepIn`           | Adentra o escopo da instrução atual (_Step Into_)      |
| `stepOut`          | Sai do escopo atual (_Step Out_)                       |
| `disconnect`       | Encerra a sessão e emite `terminated` + `exited`       |

### Argumentos de `launch`

| Argumento  | Tipo     | Obrigatório | Descrição                                      |
|------------|----------|-------------|------------------------------------------------|
| `program`  | `string` | Sim         | Caminho absoluto ou relativo do arquivo fonte  |
| `dialeto`  | `string` | Não         | Dialeto a usar. Padrão: `delegua`              |

### Exemplo de configuração (VS Code `launch.json`)

```json
{
    "type": "delegua",
    "request": "launch",
    "name": "Depurar arquivo Delégua",
    "program": "${file}",
    "dialeto": "delegua"
}
```

### Depurando o adaptador DAP

Para inspecionar mensagens trocadas entre cliente e adaptador, redirecione `stderr` para um arquivo de log — o adaptador escreve erros e avisos apenas em `stderr`, mantendo `stdout` exclusivo para mensagens DAP:

```sh
delegua --dap 2>dap.log
```
