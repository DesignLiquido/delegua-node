algoritmo "semnome"
// Função :
// Autor :
// Data : 13/12/2013
// Seção de Declarações 
var
media:vetor[1..10] de real
i:inteiro
n1,n2:real
inicio
// Seção de Comandos
para i de 1 ate 10 faca
     escreval ("Digite a nota do",i,"º Aluno")
     leia (n1,n2)
     media[i]<-(n1+n2)/2
fimpara
escreval ("-")
para i de 1 ate 10 faca
       escreval ("Media do",i,"º aluno: ", media[i])
fimpara
fimalgoritmo
