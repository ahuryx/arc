import { defineConfig } from '@fullstacksjs/eslint-config';

export default defineConfig({
  typescript: {
    projectService: {
      allowDefaultProject: ['eslint.config.mjs'],
      defaultProject: 'tsconfig.node.json',
    },
    tsconfigRootDir: import.meta.dirname,
  },
  tailwind: {
    entryPoint: './src/index.css',
  },
  rules: {
    'max-lines-per-function': 'off',
  },
  ignores: ['dist', 'src-tauri', 'node_modules'],
});
