# FormID Database Feature - Design Document

## Overview

This document describes the architectural design for the FormID database feature, covering data flow, component interactions, and key design decisions.

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Scan Pipeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐  │
│  │ Parse Log   │────▶│ Extract      │────▶│ FormID          │  │
│  │ Segments    │     │ FormIDs      │     │ Analyzer        │  │
│  └─────────────┘     └──────────────┘     └────────┬────────┘  │
│                                                     │           │
│                                          ┌──────────▼────────┐  │
│                                          │ FormID Database   │  │
│                                          │ Manager           │  │
│                                          └──────────┬────────┘  │
│                                                     │           │
│                                          ┌──────────▼────────┐  │
│                                          │ SQLite Database   │  │
│                                          │ (*.db files)      │  │
│                                          └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Segment Parsing**: `parseLogSegments()` identifies callstack segments
2. **FormID Extraction**: `extractFormIds()` scans callstack lines for FormID patterns
3. **Plugin Matching**: Match FormID prefixes with loaded plugin indices
4. **Database Lookup**: Query SQLite database for FormID descriptions
5. **Result Assembly**: Combine matches into structured output

## Key Components

### 1. FormID Extractor (`src/lib/formid/extractor.ts`)

Extracts FormIDs from callstack text using regex pattern matching.

**Pattern**: `Form ID: 0x([0-9A-F]{8})`

**Filtering Rules**:
- Skip FormIDs starting with `FF` (plugin limit marker)
- Keep `00000000` (NULL FormID indicates errors)

```typescript
interface ExtractedFormId {
  /** Full 8-digit hex FormID */
  formId: string;
  /** Plugin index (upper 2 hex digits) */
  pluginIndex: number;
  /** Record ID (lower 6 hex digits) */
  recordId: string;
  /** Line number where found */
  lineNumber: number;
}
```

### 2. FormID Database (`src/lib/formid/database.ts`)

Manages SQLite database connections and queries.

**Database Schema** (existing format from Python):
```sql
CREATE TABLE {GameName} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin TEXT,
  formid TEXT,
  entry TEXT
);
CREATE INDEX {GameName}_index ON {GameName} (formid, plugin COLLATE nocase);
```

**Database Files**:
- `{Game} FormIDs Main.db` - Main FormID database
- `{Game} FormIDs Local.db` - User-local additions

```typescript
interface FormIdDatabaseEntry {
  /** Plugin that defines this FormID */
  plugin: string;
  /** FormID hex string (without prefix) */
  formId: string;
  /** Human-readable description */
  entry: string;
}
```

### 3. FormID Analyzer (`src/lib/formid/analyzer.ts`)

Orchestrates extraction, lookup, and result formatting.

```typescript
interface FormIdMatch {
  /** Full FormID with prefix */
  formId: string;
  /** Resolved plugin name */
  plugin: string;
  /** Database entry description (if found) */
  description?: string;
  /** Number of occurrences in log */
  count: number;
}

interface FormIdAnalysisResult {
  /** All matched FormIDs */
  matches: FormIdMatch[];
  /** Whether database was available */
  databaseAvailable: boolean;
  /** Crash generator name */
  generatorName?: string;
}
```

### 4. Plugin Index Resolver

Maps FormID prefixes to plugin names using the plugin list from crash logs.

**Load Order Mapping**:
- Plugin index `00` = Game master (Fallout4.esm)
- Plugin index `01`-`FD` = Regular plugins in load order
- Plugin index `FE` = ESL plugins (light plugins)
- Plugin index `FF` = Dynamic/runtime (skipped)

## Integration Points

### With Scan Pipeline

The FormID analyzer integrates into `scanCrashLog()`:

