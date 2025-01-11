Algoritmo "experiencias"

Var

    x, i, n, rato, sapo, coelho, totalQ, quantidade : inteiro
    pRato, pCoelho, pSapo : real
    animal : caractere

Inicio

    escreva("Quantos casos de teste serao digitados? ")
    leia(n)

    para i de 1 ate n faca
        escreva("Quantidade de cobaias: ")
        leia(quantidade)
        totalQ <- totalQ + quantidade

        escreva("Tipo de cobaia: ")
        leia(animal)

        escolha animal
        caso "C"
            coelho <- coelho + quantidade
        caso "S"
            sapo <- sapo + quantidade
        caso "R"
            rato <- rato + quantidade
        outrocaso
            escreval("Opção Inválida")
        fimescolha

    fimpara

    pCoelho <- coelho / totalQ * 100
    pSapo <- sapo / totalQ * 100
    pRato <- rato / totalQ * 100

    escreval()
    escreval("RELATÓRIO FINAL:")
    escreval("Total: ", totalQ)
    escreval("Total de Coelhos: ", coelho)
    escreval("Total de Ratos: ", rato)
    escreval("Total de Sapos: ", sapo)
    escreval()
    escreval("Percentual de Coelhos: ", pCoelho:4:2,"%")
    escreval("Percentual de Sapos: ", pSapo:4:2,"%")
    escreval("Percentual de Ratos: ", pRato:4:2,"%")

Fimalgoritmo