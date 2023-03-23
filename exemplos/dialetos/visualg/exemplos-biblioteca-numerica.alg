Algoritmo "exemplo_funcoes"
var a, b, c : real
inicio
a <- 2
b <- 9
escreval( b - a ) // será escrito 7 na tela
escreval( abs( a - b ) ) // também será escrito 7 na tela
c <- raizq( b ) // c recebe 3, a raiz quadrada de b, que é 9 
// A fórmula da área do círculo é pi (3.1416) vezes raio ao quadrado...
escreval("A área do circulo com raio " , c , " é " , pi * quad(c) )
// Um pouco de trigonometria...
escreval("Um ângulo de 90 graus tem " , grauprad(90) , " radianos" ) 
escreval( exp(a,b) ) // escreve 2 elevado à 9ª, que é 512
// escreve 1, que é a parte inteira de 1.8, resultado de 9/(3+2)
escreval( int( b / ( a + c ) ) )
Fimalgoritmo