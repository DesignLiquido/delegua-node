# Bibliotecas

Aqui são implementadas as bibliotecas de Delégua e diferentes dialetos que possuem dependência com o Node.js. As demais bibliotecas com essa dependência normalmente são implementadas nos respectivos repositórios dos dialetos.
## Módulos embutidos de recursos do sistema operacional

Implementados diretamente no `delegua-node` (não são pacotes npm) e importados pelo nome. Têm a mesma interface dos módulos homônimos do [`delegua-llvm`](https://github.com/DesignLiquido/delegua-llvm), para que o mesmo programa funcione nas duas realizações.

| Módulo | Arquivo | Conteúdo |
|---|---|---|
| `argumentos` | `argumentos.ts` | Argumentos da linha de comando |
| `processo` | `processo.ts` | `sair`, `escreverErro`, `sistemaOperacional`, `arquitetura`, `variavelAmbiente`, `definirVariavelAmbiente`, `executar`, `executarCapturando`, `ultimoCodigoSaida` |
| `rede` | `rede.ts` | Soquetes TCP com tempo limite: `escutar`, `portaLocal`, `aceitar`, `conectar`, `ler`, `lerAte`, `escrever`, `escreverArquivo`, `fechar`, `ultimoErro`, `codificarComponenteUrl`, `decodificarComponenteUrl` |
| `memoria` | `memoria.ts` | Memória bruta para FFI (koffi): `alocar`, `liberar`, `ler*`/`escrever*` em deslocamento, `textoDe`, `deslocar`, `copiar`, `tamanhoPonteiro` |

Observações:

- `processo.executar` não passa por um shell. No Windows, `executar("npm", ...)` encontra `npm.cmd` no `PATH`; arquivos de lote são executados pelo `cmd.exe`, e argumentos com `%`, `"` ou quebras de linha são recusados, porque o `cmd.exe` os interpretaria.
- `rede`: soquetes são valores opacos; `nulo` indica falha, com o motivo em `ultimoErro()`. Tempos limite em milissegundos (negativo: sem limite). `lerAte` devolve até o delimitador (inclusive) e guarda o restante para a próxima leitura.
- `memoria`: ponteiros são os endereços do koffi e podem ser passados a funções de `classe estrangeira` com parâmetros do tipo `ponteiro`.
