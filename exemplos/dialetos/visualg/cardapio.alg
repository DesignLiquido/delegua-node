algoritmo "CARDAPIO"
// Função : CARDAPIO
// Autor : SAMUEL
// Data : 05/12/2013
// Seção de Declarações 
var
n1,n2,n3,n4:inteiro
inicio
// Seção de Comandos 
escreval ("CARDAPIO: ")
escreval ()
escreval ("01-CARNES")
escreval ("02-MASSAS")
escreval ("03-PEIXES")
leia (n1)
escolha (n1)
        caso 1
        escreval ("01-FILE MIGNON")
        escreval ("02-FRALDINHA")
        leia (n2)
        se (n2=1) entao
        escreval ("CARNE-FILE MIGNON")
        senao ("CARNE-FRALDINHA")
        fimse
        
        caso 2
        escreval ("01-PIZZA")
        escreval ("02-LAZANHA")
        leia (n3)
        se (n3=1) entao
        escreval ("MASSA-PIZZA")
        senao ("MASSA-LAZANHA")
        fimse
        
        caso 3
        escreval ("01-PINTADO")
        escreval ("02-LAZANHA")
        leia (n4)
        se (n4=1) entao
        escreval ("PEIXE-PINTADO")
        senao ("PEIXE-DOURADO")
        fimse
fimescolha
fimalgoritmo
