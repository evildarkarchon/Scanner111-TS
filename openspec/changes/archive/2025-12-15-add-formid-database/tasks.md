# Implementation Tasks

Ordered list of implementation tasks for the FormID database feature.

## Phase 1: Core FormID Infrastructure

### Task 1.1: Add FormID Types
- [x] **Completed**

**Files**: `src/types/index.ts`
**Description**: Add TypeScript type definitions for FormID analysis.
**Deliverables**:
- `ExtractedFormId` interface
- `FormIdDatabaseEntry` interface
- `FormIdMatch` interface
- `FormIdAnalysisResult` interface
- `FormIdAnalysisConfig` interface
**Verification**: TypeScript compiles without errors

### Task 1.2: Implement FormID Extractor
- [x] **Completed**

**Files**: `src/lib/formid/extractor.ts`
**Description**: Create module to extract FormIDs from callstack lines.
**Deliverables**:
- `extractFormIds(lines: string[]): ExtractedFormId[]` function
- `FORMID_PATTERN` regex constant
- Helper functions for parsing hex values
**Verification**: Unit tests pass for extraction scenarios

### Task 1.3: Add FormID Extractor Tests
- [x] **Completed**

**Files**: `tests/unit/formid/extractor.test.ts`
**Description**: Unit tests for FormID extraction.
**Test Cases**:
- Extract standard FormIDs
- Filter FF-prefix FormIDs
- Preserve NULL FormIDs
- Handle malformed input
- Empty callstack handling
**Verification**: All tests pass with `bun test`

---

## Phase 2: Database Integration

### Task 2.1: Extend Database Types
- [x] **Completed**

**Files**: `src/lib/database/index.ts`
**Description**: Add FormID database support to DatabaseManager.
**Deliverables**:
- `loadFormIdDatabase(game, path)` method
- `lookupFormId(formId, plugin)` method
- `lookupFormIdBatch(queries)` method
- FormID database connection management
**Verification**: TypeScript compiles, database queries work

### Task 2.2: Implement SQLite FormID Queries
- [x] **Completed**

**Files**: `src/lib/database/formid-db.ts`
**Description**: SQLite query implementation for FormID lookups.
**Deliverables**:
- Connection pool for FormID databases
- Query caching (LRU cache)
- Batch query optimization
- Error handling for database issues
**Verification**: Integration tests with test database

### Task 2.3: Add Database Path Resolution
- [x] **Completed**

**Files**: `src/lib/database/paths.ts`
**Description**: Resolve FormID database file paths.
**Deliverables**:
- `getFormIdDatabasePaths(game)` function
- Platform-specific data directory detection
- Support for custom database paths
**Verification**: Paths resolve correctly on Windows

### Task 2.4: Add Database Tests
- [x] **Completed**

**Files**: `tests/unit/database/formid-db.test.ts`, `tests/fixtures/`
**Description**: Tests for FormID database operations.
**Test Cases**:
- Successful lookup
- Case-insensitive plugin matching
- Missing FormID handling
- Missing database handling
- Batch queries
**Verification**: All tests pass

---

## Phase 3: Plugin List Parsing

### Task 3.1: Implement Plugin List Parser
- [x] **Completed**

**Files**: `src/lib/scan-log/plugins.ts`
**Description**: Parse plugin list from crash log plugin segment.
**Deliverables**:
- `parsePluginList(segment: LogSegment): PluginList` function
- `PluginList` type with index-to-plugin mapping
- Support for standard and ESL plugin formats
**Verification**: Unit tests pass

### Task 3.2: Implement Plugin Index Resolver
- [x] **Completed**

**Files**: `src/lib/formid/resolver.ts`
**Description**: Resolve FormID prefixes to plugin names.
**Deliverables**:
- `resolvePluginIndex(prefix, plugins)` function
- ESL plugin handling (FE prefix)
- Unknown plugin fallback
**Verification**: Unit tests pass

### Task 3.3: Add Plugin Parser Tests
- [x] **Completed**

**Files**: `tests/unit/scan-log/plugins.test.ts`
**Description**: Tests for plugin list parsing.
**Test Cases**:
- Standard plugin list format
- ESL plugin format
- Missing indices
- Malformed entries
**Verification**: All tests pass

---

## Phase 4: FormID Analyzer

### Task 4.1: Implement FormID Analyzer
- [x] **Completed**

