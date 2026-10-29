#!/usr/bin/env bash
# Corre dentro de la imagen oficial de Playwright: lo lanza `scripts/visual.ts` (`npm run visual`,
# docs/05-tecnico/calidad.md → «Regresión visual»). Los argumentos van a Playwright (`--update-snapshots`, `--grep`…).
set -euo pipefail

want="$(cut -d. -f1 .nvmrc)"
have="$(node --version | sed 's/^v//' | cut -d. -f1)"
if [ "$have" != "$want" ]; then
  # Solo cambia con qué Node se instala y se construye; el navegador que pinta es el de la imagen.
  echo "[visual] The image brings Node $(node --version) and .nvmrc asks for $want: installing without engine-strict." >&2
  export npm_config_engine_strict=false
fi

# En Docker Desktop, `localhost` lleva a `::1` al escuchar y a `127.0.0.1` al conectar (sin IPv6 configurada, Node
# solo pide direcciones IPv4 al conectar): el servidor del pre-renderizado del build no recibía sus peticiones
# (ECONNREFUSED). Con IPv4 primero, los dos van a 127.0.0.1.
export NODE_OPTIONS="--dns-result-order=ipv4first${NODE_OPTIONS:+ $NODE_OPTIONS}"

npm ci --no-audit --no-fund
npm run build

# Al regenerar todas, se borran antes: una referencia sin test (un capítulo que cambia de nombre) no se queda. Solo
# cuando no llega nada más que la marca de actualizar: con cualquier otro argumento (un filtro, un archivo, `--shard`…)
# Playwright rehace solo una parte y las demás se dejan como están.
if [ "$#" -eq 1 ]; then
  case "$1" in
    --update-snapshots | --update-snapshots=* | -u) rm -rf tests/visual/__screenshots__ ;;
  esac
fi

npm run visual:run -- "$@"
