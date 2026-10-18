import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const preset = reactCompilerPreset();
// Workspace packages are symlinked into node_modules but resolve to their real
// paths, so a path filter on the three source trees compiles them all.
const compiler = {
  ...preset,
  rolldown: {
    ...preset.rolldown,
    filter: {
      ...preset.rolldown.filter,
      id: {
        include: [/[\\/](?:apps[\\/]web|packages[\\/][^\\/]+)[\\/]src[\\/]/],
      },
    },
  },
};

export default defineConfig({
  plugins: [react(), babel({ presets: [compiler] })],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
