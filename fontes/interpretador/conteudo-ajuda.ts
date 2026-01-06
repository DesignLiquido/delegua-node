/**
 * Conteúdo de ajuda para tópicos da linguagem Delégua.
 * Baseado na documentação oficial: https://github.com/DesignLiquido/delegua/wiki
 */

export const conteudoAjuda: { [topico: string]: string } = {
    // ===== ENTRADA E SAÍDA =====
    'escreva': `
# escreva(valores...)

Escreve valores na saída padrão (console).

**Sintaxe:**
  escreva(valor1, valor2, ...)

**Parâmetros:**
  - valores: Um ou mais valores de qualquer tipo a serem impressos

**Retorno:**
  nulo

**Características:**
  - Aceita múltiplos argumentos separados por vírgula
  - Suporta interpolação de strings com \${variavel}
  - Converte automaticamente valores para texto

**Exemplos:**
  escreva(1)
  var nome = 'Maria'
  escreva(nome)
  escreva('Números:', 1, 2, 3)

  var comida = 'pizza'
  escreva("Minha comida favorita é \${comida}")
`,

    'leia': `
# leia([mensagem])

Lê entrada do usuário a partir da entrada padrão.

**Sintaxe:**
  leia()
  leia(mensagem)

**Parâmetros:**
  - mensagem (opcional): Texto a ser exibido antes da leitura

**Retorno:**
  texto - Sempre retorna uma string

**Importante:**
  O retorno de leia() é SEMPRE do tipo texto. Para converter
  para outro tipo, use as funções de conversão (numero, inteiro, etc.)

**Exemplos:**
  var nome = leia()
  escreva('Olá, ' + nome)

  var idadeTexto = leia('Digite sua idade: ')
  var idade = inteiro(idadeTexto)
`,

    // ===== FUNÇÕES DE CONVERSÃO =====
    'numero': `
# numero(valor)

Converte um valor para número (ponto flutuante).

**Sintaxe:**
  numero(valor)

**Parâmetros:**
  - valor: Valor a ser convertido (texto, inteiro, etc.)

**Retorno:**
  número - Valor convertido para tipo numérico

**Sinônimos:**
  número() - Mesma função com acento

**Exemplos:**
  var texto = '3.14'
  var num = numero(texto)  // 3.14

  var inteiro = 42
  var float = numero(inteiro)  // 42.0
`,

    'número': `
# número(valor)

Converte um valor para número (ponto flutuante).

**Sintaxe:**
  número(valor)

**Parâmetros:**
  - valor: Valor a ser convertido (texto, inteiro, etc.)

**Retorno:**
  número - Valor convertido para tipo numérico

**Sinônimos:**
  numero() - Mesma função sem acento

**Exemplos:**
  var texto = '3.14'
  var num = número(texto)  // 3.14
`,

    'inteiro': `
# inteiro(valor)

Converte um valor para número inteiro.

**Sintaxe:**
  inteiro(valor)

**Parâmetros:**
  - valor: Valor a ser convertido

**Retorno:**
  inteiro - Valor convertido, truncando casas decimais

**Exemplos:**
  var texto = '42'
  var num = inteiro(texto)  // 42

  var float = 3.7
  var int = inteiro(float)  // 3
`,

    'real': `
# real(valor)

Converte um valor para número real (ponto flutuante).

**Sintaxe:**
  real(valor)

**Parâmetros:**
  - valor: Valor a ser convertido

**Retorno:**
  real - Valor convertido para número real

**Exemplos:**
  var texto = '2.5'
  var num = real(texto)  // 2.5
`,

    'texto': `
# texto(valor)

Converte um valor para texto (string).

**Sintaxe:**
  texto(valor)

**Parâmetros:**
  - valor: Valor de qualquer tipo a ser convertido

**Retorno:**
  texto - Representação textual do valor

**Exemplos:**
  var num = 123
  var str = texto(num)  // '123'

  var bool = verdadeiro
  var str2 = texto(bool)  // 'verdadeiro'
`,

    // ===== FUNÇÕES DE ALEATORIEDADE =====
    'aleatorio': `
# aleatorio()

Retorna um número aleatório entre 0 e 1.

**Sintaxe:**
  aleatorio()

**Parâmetros:**
  Nenhum

**Retorno:**
  número - Valor aleatório entre 0.0 (inclusivo) e 1.0 (exclusivo)

**Exemplos:**
  var valor = aleatorio()
  escreva(valor)  // Ex: 0.7234891
`,

    'aleatório': `
# aleatório()

Retorna um número aleatório entre 0 e 1.

**Sintaxe:**
  aleatório()

**Sinônimos:**
  aleatorio() - Mesma função sem acento

**Retorno:**
  número - Valor aleatório entre 0.0 e 1.0

**Exemplos:**
  var valor = aleatório()
`,

    'aleatorioEntre': `
# aleatorioEntre(minimo, maximo)

Retorna um número inteiro aleatório entre dois valores.

**Sintaxe:**
  aleatorioEntre(minimo, maximo)

**Parâmetros:**
  - minimo: Valor mínimo (inclusivo)
  - maximo: Valor máximo (exclusivo)

**Retorno:**
  inteiro - Número aleatório no intervalo [minimo, maximo)

**Exemplos:**
  var dado = aleatorioEntre(1, 7)  // 1 a 6
  escreva('Você tirou:', dado)
`,

    // ===== FUNÇÕES DE VETOR =====
    'mapear': `
# mapear(vetor, funcao)

Aplica uma função a cada elemento de um vetor e retorna novo vetor.

**Sintaxe:**
  mapear(vetor, funcao)

**Parâmetros:**
  - vetor: Vetor a ser transformado
  - funcao: Função a ser aplicada em cada elemento

**Retorno:**
  vetor - Novo vetor com elementos transformados

**Exemplos:**
  var numeros = [1, 2, 3, 4]
  var dobrados = mapear(numeros, funcao(x) { retorna x * 2 })
  escreva(dobrados)  // [2, 4, 6, 8]
`,

    'filtrarPor': `
# filtrarPor(vetor, funcao)

Filtra elementos de um vetor baseado em uma condição.

**Sintaxe:**
  filtrarPor(vetor, funcao)

**Parâmetros:**
  - vetor: Vetor a ser filtrado
  - funcao: Função que retorna verdadeiro/falso para cada elemento

**Retorno:**
  vetor - Novo vetor contendo apenas elementos que satisfazem a condição

**Sinônimos:**
  filtrar() - Mesma funcionalidade

**Exemplos:**
  var numeros = [1, 2, 3, 4, 5, 6]
  var pares = filtrarPor(numeros, funcao(x) { retorna x % 2 == 0 })
  escreva(pares)  // [2, 4, 6]
`,

    'ordenar': `
# ordenar(vetor)

Ordena os elementos de um vetor em ordem crescente.

**Sintaxe:**
  ordenar(vetor)

**Parâmetros:**
  - vetor: Vetor a ser ordenado

**Retorno:**
  vetor - Novo vetor com elementos ordenados

**Exemplos:**
  var numeros = [3, 1, 4, 1, 5, 9, 2, 6]
  var ordenados = ordenar(numeros)
  escreva(ordenados)  // [1, 1, 2, 3, 4, 5, 6, 9]
`,

    'paraCada': `
# paraCada(vetor, funcao)

Executa uma função para cada elemento de um vetor.

**Sintaxe:**
  paraCada(vetor, funcao)

**Parâmetros:**
  - vetor: Vetor a ser percorrido
  - funcao: Função a ser executada para cada elemento

**Retorno:**
  nulo

**Exemplos:**
  var nomes = ['Ana', 'Bruno', 'Carlos']
  paraCada(nomes, funcao(nome) {
    escreva('Olá, ' + nome)
  })
`,

    'tamanho': `
# tamanho(colecao)

Retorna o número de elementos em uma coleção.

**Sintaxe:**
  tamanho(colecao)

**Parâmetros:**
  - colecao: Vetor, texto ou dicionário

**Retorno:**
  inteiro - Quantidade de elementos

**Exemplos:**
  var lista = [1, 2, 3, 4, 5]
  escreva(tamanho(lista))  // 5

  var texto = 'Delégua'
  escreva(tamanho(texto))  // 7
`,

    'todosEmCondicao': `
# todosEmCondicao(vetor, funcao)

Verifica se todos os elementos de um vetor satisfazem uma condição.

**Sintaxe:**
  todosEmCondicao(vetor, funcao)

**Parâmetros:**
  - vetor: Vetor a ser testado
  - funcao: Função de teste que retorna verdadeiro/falso

**Retorno:**
  lógico - verdadeiro se todos satisfazem, falso caso contrário

**Exemplos:**
  var numeros = [2, 4, 6, 8]
  var todosPares = todosEmCondicao(numeros, funcao(x) {
    retorna x % 2 == 0
  })
  escreva(todosPares)  // verdadeiro
`,

    'encontrar': `
# encontrar(vetor, funcao)

Encontra o primeiro elemento que satisfaz uma condição.

**Sintaxe:**
  encontrar(vetor, funcao)

**Parâmetros:**
  - vetor: Vetor onde buscar
  - funcao: Função de teste

**Retorno:**
  Elemento encontrado ou nulo se não encontrar

**Exemplos:**
  var numeros = [1, 2, 3, 4, 5]
  var maior3 = encontrar(numeros, funcao(x) { retorna x > 3 })
  escreva(maior3)  // 4
`,

    'clonar': `
# clonar(valor)

Cria uma cópia profunda de uma variável.

**Sintaxe:**
  clonar(valor)

**Parâmetros:**
  - valor: Variável a ser clonada

**Retorno:**
  Cópia independente do valor original

**Características:**
  - Cria cópias profundas (nested structures)
  - Lida com referências circulares
  - Preserva o original inalterado

**Exemplos:**
  var original = [1, [2, 3], 4]
  var copia = clonar(original)
  copia[1][0] = 99
  escreva(original)  // [1, [2, 3], 4] - inalterado
`,

    'tupla': `
# tupla(vetor)

Converte um vetor em uma tupla com campos nomeados.

**Sintaxe:**
  tupla(vetor)

**Parâmetros:**
  - vetor: Vetor com 2 a 10 elementos

**Retorno:**
  tupla - Estrutura imutável com campos nomeados

**Exemplos:**
  var dados = tupla([1, 2])
  escreva(dados.primeiro)  // 1
  escreva(dados.segundo)   // 2
`,

    // ===== PALAVRAS-CHAVE =====
    'var': `
# var

Declara uma variável mutável.

**Sintaxe:**
  var nomeVariavel = valor

**Exemplos:**
  var idade = 25
  var nome = 'João'
  idade = 26  // Pode ser alterada
`,

    'const': `
# const

Declara uma constante (valor imutável).

**Sintaxe:**
  const nomeConstante = valor

**Exemplos:**
  const PI = 3.14159
  const NOME = 'Maria'
  // PI = 3.14  // ERRO: constantes não podem ser alteradas
`,

    'se': `
# se

Estrutura condicional (if).

**Sintaxe:**
  se (condicao) {
    // código se verdadeiro
  } senao {
    // código se falso
  }

**Exemplos:**
  var idade = 18
  se (idade >= 18) {
    escreva('Maior de idade')
  } senao {
    escreva('Menor de idade')
  }
`,

    'senao': `
# senao

Cláusula else de uma estrutura condicional.

**Sintaxe:**
  se (condicao) {
    // ...
  } senao {
    // executa se condição for falsa
  }
`,

    'para': `
# para

Laço de repetição (for).

**Sintaxe:**
  para (inicializacao; condicao; incremento) {
    // código a repetir
  }

**Exemplos:**
  para (var i = 0; i < 5; i += 1) {
    escreva(i)
  }
`,

    'enquanto': `
# enquanto

Laço de repetição (while).

**Sintaxe:**
  enquanto (condicao) {
    // código a repetir
  }

**Exemplos:**
  var contador = 0
  enquanto (contador < 5) {
    escreva(contador)
    contador += 1
  }
`,

    'fazer': `
# fazer

Laço de repetição do-while.

**Sintaxe:**
  fazer {
    // código a repetir
  } enquanto (condicao)

**Exemplos:**
  var x = 0
  fazer {
    escreva(x)
    x += 1
  } enquanto (x < 3)
`,

    'funcao': `
# funcao

Declara uma função.

**Sintaxe:**
  funcao nomeFuncao(parametros) {
    // corpo da função
    retorna valor
  }

**Exemplos:**
  funcao somar(a, b) {
    retorna a + b
  }

  var resultado = somar(5, 3)
  escreva(resultado)  // 8
`,

    'retorna': `
# retorna

Retorna um valor de uma função.

**Sintaxe:**
  retorna valor

**Exemplos:**
  funcao dobro(x) {
    retorna x * 2
  }
`,

    'verdadeiro': `
# verdadeiro

Valor booleano verdadeiro.

**Tipo:**
  lógico

**Exemplos:**
  var ativo = verdadeiro
  se (ativo) {
    escreva('Sistema ativo')
  }
`,

    'falso': `
# falso

Valor booleano falso.

**Tipo:**
  lógico

**Exemplos:**
  var desligado = falso
`,

    'nulo': `
# nulo

Representa a ausência de valor.

**Tipo:**
  nulo

**Exemplos:**
  var semValor = nulo
  se (semValor == nulo) {
    escreva('Sem valor')
  }
`,

    // ===== TIPOS PRIMITIVOS E SEUS MÉTODOS =====
    'tipo:número': `
# número

Tipo de dados numérico. Suporta inteiros e decimais.

**Métodos disponíveis:**

  - **absoluto()** - Retorna o valor absoluto do número (remove o sinal)
    Exemplo: var x = -5; x.absoluto()  // retorna 5

  - **arredondarParaBaixo()** - Arredonda um número para baixo (descarta a parte decimal)
    Exemplo: var x = 3.8; x.arredondarParaBaixo()  // retorna 3

  - **arredondarParaCima()** - Arredonda um número para cima (adiciona 1 à parte inteira)
    Exemplo: var x = 3.2; x.arredondarParaCima()  // retorna 4

  - **formatar(configurações)** - Formata com separadores decimais e de milhares
    Parâmetros: minimoCasasDecimais, maximoCasasDecimais
    Exemplo: var x = 1234.56; x.formatar()

**Exemplos:**
  var num = -7.8
  escreva(num.absoluto())              // 7.8
  escreva(num.arredondarParaBaixo())   // -8
  escreva(num.arredondarParaCima())    // -7
`,

    'tipo:texto': `
# texto

Tipo de dados para strings (cadeias de caracteres).

**Métodos disponíveis:**

  - **aparar()** - Remove espaços em branco do início e do final
    Exemplo: "  texto  ".aparar()  // retorna "texto"

  - **apararFim()** - Remove espaços em branco apenas do final
    Exemplo: "texto  ".apararFim()  // retorna "texto"

  - **apararInicio()** - Remove espaços em branco apenas do início
    Exemplo: "  texto".apararInicio()  // retorna "texto"

  - **concatenar(outroTexto)** - Junta dois textos
    Exemplo: "Olá".concatenar(" Mundo")  // retorna "Olá Mundo"

  - **dividir(separador)** - Transforma um texto em um vetor de outros textos
    Exemplo: "a,b,c".dividir(",")  // retorna ["a", "b", "c"]

  - **encontrar(subtexto)** - Retorna o índice inicial de um subtexto
    Exemplo: "Delégua".encontrar("é")  // retorna 3

  - **fatiar(início, fim)** - Extrai trechos (fatias) do texto
    Exemplo: "Delégua".fatiar(0, 3)  // retorna "Del"

  - **inclui(subtexto)** - Verifica se o texto contém outro texto
    Exemplo: "Delégua".inclui("gua")  // retorna verdadeiro

  - **maiusculo()** - Devolve um texto com todos os caracteres em maiúsculo
    Exemplo: "delégua".maiusculo()  // retorna "DELÉGUA"

  - **minusculo()** - Devolve um texto com todos os caracteres em minúsculo
    Exemplo: "DELÉGUA".minusculo()  // retorna "delégua"

  - **substituir(busca, substituição)** - Substitui uma porção de um texto
    Exemplo: "banana".substituir("a", "o")  // retorna "bonana"

  - **subtexto(início, tamanho)** - Extrai subtexto (sinônimo de fatiar)
    Exemplo: "Delégua".subtexto(0, 3)  // retorna "Del"

  - **tamanho()** - Devolve o número de caracteres de um texto
    Exemplo: "Delégua".tamanho()  // retorna 7

  - **tudoMaiusculo()** - Devolve verdadeiro se todos os caracteres alfabéticos estão em maiúsculo
    Exemplo: "DELEGUA".tudoMaiusculo()  // retorna verdadeiro

  - **tudoMinusculo()** - Devolve verdadeiro se todos os caracteres alfabéticos estão em minúsculo
    Exemplo: "delegua".tudoMinusculo()  // retorna verdadeiro

**Exemplos:**
  var nome = "  Delégua  "
  escreva(nome.aparar())            // "Delégua"
  escreva(nome.aparar().tamanho())  // 7
  escreva(nome.aparar().maiusculo())  // "DELÉGUA"
`,

    'tipo:lógico': `
# lógico

Tipo de dados booleano. Pode ser verdadeiro ou falso.

**Valores:**
  - verdadeiro
  - falso

**Métodos disponíveis:**
  Nenhum método específico. Use operadores lógicos e condicionais.

**Operadores lógicos:**
  - e (AND)
  - ou (OR)
  - não (NOT)

**Exemplos:**
  var ativo = verdadeiro
  var desativado = falso

  escreva(ativo e desativado)   // falso
  escreva(ativo ou desativado)  // verdadeiro
  escreva(não ativo)            // falso
`,

    'tipo:vetor': `
# vetor

Tipo de dados para arrays (listas ordenadas).

**Criação:**
  var lista = [1, 2, 3]
  var vazia = []

**Métodos disponíveis:**

  - **adicionar(elemento)** - Adiciona um elemento ao final do vetor
    Exemplo: lista.adicionar(4)

  - **concatenar(outroVetor)** - Combina dois vetores em um novo com todos os elementos
    Exemplo: [1,2].concatenar([3,4])  // retorna [1,2,3,4]

  - **empilhar(elemento)** - Assim como adicionar(), adiciona um elemento ao final
    Exemplo: lista.empilhar(5)

  - **encaixar(índice, quantidade, elementos...)** - Insere ou remove elementos em posição específica
    Exemplo: lista.encaixar(1, 0, 'novo')  // insere 'novo' na posição 1

  - **fatiar(início, fim)** - Extrai trechos (fatias) do vetor, devolvendo a parte fatiada
    Exemplo: [1,2,3,4,5].fatiar(1, 3)  // retorna [2,3]

  - **filtrarPor(função)** - Retorna elementos onde a função retorna verdadeiro
    Exemplo: [1,2,3,4].filtrarPor(funcao(x) { retorna x > 2 })  // retorna [3,4]

  - **inclui(elemento)** - Verifica se o vetor contém um elemento específico
    Exemplo: [1,2,3].inclui(2)  // retorna verdadeiro

  - **inverter()** - Devolve um vetor cujo resultado contém os elementos invertidos
    Exemplo: [1,2,3].inverter()  // retorna [3,2,1]

  - **juntar(separador)** - Junta os elementos de um vetor em um texto
    Exemplo: ["a","b","c"].juntar(",")  // retorna "a,b,c"

  - **mapear(função)** - Executa uma função para cada elemento e retorna os resultados
    Exemplo: [1,2,3].mapear(funcao(x) { retorna x * 2 })  // retorna [2,4,6]

  - **ordenar()** - Ordena elementos do vetor em ordem crescente por padrão
    Exemplo: [3,1,2].ordenar()  // retorna [1,2,3]

  - **remover(elemento)** - Remove um elemento específico do vetor
    Exemplo: lista.remover(2)  // remove o elemento 2

  - **removerPrimeiro()** - Remove o primeiro elemento de um vetor, se existir
    Exemplo: lista.removerPrimeiro()

  - **removerUltimo()** - Remove o último elemento de um vetor, se existir
    Exemplo: lista.removerUltimo()

  - **somar()** - Totaliza elementos numéricos dentro de um vetor
    Exemplo: [1,2,3].somar()  // retorna 6

  - **tamanho()** - Devolve o número de elementos de um vetor
    Exemplo: [1,2,3].tamanho()  // retorna 3

**Exemplos:**
  var nums = [1, 2, 3]
  escreva(nums.tamanho())             // 3
  nums.adicionar(4)                   // [1,2,3,4]
  escreva(nums.somar())               // 10
  escreva(nums.mapear(funcao(x) { retorna x * 2 }))  // [2,4,6,8]
`,

    'tipo:dicionário': `
# dicionário

Tipo de dados para objetos (pares chave-valor).

**Criação:**
  var pessoa = { nome: "Maria", idade: 25 }
  var vazio = {}

**Métodos disponíveis:**

  - **chaves()** - Retorna uma coleção com todas as chaves
    Exemplo: var dici = {'a': 1, 'b': 2}
             escreva(dici.chaves())  // ['a', 'b']

  - **contém(chave)** ou **contem(chave)** - Verifica se uma chave existe
    Exemplo: escreva(dici.contém('a'))  // verdadeiro

  - **remover(chave)** - Remove um par chave-valor específico do dicionário
    Exemplo: dici.remover('a')

  - **valores()** - Retorna uma coleção com todos os valores
    Exemplo: var dici = { 'a': 1, 'b': 2}
             escreva(dici.valores())  // [1, 2]

**Acesso a valores:**
  pessoa.nome           // "Maria"
  pessoa["idade"]       // 25

**Exemplos:**
  var config = { tema: "escuro", idioma: "pt" }
  escreva(config.chaves())       // ["tema", "idioma"]
  escreva(config.valores())      // ["escuro", "pt"]
  escreva(config.contém("tema")) // verdadeiro
  config.remover("tema")
  escreva(config.chaves())       // ["idioma"]
`,
};

/**
 * Normaliza um texto removendo acentos para busca.
 */
export function normalizarParaBusca(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca conteúdo de ajuda por tópico.
 * Suporta busca com e sem acentos.
 */
export function buscarConteudoAjuda(topico: string): string | null {
    // Busca exata primeiro
    if (conteudoAjuda[topico]) {
        return conteudoAjuda[topico];
    }

    // Busca normalizada (sem acentos)
    const topicoNormalizado = normalizarParaBusca(topico);
    for (const [chave, conteudo] of Object.entries(conteudoAjuda)) {
        if (normalizarParaBusca(chave) === topicoNormalizado) {
            return conteudo;
        }
    }

    return null;
}

/**
 * Lista todos os tópicos disponíveis agrupados por categoria.
 */
export function listarTopicos(): string[] {
    return Object.keys(conteudoAjuda).sort();
}
