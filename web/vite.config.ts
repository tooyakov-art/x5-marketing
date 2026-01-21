
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// --- AUTO-UPDATE: Bundle ID & Version ---
try {
  const plistPath = path.resolve('ios/App/App/Info.plist');
  if (fs.existsSync(plistPath)) {
    let content = fs.readFileSync(plistPath, 'utf8');
    if (content.includes('com.x5marketing.app')) {
       content = content.replace(/com\.x5marketing\.app/g, 'com.x5pro.app');
    }
    const hasOldVersion = content.includes('<string>3</string>') || content.includes('<string>3.0</string>');
    if (hasOldVersion) {
        content = content.replace(/<string>3<\/string>/g, '<string>1</string>');
        content = content.replace(/<string>3\.0<\/string>/g, '<string>1.0</string>');
    }
    fs.writeFileSync(plistPath, content);
  }
} catch (e) {}
// ---------------------------------------------------

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, path.resolve('.'), 'VITE_');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist'
    },
    define: {
      // Vite automatically injects VITE_* variables, but we keep this for compatibility
      'process.env.NODE_ENV': JSON.stringify(mode),
      'global': 'window',
    },
    // Removed strict CORS headers to allow broader browser compatibility and external images
    server: {},
    preview: {},
  }
})
