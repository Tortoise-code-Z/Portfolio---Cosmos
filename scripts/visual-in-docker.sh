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

# Al regenerar todas, se borran antes: una referencia sin test (un capítulo que cambia de nombre) no se queda.
# Con un filtro (`--grep`) solo se rehacen las que casan y las demás se dejan.
updating=false
filtered=false
for arg in "$@"; do
  case "$arg" in
    --update-snapshots | --update-snapshots=* | -u) updating=true ;;
    --grep | --grep=* | -g | --grep-invert | --grep-invert=* | --project | --project=*) filtered=true ;;
  esac
done
if [ "$updating" = true ] && [ "$filtered" = false ]; then
  rm -rf tests/visual/__screenshots__
fi

npm run visual:run -- "$@"