**Files**: `src/lib/formid/analyzer.ts`
**Description**: Main orchestration module for FormID analysis.
**Deliverables**:
- `analyzeFormIds(callstack, plugins, config)` function
- Occurrence counting
- Result aggregation
**Verification**: Integration test passes

### Task 4.2: Integrate with Scan Pipeline
- [x] **Completed**

**Files**: `src/lib/scan-log/index.ts`
**Description**: Add FormID analysis to scanCrashLog function.
**Deliverables**:
- Call FormID analyzer after segment parsing
- Add FormID results to ScanResult
- Support enableFormIdAnalysis config option
**Verification**: End-to-end test with sample crash log

### Task 4.3: Add FormID Analyzer Tests
- [x] **Completed**

**Files**: `tests/unit/formid/analyzer.test.ts`
**Description**: Tests for FormID analyzer.
**Test Cases**:
- Full analysis flow
- Database available vs unavailable
- Empty callstack
- Configuration options
**Verification**: All tests pass

---

## Phase 5: Output Formatting

### Task 5.1: Add CLI Output Formatting
- [x] **Completed**

**Files**: `src/cli.ts`
**Description**: Format FormID results for CLI output.
**Deliverables**:
- FormID section header
- Match formatting with plugin and description
- Occurrence count display
- Helpful footer text
**Verification**: Manual verification of CLI output

### Task 5.2: Add Markdown Output Formatting
- [x] **Completed**

**Files**: `src/lib/message-handler/markdown-backend.ts`
**Description**: Format FormID results for Markdown report output.
**Deliverables**:
- FormID section with `## Form ID Suspects` header
- Table format with columns: Form ID, Plugin, Description, Count
- Blockquote with helpful context about FormID interpretation
- Consistent styling with existing Markdown report sections
**Verification**: Manual verification of Markdown output

### Task 5.3: Add JSON Output Support
- [x] **Completed**

**Files**: `src/lib/scan-log/index.ts`, `src/types/index.ts`
**Description**: Include FormID analysis in JSON output.
**Deliverables**:
- `formIdAnalysis` property in ScanResult
- Proper JSON serialization
**Verification**: JSON output includes FormID data

### Task 5.4: Update IPC Interface
- [x] **Completed**

**Files**: `src/scanner-ipc.ts`, `ui/src/types.ts`
**Description**: Pass FormID analysis to Electron GUI.
**Deliverables**:
- FormID types in UI
- IPC message handling
**Verification**: GUI receives FormID data

---

## Phase 6: Documentation and Polish

### Task 6.1: Add FormID Module Exports
- [x] **Completed**

**Files**: `src/lib/formid/index.ts`, `src/index.ts`
**Description**: Export FormID module from library.
**Deliverables**:
- Module barrel export
- Library re-export
**Verification**: External imports work

### Task 6.2: Update CLAUDE.md
- [x] **Completed**

**Files**: `CLAUDE.md`
**Description**: Document new FormID feature.
**Deliverables**:
- FormID module in architecture section
- Configuration options
**Verification**: Documentation accurate

### Task 6.3: Add Integration Test
- [x] **Completed**

**Files**: `tests/integration/formid-analysis.test.ts`
**Description**: End-to-end test for FormID feature.
**Test Cases**:
- Full scan with FormID analysis
- Graceful degradation without database
**Verification**: Integration tests pass

---

## Task Dependencies

```
1.1 ─────────────────┐
                     │
1.2 ─────────────────┼──▶ 4.1 ──▶ 4.2 ──┬──▶ 5.1 (CLI)
                     │         │        │
1.3 ─────────────────┤         │        ├──▶ 5.2 (Markdown)
                     │         │        │
2.1 ──▶ 2.2 ──▶ 2.3 ─┤         │        ├──▶ 5.3 (JSON)
              │      │         ▼        │
              ▼      │       4.3        └──▶ 5.4 (IPC)
             2.4     │                       │
                     │                       │
3.1 ──▶ 3.2 ─────────┘                       │
       │                                     │
       ▼                                     │
      3.3                                    │
                                             │
6.1 ◀────────────────────────────────────────┘
 │
 ▼
6.2 ──▶ 6.3
```

## Parallelizable Work

These tasks can be worked on in parallel:
- **Phase 1 (1.1-1.3)** and **Phase 2 (2.1-2.4)** can proceed in parallel
- **Phase 5 (5.1-5.4)** output formatting tasks can proceed in parallel after 4.2
- **Phase 3 (3.1-3.3)** can proceed in parallel with Phases 1-2
- Within each phase, tests can be written alongside implementation
