# AGENTS.md

## Cursor Cloud specific instructions

Wave Terminal is an Electron desktop app (React 19 + TypeScript frontend) with a
Go backend (`wavesrv`) that Electron spawns as a child process, plus the `wsh`
CLI. Build orchestration is done with [Task](https://taskfile.dev) (`Taskfile.yml`);
`BUILD.md` is the source of truth for build/run commands. Prerequisites (Go, Node 22,
Task, Zig) are already installed in the environment snapshot; the startup update
script runs `task init` to refresh npm and Go dependencies.

### Running the app (dev mode)

- Run the full app with `task dev` (builds `wavesrv` + `wsh` + tsunami scaffold, then
  runs `electron-vite dev` with HMR). First run of a fresh checkout takes a couple of
  minutes because it compiles the Go backend with Zig CGO.
- This is a GUI app. In the cloud VM you must run it against the virtual display and
  disable the Electron/Chromium sandbox (non-root container user):
  `export DISPLAY=:1 && export ELECTRON_DISABLE_SANDBOX=1` before `task dev`.
  Run it in a tmux-backed session so the Electron process stays alive.
- Non-fatal noise you can ignore in the logs/terminal: `Failed to connect to the bus`
  (no dbus), `WebGL2 blocklisted` (software GL fallback), and the shell warning
  `npm is not compatible with the "npm_config_prefix" environment variable`. None of
  these block the app or terminal from working.
- Backend logs (both the Electron/Node side and the Go `wavesrv`) go to
  `~/.waveterm-dev/waveapp.log`. Frontend logs are in the Electron window's DevTools.
- Dev data/config live under `~/.waveterm-dev` (see `task dev:cleardata` /
  `task dev:clearconfig` to reset first-run state).

### Lint / test / build

- Frontend unit tests: `npm test` (Vitest). All pass.
- Typecheck: `task check:ts` (`npx tsc --noEmit`). NOTE: this currently reports
  pre-existing errors in `frontend/preview/**` mock files (stale mock types). These
  are not caused by env setup and do not affect `electron-vite` building/running the app.
- Lint: `npx eslint .` — passes with 0 errors (many pre-existing warnings).
- Go tests: `go test ./...`. NOTE: `pkg/tsgen` `TestGenerateWaveEventTypes` is a
  pre-existing failure (the test expects a single-line `WaveEventName` union but the
  generator now emits a multi-line union); all other Go packages pass.
- Faster backend-only Go build for iterating on `wavesrv`/`wsh`: `task build:backend`.
- After changing RPC/config Go types, regenerate TS/Go bindings with `task generate`
  (this rewrites `frontend/types/gotypes.d.ts` and related generated files).

### Optional / not required for core app

- Docs site (`task docsite`), component preview (`task preview`), and Tsunami
  (`task tsunami:frontend:dev`, `task tsunami:demo:todo`) are separate optional targets.
- Wave Cloud endpoints (`*-dev.waveterm.dev`) and external AI providers / SSH hosts are
  optional; the app runs and terminals work without them.
