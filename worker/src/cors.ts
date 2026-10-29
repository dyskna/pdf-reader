// Przeglądarka wysyła nagłówek Origin przy każdym żądaniu z innej domeny.
// Brak nagłówka albo obcy origin = odmowa. To nie jest uwierzytelnienie
// (curl może podrobić Origin), tylko blokada dla obcych stron w przeglądarce.
export function isAllowedOrigin(
  origin: string | null,
  allowedOrigin: string,
): origin is string {
  return origin === allowedOrigin
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
