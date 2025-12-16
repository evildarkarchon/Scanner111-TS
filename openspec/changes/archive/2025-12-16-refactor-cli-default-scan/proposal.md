# Proposal: Refactor CLI Default Scan

## Why

The current CLI requires users to type `classic scan <log-path>` to scan a crash log, even though scanning is the primary use case. This adds unnecessary friction. Users expect to simply run `classic <log-path>` for the most common operation.

Additionally, the `--json` flag on the scan command conflates two different concerns: human-readable CLI output and machine-readable IPC output. Separating these into distinct commands makes the interface clearer and allows each mode to evolve independently.

## What Changes

1. **Make scan the default command** - Running `classic <log-path>` will scan the file (equivalent to current `classic scan <log-path>`)
2. **Create `json` verb for machine output** - Running `classic json <log-path>` outputs JSON (replacing `classic scan <log-path> --json`)
3. **Keep `scan` as explicit alias** - `classic scan <log-path>` continues to work for discoverability
4. **Update Electron IPC** - Change from `scan <path> --json` to `json <path>`

## Scope

- `src/cli.ts` - CLI command structure
- `ui/electron/main.ts` - IPC scanner invocation

## Out of Scope

- No changes to scan logic or output format
- No changes to the `info` command
- No new features beyond command restructuring
