/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_WS_BASE?: string;
  readonly VITE_MAP_STYLE?: string;
  readonly VITE_PROXY_TARGET?: string;
  readonly VITE_YANDEX_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
