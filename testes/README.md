# Testes

Esta pasta concentra a suíte automatizada de `@designliquido/delegua-node`. Hoje ela cobre tanto testes unitários puros quanto testes de integração leve com execução real de código Delégua, importação de exemplos e fluxos de depuração.

## Como a suíte roda

- O projeto usa `jest` com `ts-jest`.
- O comando principal é `yarn testes-unitarios`.
- A cobertura é gerada junto da execução via `yarn jest --coverage`.
- O ambiente de testes é `node`.
- A configuração principal está em [`jest.config.ts`](d:/Delegua/delegua-node/jest.config.ts).
- O `tsconfig` específico dos testes está em [`testes/tsconfig.json`](d:/Delegua/delegua-node/testes/tsconfig.json).

## O que está sendo validado

- Núcleo de execução:
  execução de código inline, carregamento de arquivos de exemplo, configuração de dialetos, modo LAIR, importação e funções customizadas de saída.
- Núcleo de tradução:
  tradução de JavaScript para Delégua com leitura de arquivo real em `exemplos/`.
- Avaliação sintática e construtos:
  importação, módulos de declarações e integração com o `Importador`.
- Interpretador:
  visitas de construtos e declarações, escopos, funções e montagem de módulos.
- Bibliotecas de Portugol Studio:
  arquivos, gráficos, internet, mouse, serviços web, sons, teclado e utilitários.
- Depuração:
  servidor de depuração padrão, transporte DAP via `stdio` e sessão DAP completa.
- Infra de apoio:
  lexador JSON, formatador JSON, exceções de importação e máquinas de estado do LAIR.

## Padrões importantes da suíte

- Alguns testes são estritamente unitários e usam `jest.fn()`, `spyOn()` e mocks de módulos.
- Outros são mais integrados e exercitam a implementação real contra arquivos em `exemplos/`.
- O módulo `canvas` é mapeado para [`testes/mocks/canvas.ts`](d:/Delegua/delegua-node/testes/mocks/canvas.ts), o que permite testar gráficos sem depender de um backend gráfico real.
- Há testes que simulam `fetch`, `fs`, `net`, `process.stdout` e streams `PassThrough`.
- Em [`testes/nucleo-execucao.test.ts`](d:/Delegua/delegua-node/testes/nucleo-execucao.test.ts), `process.stdin.destroy()` é chamado ao final para evitar `open handles` no Jest.
- A configuração ativa `detectOpenHandles`, o que ajuda a capturar vazamentos de recursos em testes assíncronos.

## Observações de manutenção

- A suíte já cobre áreas críticas do pacote, especialmente execução, importação, bibliotecas e depuração.
- A organização atual é majoritariamente por domínio funcional, o que facilita localizar testes por subsistema.
- Existe uma mistura saudável de testes pequenos e cenários mais completos, mas isso também significa que algumas falhas podem vir de arquivos de exemplo ou integrações simuladas, não apenas de lógica isolada.
- Ao adicionar testes novos, vale seguir a estrutura existente e escolher entre mock unitário ou cenário integrado conforme o objetivo do comportamento a validar.
