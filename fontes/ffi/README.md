# Interface de Funcionalidade Estrangeira (FFI)

Funcionalidade de Delégua para mapear bibliotecas de outras linguagens de programação para uso com Delégua. O foco inicial é a interoperabilidade com bibliotecas C, mas a arquitetura deve ser flexível o suficiente para suportar outros runtimes (Deno, browser, etc.) no futuro.

Parte da funcionalidade é implementada neste repositório `delegua-node`, que é o runtime Node.js. Aqui é onde a integração com [`koffi`](https://koffi.dev/) acontece, e onde as bibliotecas compartilhadas são carregadas do sistema de arquivos. Determinados ambientes de execução (como o navegador de internet) podem exigir uma implementação diferente, mas a ideia é manter a mesma interface de alto nível para o código Delégua.

Há também uma parte da implementação em [`delegua-llvm`](https://github.com/delegua/delegua-llvm) para garantir que o compilador e o interpretador compartilhem a mesma convenção de tipos C.