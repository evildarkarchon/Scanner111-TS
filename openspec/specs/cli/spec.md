# cli Specification

## Purpose

Command-line interface for CLASSIC TypeScript crash log analyzer, providing human-readable and machine-readable output modes for crash log analysis.

## Requirements

### Requirement: Default scan command

The CLI SHALL accept a crash log path as the first positional argument and scan it with human-readable output by default.

**Acceptance Criteria**:
- Accept crash log path as first positional argument
- Display application banner before scan output
- Output colorized human-readable results
- Show detected issues and FormID suspects
- Support `--game` option for game-specific patterns

#### Scenario: User scans a log without explicit command

**Given** a crash log file at `crash.log`

**When** the user runs `classic crash.log`

**Then**:
- The CLI displays the banner
- Scans the file with colorized human-readable output
- Shows detected issues and FormID suspects

#### Scenario: User scans with game option

**Given** a crash log file at `crash.log`

**When** the user runs `classic crash.log --game skyrim`

**Then** the CLI scans using Skyrim-specific patterns

---

### Requirement: JSON output command

The CLI SHALL provide a `json` command that outputs scan results as JSON without any banner or decorative output.

**Acceptance Criteria**:
- Provide `json` command for machine-readable output
- Output only valid JSON to stdout
- Suppress banner and decorative output
- Include `status`, `issues`, `metadata`, and `formIdAnalysis` fields
- Support same options as default scan (`--game`, `--verbose`, etc.)

#### Scenario: User requests JSON output

**Given** a crash log file at `crash.log`

**When** the user runs `classic json crash.log`

**Then**:
- The CLI outputs only valid JSON to stdout
- Does not display the banner
- The JSON contains `status`, `issues`, `metadata`, and `formIdAnalysis` fields

#### Scenario: JSON output with game option

**Given** a crash log file at `crash.log`

**When** the user runs `classic json crash.log --game fallout4`

**Then** the CLI outputs JSON using Fallout 4 patterns

---

### Requirement: Explicit scan command alias

The CLI SHALL support `scan` as an explicit command that behaves identically to the default scan behavior.

**Acceptance Criteria**:
- Provide `scan` command as explicit alias
- Behavior identical to default positional argument usage
- Support all same options (`--game`, `--verbose`, etc.)

#### Scenario: User uses explicit scan command

**Given** a crash log file at `crash.log`

**When** the user runs `classic scan crash.log`

**Then** the behavior is identical to `classic crash.log`
