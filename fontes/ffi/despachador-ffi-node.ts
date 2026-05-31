import * as koffi from 'koffi';
import { Classe } from '@designliquido/delegua/declaracoes';
import { DespachadorFFIInterface, lerMetadadosClasse, lerMetadadosMetodo } from '@designliquido/delegua/ffi';
import { DescritorTipoClasse, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';
import { resolverNomeBiblioteca } from './resolver-biblioteca';

const TIPOS_C: Record<string, string> = {
    numero: 'double',
    inteiro: 'int',
    longo: 'int64',
    logico: 'bool',
    texto: 'string',
    qualquer: 'pointer',
    vazio: 'void',
};

function tipoCKoffi(tipo: string | undefined): string {
    return TIPOS_C[tipo ?? ''] ?? 'void';
}

export class DespachadorFFINodeJs implements DespachadorFFIInterface {
    private bibliotecasCarregadas = new Map<string, koffi.LibraryHandle>();

    resolverClasseEstrangeira(declaracao: Classe): DescritorTipoClasse | null {
        const meta = lerMetadadosClasse(declaracao.decoradores);
        if (!meta) return null;

        let lib = this.bibliotecasCarregadas.get(meta.biblioteca);
        if (!lib) {
            try {
                const nomeArquivo = resolverNomeBiblioteca(meta.biblioteca);
                lib = koffi.load(nomeArquivo);
                this.bibliotecasCarregadas.set(meta.biblioteca, lib);
            } catch {
                return null;
            }
        }

        const descritor = new DescritorTipoClasse(declaracao.simbolo, [], {}, []);
        descritor.classeEstatica = true;

        for (const metodo of declaracao.metodos) {
            const nomeMetodo = metodo.simbolo.lexema;
            const metaMetodo = lerMetadadosMetodo(metodo.decoradores, nomeMetodo, meta.prefixo);

            try {
                const tipoRetorno = tipoCKoffi(metodo.tipo);
                const tiposParams = (metodo.funcao?.parametros ?? []).map(p => tipoCKoffi(p.tipoDado));
                const fn = lib.func(metaMetodo.simbolo, tipoRetorno, tiposParams);
                const aridade = tiposParams.length;
                descritor.metodosEstaticos[nomeMetodo] = new FuncaoPadrao(aridade, (_interp: any, ...args: any[]) => fn(...args));
            } catch {
                // símbolo não encontrado nesta versão da biblioteca — ignorar
            }
        }

        return descritor;
    }

    descarregarTudo(): void {
        for (const lib of this.bibliotecasCarregadas.values()) {
            try {
                lib.unload();
            } catch {
                // ignora erros de descarregamento
            }
        }
        this.bibliotecasCarregadas.clear();
    }
}
