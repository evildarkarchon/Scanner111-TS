# CLASSIC TypeScript

**Crash Log Auto Scanner & Setup Integrity Checker** - TypeScript port using Bun runtime.

This is a TypeScript port of the [CLASSIC Python project](https://github.com/evildarkarchon/CLASSIC-Fallout4), a high-performance crash log analyzer for Bethesda games (Fallout 4 and Skyrim).

## Features

- 🔍 Crash log analysis for Fallout 4 and Skyrim
- 🎯 Pattern-based issue detection
- 📊 Detailed diagnostic reports
- ⚡ Fast async file I/O with Bun
- 🎨 Colorized CLI output
- 🖥️ Desktop GUI with Electron + React

## Requirements

- [Bun](https://bun.sh/) v1.0 or later

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd Scanner111-TS

# Install dependencies
bun install
```

## Usage

### CLI

```bash
# Scan a crash log
bun run dev scan path/to/crash.log

# Scan with options
bun run dev scan path/to/crash.log --game fallout4 --verbose

# Scan with JSON output (for programmatic use)
bun run dev scan path/to/crash.log --json

# Show application info
bun run dev info
```

### Desktop GUI

```bash
# Install GUI dependencies
cd ui
bun install

# Run in development mode
bun run electron:dev

# Build distributable app
bun run electron:build
```

### As a Library

```typescript
import { scanCrashLog, detectGame } from './src/index.ts';

const result = await scanCrashLog({
  logPath: '/path/to/crash.log',
  game: 'fallout4',
  verbose: true,
});

console.log(`Found ${result.issues.length} issues`);
```

## Development

```bash
# Run CLI in development
bun run dev

# Run tests
bun test

# Run tests with watch
bun test --watch

# Lint code
bun run lint

# Format code
bun run format

# Type check
bun run typecheck

# Build for production
bun run build
```

## Project Structure

```
src/
├── cli.ts                 # CLI entry point
├── index.ts               # Library exports
├── types/                 # TypeScript type definitions
├── lib/
│   ├── constants.ts       # Application constants
│   ├── database/          # Pattern database management
│   ├── file-io/           # File operations
│   ├── message-handler/   # Output handling
│   ├── scan-log/          # Crash log scanning
│   └── utils/             # Utility functions
ui/                        # Electron desktop app
├── electron/
│   ├── main.ts            # Main process
│   └── preload.ts         # IPC bridge
├── src/
│   ├── App.tsx            # React app
│   └── components/        # UI components
└── package.json           # GUI dependencies
tests/
├── unit/                  # Unit tests
└── integration/           # Integration tests
```

## Porting Progress

This project is a port of the Python CLASSIC application. The following modules need to be ported:

- [x] Core types and constants
- [x] File I/O operations
- [x] Message handler system
- [x] Basic scan log functionality
- [x] CLI interface (with `--json` flag for IPC)
- [x] GUI interface (Electron + React)
- [ ] Full pattern database
- [ ] Game integrity checking
- [ ] Papyrus log analysis
- [ ] Settings management

## License

See the original CLASSIC project for license information.
