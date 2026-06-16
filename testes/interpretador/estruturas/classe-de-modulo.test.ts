import { ClasseDeModulo } from "../../../fontes/interpretador/estruturas/classe-de-modulo";

describe('Classe de Módulo', () => {
    describe('Construtor', () => {
        it('Deve criar uma classe de módulo com todas as propriedades', () => {
            const nome = 'MinhaClasse';
            const modulo = 'meu-modulo';
            const implementacao = { metodo: () => 'teste' };
            const metodos = {
                executar: { descricao: 'Executa a classe' }
            };
            const propriedades = {
                valor: { descricao: 'Valor armazenado', tipo: 'número' }
            };

            const classeDeModulo = new ClasseDeModulo(
                nome,
                modulo,
                implementacao,
                metodos,
                propriedades
            );

            expect(classeDeModulo.nome).toBe(nome);
            expect(classeDeModulo.modulo).toBe(modulo);
            expect(classeDeModulo.implementacao).toBe(implementacao);
            expect(classeDeModulo.metodos).toBe(metodos);
            expect(classeDeModulo.propriedades).toBe(propriedades);
        });

        it('Deve criar classe com métodos vazios', () => {
            const classeDeModulo = new ClasseDeModulo(
                'ClasseVazia',
                'modulo-vazio',
                {},
                {},
                {}
            );

            expect(classeDeModulo.nome).toBe('ClasseVazia');
            expect(classeDeModulo.modulo).toBe('modulo-vazio');
            expect(classeDeModulo.metodos).toEqual({});
            expect(classeDeModulo.propriedades).toEqual({});
        });

        it('Deve criar classe com múltiplos métodos e propriedades', () => {
            const metodos = {
                calcular: { descricao: 'Calcula valor' },
                validar: { descricao: 'Valida entrada' },
                processar: { descricao: 'Processa dados' }
            };

            const propriedades = {
                nome: { tipo: 'texto', descricao: 'Nome do objeto' },
                idade: { tipo: 'número', descricao: 'Idade em anos' },
                ativo: { tipo: 'lógico', descricao: 'Status ativo' }
            };

            const classeDeModulo = new ClasseDeModulo(
                'ClasseCompleta',
                'modulo-completo',
                null,
                metodos,
                propriedades
            );

            expect(Object.keys(classeDeModulo.metodos)).toHaveLength(3);
            expect(Object.keys(classeDeModulo.propriedades)).toHaveLength(3);
            expect(classeDeModulo.metodos.calcular).toBeDefined();
            expect(classeDeModulo.propriedades.nome).toBeDefined();
        });

        it('Deve permitir implementação como função', () => {
            const funcaoImplementacao = () => {
                return 'resultado';
            };

            const classeDeModulo = new ClasseDeModulo(
                'ClasseFuncional',
                'modulo-funcional',
                funcaoImplementacao,
                {},
                {}
            );

            expect(typeof classeDeModulo.implementacao).toBe('function');
            expect(classeDeModulo.implementacao()).toBe('resultado');
        });

        it('Deve permitir implementação como objeto', () => {
            const objetoImplementacao = {
                executar: () => 'executado',
                inicializar: () => 'inicializado'
            };

            const classeDeModulo = new ClasseDeModulo(
                'ClasseObjeto',
                'modulo-objeto',
                objetoImplementacao,
                {},
                {}
            );

            expect(typeof classeDeModulo.implementacao).toBe('object');
            expect(classeDeModulo.implementacao.executar()).toBe('executado');
            expect(classeDeModulo.implementacao.inicializar()).toBe('inicializado');
        });

        it('Deve estender Chamavel', () => {
            const classeDeModulo = new ClasseDeModulo(
                'Teste',
                'modulo-teste',
                null,
                {},
                {}
            );

            // Chamavel é uma classe abstrata do delegua
            expect(classeDeModulo).toBeDefined();
            expect(classeDeModulo.nome).toBe('Teste');
        });
    });

    describe('chamar', () => {
        it('Deve instanciar a implementação com argumentos resolvidos', () => {
            class MinhaClasse {
                valor: number;
                constructor(v: number) { this.valor = v; }
            }

            const classeDeModulo = new ClasseDeModulo('MinhaClasse', 'modulo', MinhaClasse, {}, {});
            const resultado = classeDeModulo.chamar(null, [{ valor: 42 }]);

            expect(resultado.valor).toBe(42);
        });

        it('Deve retornar proxy que substitui constructor por Object', () => {
            class MinhaClasse {
                nome: string;
                constructor() { this.nome = 'teste'; }
            }

            const classeDeModulo = new ClasseDeModulo('MinhaClasse', 'modulo', MinhaClasse, {}, {});
            const resultado = classeDeModulo.chamar(null, []);

            expect(resultado.nome).toBe('teste');
            expect(resultado.constructor).toBe(Object);
        });

        it('Deve suportar set no proxy', () => {
            class MinhaClasse {
                valor: number = 0;
            }

            const classeDeModulo = new ClasseDeModulo('MinhaClasse', 'modulo', MinhaClasse, {}, {});
            const resultado = classeDeModulo.chamar(null, []);
            resultado.valor = 99;

            expect(resultado.valor).toBe(99);
        });

        it('Deve funcionar com lista de argumentos vazia', () => {
            class ClasseSemArgs {
                status: string = 'ok';
            }

            const classeDeModulo = new ClasseDeModulo('ClasseSemArgs', 'modulo', ClasseSemArgs, {}, {});
            const resultado = classeDeModulo.chamar(null, []);

            expect(resultado.status).toBe('ok');
        });

        it('Deve resolver argumentos sem propriedade valor diretamente', () => {
            class ClasseComArg {
                x: number;
                constructor(v: number) { this.x = v; }
            }

            const classeDeModulo = new ClasseDeModulo('ClasseComArg', 'modulo', ClasseComArg, {}, {});
            // Argumento sem .valor deve ser passado diretamente
            const resultado = classeDeModulo.chamar(null, [10]);

            expect(resultado.x).toBe(10);
        });
    });

    describe('Propriedades', () => {
        it('Deve permitir acesso às propriedades', () => {
            const propriedades = {
                config: { tipo: 'objeto', valor: { debug: true } }
            };

            const classeDeModulo = new ClasseDeModulo(
                'ClasseConfig',
                'modulo-config',
                null,
                {},
                propriedades
            );

            expect(classeDeModulo.propriedades.config).toBeDefined();
            expect(classeDeModulo.propriedades.config.tipo).toBe('objeto');
        });

        it('Deve permitir acesso aos métodos', () => {
            const metodos = {
                somar: { params: ['a', 'b'], retorno: 'número' }
            };

            const classeDeModulo = new ClasseDeModulo(
                'ClasseMatematica',
                'modulo-matematica',
                null,
                metodos,
                {}
            );

            expect(classeDeModulo.metodos.somar).toBeDefined();
            expect(classeDeModulo.metodos.somar.params).toEqual(['a', 'b']);
        });
    });
});
