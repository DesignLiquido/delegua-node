import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
    return {
        verbose: true,
        modulePathIgnorePatterns: ['<rootDir>/dist/'],
        moduleDirectories: ['node_modules', 'dist'],
        preset: 'ts-jest',
        transform: {
            '^.+\\.ts$': [
                'ts-jest',
                {
                    tsconfig: '<rootDir>/testes/tsconfig.json'
                }
            ]
        },
        testEnvironment: 'node',
        coverageReporters: ['json-summary', 'lcov', 'text', 'text-summary'],
        detectOpenHandles: true,
        moduleNameMapper: {
            '^canvas$': '<rootDir>/testes/mocks/canvas.ts',
            // Se for utilizar módulos linkados, comentar as linhas abaixo:
            '@designliquido/delegua/(.*)': '<rootDir>/node_modules/@designliquido/delegua/$1',
            '@designliquido/mapler/(.*)': '<rootDir>/node_modules/@designliquido/mapler/$1',
            '@designliquido/portugol-studio/(.*)': '<rootDir>/node_modules/@designliquido/portugol-studio/$1',
            '@designliquido/potigol/(.*)': '<rootDir>/node_modules/@designliquido/potigol/$1',
            '@designliquido/visualg/(.*)': '<rootDir>/node_modules/@designliquido/visualg/$1'
            // E descomentar as linhas abaixo:
            // '@designliquido/delegua/(.*)': '<rootDir>/node_modules/@designliquido/delegua/fontes/$1',
            // '@designliquido/mapler/(.*)': '<rootDir>/node_modules/@designliquido/mapler/fontes/$1',
            // '@designliquido/portugol-studio/(.*)': '<rootDir>/node_modules/@designliquido/portugol-studio/fontes/$1',
            // '@designliquido/potigol/(.*)': '<rootDir>/node_modules/@designliquido/potigol/fontes/$1',
            // '@designliquido/visualg/(.*)': '<rootDir>/node_modules/@designliquido/visualg/fontes/$1'
        }
    };
};
