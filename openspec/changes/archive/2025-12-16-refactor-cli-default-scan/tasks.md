# Implementation Tasks

Ordered list of implementation tasks for CLI refactoring.

## Task 1: Refactor CLI Command Structure
**Files**: `src/cli.ts`
**Description**: Restructure Commander.js commands to make scan the default.
**Deliverables**:
- [x] Add default command that accepts `<log-path>` argument
- [x] Create `json` command with same options as scan (minus `--json` flag)
- [x] Keep `scan` command as explicit alias pointing to same handler
- [x] Remove `--json` flag from scan command
- [x] Suppress banner for `json` command
**Verification**:
- [x] `classic path/to/log.log` scans with human output
- [x] `classic scan path/to/log.log` scans with human output
- [x] `classic json path/to/log.log` outputs JSON only
- [x] `classic info` still works

## Task 2: Update Electron IPC
**Files**: `ui/electron/main.ts`
**Description**: Update scanner invocation to use new `json` command.
**Deliverables**:
- [x] Change spawn args from `['scan', filePath, '--json']` to `['json', filePath]`
**Verification**: Electron GUI scans files and displays results correctly

## Task 3: Update Tests (if any)
**Files**: `tests/**/*.test.ts`
**Description**: Update any CLI-related tests to match new command structure.
**Deliverables**:
- [x] Search for tests that invoke CLI commands
- [x] Update command invocations if found (none found)
**Verification**: [x] All tests pass with `bun test` (106 tests pass)

---

## Task Dependencies

```
Task 1 ──▶ Task 2
         │
         └──▶ Task 3
```

Tasks 2 and 3 depend on Task 1 being complete.
