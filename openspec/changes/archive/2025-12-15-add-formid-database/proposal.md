# Add FormID Database Feature

## Summary

Implement the FormID database feature from the original Python CLASSIC application. This feature extracts FormIDs from crash log callstacks, matches them against a SQLite database to resolve human-readable descriptions, and identifies which plugins introduced each FormID - helping users pinpoint the source of crashes.

## Motivation

FormIDs are unique identifiers for records (NPCs, weapons, items, etc.) in Bethesda games. When a crash occurs, the callstack often contains FormIDs that point to specific records involved in the crash. By looking up these FormIDs in a database, users can identify:

1. Which plugin introduced the problematic record
2. What type of record it is (NPC, weapon, etc.)
3. The human-readable name/description of the record

This is a core diagnostic feature that significantly improves crash analysis capabilities.

## Scope

### In Scope

1. **FormID Extraction**: Parse FormIDs from crash log callstack segments
2. **FormID Database Loading**: Load SQLite databases containing FormID mappings
3. **FormID Lookup**: Query the database to resolve FormID descriptions
4. **FormID Matching**: Match extracted FormIDs with loaded plugins to identify responsible mods
5. **Reporting**: Include FormID analysis results in scan output

### Out of Scope

1. FormID database creation/management GUI (separate tool)
2. Automatic FormID database updates
3. Online FormID lookups

## Dependencies

- Existing `src/lib/database/` module (will be extended)
- Existing `src/lib/scan-log/` module (will be extended)
- `better-sqlite3` or `sql.js` for SQLite access in Bun

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| SQLite library compatibility with Bun | Medium | Use `bun:sqlite` native module or well-tested alternative |
| Database file size/performance | Low | Use indexed queries, optional feature flag |
| Missing FormID database files | Low | Graceful degradation when database unavailable |

## Success Criteria

1. FormIDs are correctly extracted from callstack segments
2. FormIDs are resolved to plugin names and descriptions when database available
3. Scan results include FormID analysis section
4. Feature degrades gracefully when database is unavailable
5. Performance remains acceptable (< 100ms for typical lookups)
