import { Chamavel } from "@designliquido/delegua/interpretador/estruturas";

/**
 * Uma classe de módulo não é muito diferente de uma `ClassePadrao`, com o adicional
 * de ajustar alguns tipos de objetos chamados, e ter documentações extras para métodos e propriedades.
 */
export class ClasseDeModulo extends Chamavel {
    nome: string;
    modulo: string;
    implementacao: any;
    metodos: {[nome: string]: any};
    propriedades: {[nome: string]: any};

    constructor(
        nome: string, 
        modulo: string,
        implementacao: any,
        metodos: {[nome: string]: any}, 
        propriedades: {[nome: string]: any}
    ) {
        super();
        this.nome = nome;
        this.modulo = modulo;
        this.implementacao = implementacao;
        this.metodos = metodos;
        this.propriedades = propriedades;
    }

    chamar(visitante: any, argumentos: any[], simbolo?: any): any {
        const valoresResolvidos = (argumentos || []).map((a: any) => a && a.valor !== undefined ? a.valor : a);
        const instanciaReal = new this.implementacao(...valoresResolvidos);

        // O interpretador central só permite definirValor (atribuição de campo) em
        // ObjetoDeleguaClasse ou em plain Objects (constructor === Object).
        // Instâncias de classes JS externas têm constructor próprio e seriam rejeitadas.
        // O Proxy abaixo faz com que `instancia.constructor` retorne Object, passando
        // a verificação, enquanto todos os gets e sets são delegados à instância real.
        return new Proxy(instanciaReal, {
            get(alvo: any, propriedade: string | symbol, receptor: any): any {
                if (propriedade === 'constructor') return Object;
                return Reflect.get(alvo, propriedade, receptor);
            },
            set(alvo: any, propriedade: string | symbol, valor: any): boolean {
                alvo[propriedade as string] = valor;
                return true;
            }
        });
    }
}