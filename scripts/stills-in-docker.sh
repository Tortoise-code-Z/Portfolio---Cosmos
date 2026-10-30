#!/usr/bin/env bash
# Corre dentro de la imagen oficial de Playwright: lo lanza `scripts/stills.ts` (`npm run stills`, ADR-029). Saca
# las fotos fijas del modo sin WebGL a `src/assets/scene-stills/` (`tests/stills/stills.spec.ts`).
set -euo pipefail

source scripts/prepare-in-docker.sh

npm run stills:run -- "$@"
