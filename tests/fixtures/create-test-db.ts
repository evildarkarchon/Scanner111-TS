/**
 * Script to create a test FormID database.
 *
 * Run with: bun tests/fixtures/create-test-db.ts
 */

import { Database } from 'bun:sqlite';
import * as path from 'node:path';

const DB_PATH = path.join(import.meta.dir, 'test-formids.db');

// Create database and table
const db = new Database(DB_PATH);

db.run(`
  CREATE TABLE IF NOT EXISTS Fallout4 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plugin TEXT NOT NULL,
    formid TEXT NOT NULL,
    entry TEXT NOT NULL
  )
`);

db.run(`
  CREATE INDEX IF NOT EXISTS Fallout4_index
  ON Fallout4 (formid, plugin COLLATE NOCASE)
`);

// Insert test data
const insert = db.prepare('INSERT INTO Fallout4 (plugin, formid, entry) VALUES (?, ?, ?)');

const testData: [string, string, string][] = [
  ['Fallout4.esm', '0EAFB6', 'GhoulRace'],
  ['Fallout4.esm', '001234', 'TestWeapon'],
  ['Fallout4.esm', '005678', 'TestArmor'],
  ['DLCRobot.esm', '001000', 'AutomatronPart'],
  ['SomeMod.esp', '001234', 'ModdedItem'],
  ['SomeMod.esp', '005678', 'ModdedNPC'],
];

for (const [plugin, formid, entry] of testData) {
  insert.run(plugin, formid, entry);
}

db.close();

console.log(`Created test database at: ${DB_PATH}`);
