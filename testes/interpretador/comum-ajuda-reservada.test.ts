// Mock pontoEntradaAjuda para retornar null,
// permitindo cobertura do caminho de ajuda genérica para palavras reservadas
jest.mock('@designliquido/delegua/interpretador/comum', () => ({
    pontoEntradaAjuda: jest.fn().mockReturnValue(null),
}));

jest.mock('../../fontes/mecanismo-importacao-bibliotecas', () => jest.fn());

import { obterAjudaPorNome } from '../../fontes/interpretador/comum';

const interpretadorMock = {
    pilhaEscoposExecucao: {
        obterValorVariavel: jest.fn(),
    },
    erros: [],
} as any;

describe('obterAjudaPorNome (com pontoEntradaAjuda nulo)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Deve gerar ajuda genérica para palavra reservada (sustar) quando pontoEntradaAjuda retorna nulo', () => {
        (interpretadorMock.pilhaEscoposExecucao.obterValorVariavel as jest.Mock)
            .mockImplementation(() => { throw new Error('não encontrada'); });

        const resultado = obterAjudaPorNome(interpretadorMock, 'sustar');
        expect(resultado).not.toBeNull();
        expect(resultado).toContain('sustar');
    });

    it('Deve retornar null para tópico não reservado quando pontoEntradaAjuda retorna nulo', () => {
        (interpretadorMock.pilhaEscoposExecucao.obterValorVariavel as jest.Mock)
            .mockImplementation(() => { throw new Error('não encontrada'); });

        const resultado = obterAjudaPorNome(interpretadorMock, 'xyzNaoReservado999');
        expect(resultado).toBeNull();
    });

    it('Deve retornar null via caminho legado para tipo não reconhecido', () => {
        (interpretadorMock.pilhaEscoposExecucao.obterValorVariavel as jest.Mock)
            .mockReturnValue({ tipo: 'objeto', valor: {} });

        const resultado = obterAjudaPorNome(interpretadorMock, 'meuObjeto');
        expect(resultado).toBeNull();
    });
});
