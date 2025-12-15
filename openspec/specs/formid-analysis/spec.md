# formid-analysis Specification

## Purpose
TBD - created by archiving change add-formid-database. Update Purpose after archive.
## Requirements
### Requirement: FormID Extraction from Callstack

The system SHALL extract FormIDs from crash log callstack segments using pattern matching.

**Acceptance Criteria**:
- Extract FormIDs matching pattern `Form ID: 0x[0-9A-F]{8}`
- Filter out FormIDs starting with `FF` (dynamic/runtime forms)
- Preserve NULL FormIDs (`00000000`) as they indicate error conditions
- Return extracted FormIDs with line number context

#### Scenario: Extract FormIDs from typical Buffout4 callstack

**Given** a crash log callstack segment containing:
```
[0] 0x7FF6B1234567 Fallout4.exe+0x1234567
    Form ID: 0x0A001234
    File: "ModName.esp"
[1] 0x7FF6B2345678 Fallout4.exe+0x2345678
    Form ID: 0x0B005678
    File: "AnotherMod.esp"
```

**When** FormID extraction is performed on this segment

**Then** the result contains:
- FormID `0A001234` at line 2
- FormID `0B005678` at line 5

#### Scenario: Filter out dynamic FormIDs

**Given** a callstack containing `Form ID: 0xFF001234`

**When** FormID extraction is performed

**Then** this FormID is excluded from results (FF prefix indicates dynamic form)

#### Scenario: Preserve NULL FormIDs

**Given** a callstack containing `Form ID: 0x00000000`

**When** FormID extraction is performed

**Then** this FormID is included (NULL FormID indicates error condition)

---

### Requirement: FormID Database Loading

The system SHALL load SQLite databases containing FormID-to-description mappings.

**Acceptance Criteria**:
- Support loading `{Game} FormIDs Main.db` and `{Game} FormIDs Local.db`
- Query table named after game (e.g., `Fallout4`)
- Handle missing database files gracefully
- Cache database connections for performance

#### Scenario: Load existing FormID database

**Given** a FormID database file exists at `data/databases/Fallout4 FormIDs Main.db`

**When** the database manager loads FormID databases for Fallout 4

**Then** the database is accessible for queries

#### Scenario: Handle missing database gracefully

**Given** no FormID database files exist

**When** the database manager attempts to load FormID databases

**Then**:
- No error is thrown
- The system reports database unavailable
- Scan continues without FormID descriptions

---

### Requirement: FormID Lookup

The system SHALL query FormID databases to retrieve human-readable descriptions.

**Acceptance Criteria**:
- Query by FormID (6 hex digits) and plugin name
- Return entry description if found
- Support case-insensitive plugin name matching
- Return undefined for unmatched FormIDs

#### Scenario: Successful FormID lookup

**Given** a loaded FormID database containing:
| plugin | formid | entry |
|--------|--------|-------|
| Fallout4.esm | 001234 | Steel Sword |

**When** looking up FormID `001234` for plugin `Fallout4.esm`

**Then** the result is `"Steel Sword"`

#### Scenario: Case-insensitive plugin matching

**Given** a database entry for plugin `Fallout4.esm`

**When** looking up with plugin name `fallout4.ESM`

**Then** the lookup succeeds (case-insensitive)

#### Scenario: FormID not found

**Given** a loaded FormID database

**When** looking up a FormID that doesn't exist

**Then** the result is `undefined`

---

### Requirement: Plugin Index Resolution

The system SHALL resolve FormID prefixes to plugin names using the crash log plugin list.

**Acceptance Criteria**:
- Parse plugin list from crash log plugin segment
- Map 2-digit hex prefix to plugin index
- Handle ESL plugins (FE prefix with extended index)
- Report "Unknown Plugin" for unresolved indices

#### Scenario: Resolve standard plugin index

**Given** a plugin list:
```
[00] Fallout4.esm
[01] DLCRobot.esm
[0A] ModName.esp
```

**When** resolving FormID prefix `0A`

**Then** the result is `"ModName.esp"`

#### Scenario: Handle missing plugin index

**Given** a plugin list without index `0C`

**When** resolving FormID prefix `0C`

**Then** the result is `"Unknown Plugin [0C]"`

---

### Requirement: FormID Analysis Integration

The system SHALL integrate FormID analysis into the crash log scanning pipeline.

**Acceptance Criteria**:
- Automatically analyze FormIDs when callstack segment exists
- Include FormID matches in scan results
- Count occurrences of each FormID
- Support enabling/disabling via configuration

#### Scenario: Complete FormID analysis flow

**Given**:
- A crash log with callstack containing FormIDs
- A plugin list segment
- A FormID database is available

**When** scanning the crash log with FormID analysis enabled

**Then** the scan result includes:
- List of FormID matches with plugin names
- FormID descriptions from database
- Occurrence counts for each FormID

#### Scenario: FormID analysis disabled

**Given** scan configuration with `enableFormIdAnalysis: false`

**When** scanning a crash log

**Then** no FormID analysis is performed

---

### Requirement: FormID Analysis Output

The system SHALL include FormID analysis results in scan output.

**Acceptance Criteria**:
- Include FormID section in CLI text output
- Include FormID section in Markdown report output
- Include `formIdAnalysis` object in JSON output
- Display helpful context about FormID interpretation
- Format output consistently with existing scan sections

#### Scenario: CLI text output format

**Given** FormID analysis results with matches

**When** generating CLI text output

**Then** the output includes:
```
======== FORM ID SUSPECTS ========
- Form ID: 0A001234 | [ModName.esp] | Steel Sword | 3
[Count shows occurrences in crash log]
```

#### Scenario: JSON output format

**Given** FormID analysis results

**When** generating JSON output

**Then** the output includes:
```json
{
  "formIdAnalysis": {
    "matches": [...],
    "databaseAvailable": true
  }
}
```

#### Scenario: Markdown report output format

**Given** FormID analysis results with matches

**When** generating Markdown report output

**Then** the output includes:
```markdown

