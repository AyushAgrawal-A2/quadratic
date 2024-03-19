import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    build: {
      outDir: '../build',
      sourcemap: true, // Source map generation must be turned on
    },
    // optimizeDeps: {
    //   exclude: ['vscode']
    // },
    assetsInclude: ['**/*.py'],
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['monaco-editor', 'vscode'],
    },
    plugins: [
      react(),
      tsconfigPaths(),
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint --ext .ts,.tsx src',
        },
      }),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: 'quadratic',
        project: 'quadratic',
      }),
    ],
    worker: {
      format: 'iife',
      plugins: () => [
        checker({
          typescript: true,
          eslint: {
            lintCommand: 'eslint --ext .ts src',
          },
        }),
      ],
    },
    test: {
      globals: true,
      environment: 'happy-dom',
    },
  };
});
/*
old version:

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    build: {
      outDir: '../build',
    },
    assetsInclude: ['** /*.py', '** /*.wasm'],
    server: {
      port: 3000,
    },
    plugins: [
      tsconfigPaths(),
      react(),
      wasm(),
      topLevelAwait(),
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint --ext .ts,.tsx src',
        },
      }),
    ],
    test: {
      globals: true,
      environment: 'happy-dom',
      // plugins: [
      // tsconfigPaths(),
      // wasm(),
      // topLevelAwait(),
      // checker({
      //   typescript: true,
      //   eslint: {
      //     lintCommand: 'eslint --ext .ts,.tsx src',
      //   },
      // }),
      // ],
      exclude: ['tests-e2e'],
    },
    worker: {
      format: 'iife',
      plugins: () => [
        tsconfigPaths(),
        wasm(),
        topLevelAwait(),
        checker({
          typescript: true,
          eslint: {
            lintCommand: 'eslint --ext .ts src',
          },
        }),
      ],
    },
  };
});


*/
