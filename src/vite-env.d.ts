/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLL_CONTRACT_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
