interface ImportMetaEnv {
  // Adres Workera; w CI pochodzi ze zmiennej repo VITE_API_URL. Może nie być ustawiony.
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
