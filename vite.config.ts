import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    forwardConsole: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    // Dil kabukları kendi çeviri parçasını önceden yükler (tools/build-language-homes.mjs).
    manifest: true,
  },
});
