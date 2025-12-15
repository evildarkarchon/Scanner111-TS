<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

CLASSIC TypeScript is a port of the Python CLASSIC (Crash Log Auto Scanner & Setup Integrity Checker) application to TypeScript using the Bun runtime. It analyzes crash logs from Bethesda games to detect issues and provide diagnostic reports.

**Note:** Currently focused on Fallout 4. Skyrim support is architectural (types, game detection) but has no actual crash pattern data.

The original Python source is in `Code_to_Port/` (read-only reference, not part of this project's build).

## Commands

```bash
# CLI Development
bun run dev scan <log-path>      # Scan a crash log
bun run dev scan <log-path> -j   # Scan with JSON output (for IPC)
bun run dev info                 # Show app info

# Testing
bun test                         # Run all tests
bun test --watch                 # Watch mode
bun test tests/unit/utils.test.ts  # Run single test file

# Code Quality
bun run lint                     # Check with Biome
bun run lint:fix                 # Auto-fix issues
bun run format                   # Format code
bun run typecheck                # TypeScript check

# Build
bun run build                    # Build for production

# Electron GUI (from ui/ directory)
cd ui && bun install             # Install GUI dependencies
cd ui && bun run electron:dev    # Run Electron in dev mode
cd ui && bun run electron:build  # Build distributable app
```

## Architecture

### Path Aliases
- `@/*` → `src/*`
- `@lib/*` → `src/lib/*`
- `@types/*` → `src/types/*`

### Core Modules

**`src/lib/scan-log/`** - Crash log parsing engine
- `detectGame()` - Identifies game from log content/filename
- `parseLogSegments()` - Splits logs into typed segments (header, callstack, registers, modules, plugins)
- `scanCrashLog()` - Main entry point returning `ScanResult` with issues

**`src/lib/database/`** - Pattern matching database
- `DatabaseManager` class with singleton `database` export
- Loads YAML pattern files and matches against log lines
- Supports game-specific pattern filtering
- `FormIdDatabaseManager` for SQLite FormID database lookups
- `formIdDatabase` singleton for FormID queries

**`src/lib/formid/`** - FormID analysis system
- `extractFormIds()` - Extracts FormIDs from crash log callstack
- `resolvePluginIndex()` - Maps FormID prefixes to plugin names
- `analyzeFormIds()` - Orchestrates extraction, resolution, and database lookup
- `formatFormIdAnalysis()` - Formats results for display

**`src/lib/message-handler/`** - Output system
- `MessageHandler` singleton for centralized messaging
- Backend interface pattern (`OutputBackend`) for CLI/GUI/file output
- Severity-based filtering and formatting

**`src/lib/file-io/`** - Async file operations
- Uses Bun's native file APIs
- Returns `FileResult<T>` discriminated union for error handling
- Size limits to prevent memory issues with large files

### Type System

Core types in `src/types/index.ts`:
- `SupportedGame`: `'fallout4' | 'skyrim'`
- `ScanConfig` / `ScanResult` / `Issue` - Scanning pipeline types
- `DatabaseEntry` - Pattern definition structure
- FormID types: `ExtractedFormId`, `FormIdMatch`, `FormIdAnalysisResult`, `PluginList`

### Entry Points
- `src/cli.ts` - CLI using Commander.js (supports `--json` flag for IPC)
- `src/index.ts` - Library exports for programmatic use

### Electron GUI (`ui/`)

The desktop application uses Electron with React:

**Main Process** (`ui/electron/main.ts`):
- Creates application window
- Handles IPC via `ipcMain.handle()` for scan operations
- Spawns Bun CLI subprocess with `--json` flag for scanning

**Preload** (`ui/electron/preload.ts`):
- Exposes `window.electronAPI` with secure IPC methods
- Available methods: `scanCrashLog()`, `getAppInfo()`, `openFileDialog()`, `saveFileDialog()`

**React Frontend** (`ui/src/`):
- Components: Header, FileDropZone, ScanResults, IssueCard, StatusBar
- Uses Tailwind CSS for styling
- Communicates with main process via `window.electronAPI`

## Code Style

- **Biome** for linting/formatting (single quotes, trailing commas, semicolons)
- **Strict TypeScript** with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- File operations return `FileResult<T>` union type, not thrown exceptions
- Use `@/` path aliases for imports
