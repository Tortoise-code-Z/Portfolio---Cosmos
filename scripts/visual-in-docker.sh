#!/usr/bin/env bash
# Corre dentro de la imagen oficial de Playwright: lo lanza `scripts/visual.ts` (`npm run visual`,
# docs/05-tecnico/calidad.md → «Regresión visual»). Los argumentos van a Playwright (`--update-snapshots`, `--grep`…).
set -euo pipefail

source scripts/prepare-in-docker.sh

# Al regenerar todas, se borran antes: una referencia sin test (un capítulo que cambia de nombre) no se queda. Solo
# cuando no llega nada más que la marca de actualizar: con cualquier otro argumento (un filtro, un archivo, `--shard`…)
# Playwright rehace solo una parte y las demás se dejan como están.
if [ "$#" -eq 1 ]; then
  case "$1" in
    --update-snapshots | --update-snapshots=* | -u) rm -rf tests/visual/__screenshots__ ;;
  esac
fi

npm run visual:run -- "$@"
