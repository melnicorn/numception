import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { basePath } from './base-path.ts';

export default defineConfig({
  base: basePath(),
  plugins: [preact()],
});
