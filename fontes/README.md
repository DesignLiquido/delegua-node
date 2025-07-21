# Componentes de `delegua-node`

`delegua-node` implementa dois núcleos principais, sendo um de execução e outro de tradução. Ambos os núcleos trabalham com duas etapas em comum: lexação e avaliação sintática. O que os difere é a etapa seguinte.

No caso do núcleo de execução, o código é preparado para uma fase de interpretação, ou seja, aquele código executa de acordo com o que foi declarado nele. No caso do núcleo de tradução, o resultado da avaliação sintática, ou seja, as estruturas de alto nível, são enviadas para um determinado tradutor de acordo com as configurações do comando de tradução. Essa parte está implementada em `execucao.ts`. 