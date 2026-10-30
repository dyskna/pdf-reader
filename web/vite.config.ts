import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// Content-Security-Policy jako <meta>, bo GitHub Pages nie pozwala ustawić nagłówków.
// Tylko w buildzie: serwer dev Vite wstrzykuje skrypty inline, które polityka by zablokowała.
function contentSecurityPolicy(apiUrl: string | undefined): Plugin {
  const apiOrigin = apiUrl ? new URL(apiUrl).origin : ''
  const policy = [
    "default-src 'self'",
    // 'wasm-unsafe-eval' pozwala tylko na WebAssembly (dekodery obrazów pdf.js), nie na eval()
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    // Jedyny zewnętrzny adres, z którym strona może się łączyć: nasz Worker
    `connect-src 'self' ${apiOrigin}`.trim(),
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')

  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_API_URL z pliku .env albo ze zmiennej środowiskowej (w CI: zmienna repo)
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    // Aplikacja działa pod https://dyskna.github.io/pdf-reader/
    base: '/pdf-reader/',
    plugins: [react(), contentSecurityPolicy(env.VITE_API_URL)],
  }
})
