module.exports = {
    preset: 'ts-jest',  // Utilise ts-jest pour la compilation TypeScript
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.js'],  // Pour activer jest-fetch-mock
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
    },
  };
  