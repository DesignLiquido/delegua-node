# Interface de Funcionalidade Estrangeira (FFI)

Funcionalidade de Delégua para mapear bibliotecas de outras linguagens de programação para uso com Delégua. O foco inicial é a interoperabilidade com bibliotecas C, mas a arquitetura deve ser flexível o suficiente para suportar outros runtimes (Deno, browser, etc.) no futuro.

Parte da funcionalidade é implementada neste repositório `delegua-node`, que é o runtime Node.js. Aqui é onde a integração com [`koffi`](https://koffi.dev/) acontece, e onde as bibliotecas compartilhadas são carregadas do sistema de arquivos. Determinados ambientes de execução (como o navegador de internet) podem exigir uma implementação diferente, mas a ideia é manter a mesma interface de alto nível para o código Delégua.

Há também uma parte da implementação em [`delegua-llvm`](https://github.com/delegua/delegua-llvm) para garantir que o compilador e o interpretador compartilhem a mesma convenção de tipos C.

## Exemplo de uso

```delegua
// Exemplo de Interface de Funcionalidade Estrangeira (FFI)
// Demonstra como chamar funções da biblioteca matemática C (libm) a partir de Delégua.
// Em Linux/macOS, o sistema carrega libm.so / libm.dylib.
// Em Windows, as funções de libm fazem parte do runtime C (msvcrt.dll).

@definicao(biblioteca="m", prefixo="")
classe estrangeira LibM {
    @definicao(simbolo="cos")
    cosseno(x: numero): numero

    @definicao(simbolo="sin")
    seno(x: numero): numero

    @definicao(simbolo="sqrt")
    raizQuadrada(x: numero): numero

    @definicao(simbolo="pow")
    potencia(base: numero, expoente: numero): numero

    @definicao(simbolo="fabs")
    valorAbsoluto(x: numero): numero
}

// cos(0) = 1
escreva(LibM.cosseno(0.0))

// sin(0) = 0
escreva(LibM.seno(0.0))

// sqrt(9) = 3
escreva(LibM.raizQuadrada(9.0))

// pow(2, 10) = 1024
escreva(LibM.potencia(2.0, 10.0))

// fabs(-42.5) = 42.5
escreva(LibM.valorAbsoluto(-42.5))
```