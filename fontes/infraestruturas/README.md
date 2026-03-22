# Infraestruturas — `delegua-node`

Este diretório contém infraestruturas de suporte ao interpretador que dependem do ambiente Node.js e não podem residir no núcleo de Delégua.

---

## `invocacao-electron/`

### `InfraestruturaInvocacaoElectron`

Implementa `InfraestruturaGraficaInterface` para uso em linha de comando (Node.js puro). Quando o programa Delégua usa `importar("interfaceGrafica")` fora de um processo com DOM ou de uma extensão VS Code, esta infraestrutura spawna um processo Electron filho para renderizar a janela.

**Quando é selecionada:** prioridade 3 na cadeia de seleção de infraestrutura de `carregarBibliotecaInterfaceGrafica` — após `InfraestruturaWebView` (VS Code) e `InfraestruturaElectron` (renderer), antes de `InfraestruturaVazia` (fallback).

**Pré-requisito:** o pacote `electron` precisa estar instalado local ou globalmente (`npm install -g electron`).

#### Inicialização

O construtor recebe o caminho absoluto do binário Electron e, ao ser instanciado:

1. Cria um diretório temporário com `fs.mkdtempSync` (padrão `delegua-gui-XXXXXX` em `os.tmpdir()`).
2. Grava nesse diretório três arquivos embutidos como strings literais no próprio módulo TypeScript:
   - `electron-main.js` — processo principal do Electron (`ELECTRON_MAIN_JS`)
   - `preload.js` — script de preload com `contextBridge` (`PRELOAD_JS`)
   - `renderer.html` — página HTML do renderer (`RENDERER_HTML`)
3. Cria um servidor TCP local em `127.0.0.1` com porta aleatória (`servidor.listen(0, ...)`).
4. Spawna o binário Electron com `stdio: ['ignore', 'ignore', 'pipe']`, passando o número da porta como `process.argv[3]`.
5. Aguarda que o Electron se conecte de volta ao servidor TCP.
6. Ao receber a conexão, cria um `readline.Interface` sobre o socket para receber mensagens JSON.

> **Por que TCP em vez de stdin/stdout?** O Chromium (motor do Electron) consome o fd 0 (stdin) durante a inicialização no Windows antes que `app.whenReady()` seja chamado. Qualquer dado escrito no pipe de stdin antes desse ponto é descartado, tornando stdin/stdout inviável para IPC com Electron no Windows.

#### Protocolo de comunicação

A comunicação usa mensagens JSON delimitadas por `\n` sobre um socket TCP local — o mesmo formato do protocolo de `InfraestruturaWebView`, porém transportado via TCP.

**Node.js → Electron (socket):**

| `tipo`               | Campos adicionais                              | Descrição                          |
|----------------------|------------------------------------------------|------------------------------------|
| `criar-janela`       | `id`, `largura`, `altura`, `titulo`            | Cria e exibe a `BrowserWindow`.    |
| `criar-botao`        | `id`, `paiId`, `rotulo`                        | Adiciona um `<button>` ao pai.     |
| `criar-rotulo`       | `id`, `paiId`, `texto`                         | Adiciona um `<label>` ao pai.      |
| `criar-caixa-texto`  | `id`, `paiId`, `textoInicial`                  | Adiciona um `<input>` ao pai.      |
| `criar-caixa-vertical`   | `id`, `paiId`                              | Adiciona um `<div>` em coluna.     |
| `criar-caixa-horizontal` | `id`, `paiId`                              | Adiciona um `<div>` em linha.      |
| `definir-texto`      | `id`, `texto`                                  | Atualiza o texto de um componente. |
| `encerrar`           | —                                              | Limpa o DOM e fecha a janela.      |

**Electron → Node.js (socket):**

| `tipo`             | Campos adicionais               | Descrição                                   |
|--------------------|---------------------------------|---------------------------------------------|
| `evento`           | `componenteId`, `evento`, `valor?` | Disparo de evento de interação (clique, alterado). |
| `valor-atualizado` | `id`, `valor`                   | Novo valor de uma caixa de texto (digitação em tempo real). |
| `fechado`          | —                               | Usuário fechou a janela pelo botão do SO.   |

#### Ciclo de vida da janela

O `electron-main.js` usa `show: false` ao criar a `BrowserWindow` e só chama `mainWindow.show()` + `mainWindow.focus()` após o evento `did-finish-load`. Isso garante que a janela apareça apenas quando o conteúdo estiver pronto e evita que ela abra em segundo plano.

Quando o usuário fecha a janela pelo botão nativo do SO, o processo principal envia `{ tipo: 'fechado' }` pelo socket, o que resolve a Promise de `iniciarLaco()` no lado Node.js.

#### `localizarElectron()`

Função utilitária exportada que retorna o caminho absoluto do binário Electron ou `null` se não estiver instalado.

Ordem de busca:
1. Dependência local (`require('electron')` — resolve normalmente pelo algoritmo Node.js).
2. Instalação global do npm: lê `npm root -g` e usa `resolverBinarioDoIndexJs` com o diretório `electron/` dentro da raiz global.
3. Instalação global via pacote `delegua`: tenta `delegua/node_modules/electron/` dentro da raiz global.

`resolverBinarioDoIndexJs` faz `require(diretorio/index.js)`, o que é mais confiável do que ler `path.txt` manualmente, pois o próprio `index.js` do pacote Electron já resolve a subpasta correta (`dist/`) em todas as plataformas.
