const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'react-native', 'react-native-*', 'expo', 'expo-*', '@expo/*'],
              message: 'src/core debe ser TypeScript puro: sin React ni Expo',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
