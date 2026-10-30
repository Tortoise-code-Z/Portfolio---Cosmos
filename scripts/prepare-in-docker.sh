#!/usr/bin/env bash
# Lo comparten los scripts que corren dentro de la imagen oficial de Playwright (`visual-in-docker.sh`,
# `stills-in-docker.sh`; los lanza `scripts/playwrightImage.ts`): instala y construye el sitio. Se carga con
# `source`, así que las variables de entorno siguen en el script que lo carga.

want="$(cut -d. -f1 .nvmrc)"
have="$(node --version | sed 's/^v//' | cut -d. -f1)"
if [ "$have" != "$want" ]; then
  # Solo cambia con qué Node se instala y se construye; el navegador que pinta es el de la imagen.
  echo "[docker] The image brings Node $(node --version) and .nvmrc asks for $want: installing without engine-strict." >&2
  export npm_config_engine_strict=false
fi

# En Docker Desktop, `localhost` lleva a `::1` al escuchar y a `127.0.0.1` al conectar (sin IPv6 configurada, Node
# solo pide direcciones IPv4 al conectar): el servidor del pre-renderizado del build no recibía sus peticiones
# (ECONNREFUSED). Con IPv4 primero, los dos van a 127.0.0.1.
export NODE_OPTIONS="--dns-result-order=ipv4first${NODE_OPTIONS:+ $NODE_OPTIONS}"

npm ci --no-audit --no-fund
npm run build