```typescript
// In src/lib/scan-log/index.ts
export async function scanCrashLog(config: ScanConfig): Promise<ScanResult> {
  // ... existing parsing ...

  // Extract plugins from plugin segment
  const plugins = parsePluginList(pluginSegment);

  // Extract and analyze FormIDs from callstack
  const callstackSegment = findSegment(parsed.segments, 'callstack');
  if (callstackSegment) {
    const formIdResult = await analyzeFormIds(callstackSegment.lines, plugins, {
      game: parsed.game,
      showValues: config.showFormIdValues ?? true,
    });
    // Add FormID issues to results
    issues.push(...formIdResult.issues);
  }

  // ... rest of scanning ...
}
```

### With Database Module

Extend `DatabaseManager` to support FormID queries:

```typescript
// In src/lib/database/index.ts
export class DatabaseManager {
  // ... existing methods ...

  /** Load FormID database for a game */
  async loadFormIdDatabase(game: SupportedGame, dbPath: string): Promise<DatabaseResult<void>>;

  /** Query FormID entry */
  lookupFormId(formId: string, plugin: string): FormIdDatabaseEntry | undefined;

  /** Batch query for performance */
  lookupFormIdBatch(queries: Array<{formId: string; plugin: string}>): Map<string, FormIdDatabaseEntry>;
}
```

## Database Path Resolution

Following the Python implementation pattern:

```typescript
function getFormIdDatabasePaths(game: SupportedGame): string[] {
  const dataDir = getDataDirectory(); // Platform-specific
  return [
    path.join(dataDir, 'databases', `${game} FormIDs Main.db`),
    path.join(dataDir, 'databases', `${game} FormIDs Local.db`),
  ];
}
```

## Performance Considerations

1. **Lazy Loading**: Only load FormID database when needed
2. **Connection Pooling**: Reuse SQLite connections
3. **Query Caching**: Cache recent FormID lookups (LRU cache)
4. **Batch Queries**: Use batch queries for multiple FormIDs
5. **Index Usage**: Rely on existing database indices

## Error Handling

| Scenario | Handling |
|----------|----------|
| Database file missing | Log info, continue without FormID lookup |
| Database query error | Log warning, skip affected FormID |
| Invalid FormID format | Skip silently |
| Plugin not found | Report FormID with "Unknown Plugin" |

## Configuration

New scan configuration options:

```typescript
interface ScanConfig {
  // ... existing ...

  /** Enable FormID analysis (default: true) */
  enableFormIdAnalysis?: boolean;

  /** Show FormID descriptions from database (default: true) */
  showFormIdValues?: boolean;

  /** Custom FormID database paths */
  formIdDatabasePaths?: string[];
}
```

## Output Format

### CLI Output (Text)

```
======== FORM ID SUSPECTS ========
- Form ID: 0A001234 | [ModName.esp] | Steel Sword | 3
- Form ID: 0B005678 | [AnotherMod.esp] | NPC Guard | 1

[Last number counts how many times each Form ID shows up in the crash log.]
These Form IDs were caught by Buffout4 and some of them might be related to this crash.
You can try searching any listed Form IDs in xEdit and see if they lead to relevant records.
```

### JSON Output (IPC)

```json
{
  "formIdAnalysis": {
    "matches": [
      {
        "formId": "0A001234",
        "plugin": "ModName.esp",
        "description": "Steel Sword",
        "count": 3
      }
    ],
    "databaseAvailable": true,
    "generatorName": "Buffout4"
  }
}
```

### Markdown Output (Reports)

```markdown
## Form ID Suspects

| Form ID | Plugin | Description | Count |
|---------|--------|-------------|-------|
| `0A001234` | ModName.esp | Steel Sword | 3 |
| `0B005678` | AnotherMod.esp | NPC Guard | 1 |

> **Note:** The count shows how many times each Form ID appears in the crash log.
> These Form IDs were caught by Buffout4 and some may be related to this crash.
> You can search these Form IDs in xEdit to find the relevant records.
```

## Testing Strategy

1. **Unit Tests**: FormID extraction regex, prefix parsing
2. **Integration Tests**: Database queries with test database
3. **Fixtures**: Sample crash logs with known FormIDs
4. **Edge Cases**: Missing database, malformed FormIDs, empty callstacks
