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

-   `adentrar-escopo`: _Step Into_. Adentra o bloco de escopo da instrução atual, se houver;
-   `adicionar-ponto-parada <arquivo> <linha>`: adiciona um ponto de parada no arquivo e linha indicados;
-   `avaliar <código>`: avalia um trecho de código Delégua no contexto atual;
-   `avaliar-variavel <nome>`: retorna o valor e tipo de uma variável pelo nome;
-   `continuar`: retoma a execução até o próximo ponto de parada ou o fim do programa;
-   `pilha-execucao`: exibe a pilha de execução atual;
-   `pontos-parada`: lista todos os pontos de parada ativos;
-   `proximo`: executa a instrução atual e para na próxima (_Step Over_);
-   `remover-ponto-parada <arquivo> <linha>`: remove um ponto de parada específico;
-   `sair-escopo`: _Step Out_. Executa o restante do escopo atual e retorna ao escopo anterior;
-   `tchau`: encerra a conexão;
-   `variaveis`: lista todas as variáveis no escopo atual.

**Exemplo de uso de `adicionar-ponto-parada`:**

```
adicionar-ponto-parada ./exemplos/importacao/dinamica/importacao-2.egua 5
remover-ponto-parada ./exemplos/importacao/dinamica/importacao-2.egua 5
```

### Formato das respostas

Cada resposta é delimitada por marcadores de início e fim. Exemplo do comando `pilha-execucao`:

```
Recebido comando 'pilha-execucao'
--- pilha-execucao-resposta ---
escreva('testando'); --- D:\delegua\testes\index.delegua::<principal>::1
--- fim-pilha-execucao-resposta ---
```

Formato de cada linha da pilha:

```
instrução --- caminho-do-arquivo::assinatura-do-método::número-da-linha
```

> **Nota:** o comando `avaliar` possui um problema de condição de corrida e não é recomendado. Use `avaliar-variavel` para consultar valores.

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
