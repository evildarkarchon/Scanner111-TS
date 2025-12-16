# CLI Specification

Command-line interface for CLASSIC TypeScript crash log analyzer.

## ADDED Requirements

### Requirement: Default scan command
The CLI SHALL accept a crash log path as the first positional argument and scan it with human-readable output by default.

#### Scenario: User scans a log without explicit command
- Given a crash log file at `crash.log`
- When the user runs `classic crash.log`
- Then the CLI displays the banner
- And scans the file with colorized human-readable output
- And shows detected issues and FormID suspects

#### Scenario: User scans with game option
- Given a crash log file at `crash.log`
- When the user runs `classic crash.log --game skyrim`
- Then the CLI scans using Skyrim-specific patterns

### Requirement: JSON output command
The CLI SHALL provide a `json` command that outputs scan results as JSON without any banner or decorative output.

#### Scenario: User requests JSON output
- Given a crash log file at `crash.log`
- When the user runs `classic json crash.log`
- Then the CLI outputs only valid JSON to stdout
- And does not display the banner
- And the JSON contains `status`, `issues`, `metadata`, and `formIdAnalysis` fields

#### Scenario: JSON output with game option
- Given a crash log file at `crash.log`
- When the user runs `classic json crash.log --game fallout4`
- Then the CLI outputs JSON using Fallout 4 patterns

### Requirement: Explicit scan command alias
The CLI SHALL support `scan` as an explicit command that behaves identically to the default scan behavior.

#### Scenario: User uses explicit scan command
- Given a crash log file at `crash.log`
- When the user runs `classic scan crash.log`
- Then the behavior is identical to `classic crash.log`

## REMOVED Requirements

### Requirement: JSON flag on scan command
The `--json` / `-j` flag on the scan command MUST be removed in favor of the dedicated `json` command.

#### Scenario: User attempts old JSON flag syntax
- When the user runs `classic scan crash.log --json`
- Then the CLI reports an unknown option error
