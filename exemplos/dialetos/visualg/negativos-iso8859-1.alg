Algoritmo "negativos"

Var

    n, i, x : inteiro
    vet: vetor [0..9] de inteiro

Inicio

    escreva("Quantos números você vai digitar? ")
    leia(n)

    se n > 10 entao
        escreval("Por gentileza, digite um número até 10!")
    senao

        para i de 0 ate n-1 faca

            escreva("Digite um número: ")
            leia(vet[i])
        fimpara

        escreval
        escreval("NÚMEROS NEGATIVOS:")

        para i de 0 ate n-1 faca
           se vet[i] < 0 entao
              escreval(vet[i])
           fimse
        fimpara

    fimse

Fimalgoritmo