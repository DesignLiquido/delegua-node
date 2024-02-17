import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
    return {
        verbose: true,
        modulePathIgnorePatterns: ['<rootDir>/dist/'],
        preset: 'ts-jest',
        testEnvironment: 'node',
        coverageReporters: ['json-summary', 'lcov', 'text', 'text-summary'],
        detectOpenHandles: true,
        // TODO: Até então não conseguimos fazer funcionar.
        // Mantido aqui caso seja útil no futuro.
        transform: {
            '^.+\\.ts$': [
                'ts-jest',
                {
                    tsconfig: 'tsconfig.test.json'
                },
            ]
        }
    };
};
