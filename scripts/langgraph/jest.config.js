const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [path.join(__dirname, 'src')],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^@/(.*)$': path.join(__dirname, 'src', '$1')
  }
}
