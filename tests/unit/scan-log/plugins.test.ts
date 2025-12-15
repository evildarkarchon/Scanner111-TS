/**
 * Unit tests for plugin list parser module.
 */

import { describe, expect, test } from 'bun:test';
import type { LogSegment } from '@/lib/scan-log/index.ts';
import {
  getPluginByIndex,
  parsePluginEntry,
  parsePluginList,
  pluginListToDict,
} from '@/lib/scan-log/plugins.ts';

describe('parsePluginEntry', () => {
  test('parses standard plugin entry', () => {
    const entry = parsePluginEntry('[00]     Fallout4.esm');
    expect(entry).toEqual({
      index: '00',
      filename: 'Fallout4.esm',
      isLight: false,
    });
  });

  test('parses plugin with hex index', () => {
    const entry = parsePluginEntry('[0A]     SomeMod.esp');
    expect(entry).toEqual({
      index: '0A',
      filename: 'SomeMod.esp',
      isLight: false,
    });
  });

  test('parses plugin with lowercase hex', () => {
    const entry = parsePluginEntry('[ab]     AnotherMod.esp');
    expect(entry).toEqual({
      index: 'AB',
      filename: 'AnotherMod.esp',
      isLight: false,
    });
  });

  test('parses light plugin entry', () => {
    const entry = parsePluginEntry('[FE:001] LightPlugin.esl');
    expect(entry).toEqual({
      index: 'FE:001',
      filename: 'LightPlugin.esl',
      isLight: true,
    });
  });

  test('handles tab separator', () => {
    const entry = parsePluginEntry('[10]\tModName.esp');
    expect(entry).toEqual({
      index: '10',
      filename: 'ModName.esp',
      isLight: false,
    });
  });

  test('handles plugin names with spaces', () => {
    const entry = parsePluginEntry('[10]     Unofficial Fallout 4 Patch.esp');
    expect(entry).toEqual({
      index: '10',
      filename: 'Unofficial Fallout 4 Patch.esp',
      isLight: false,
    });
  });

  test('returns undefined for invalid lines', () => {
    expect(parsePluginEntry('PLUGINS:')).toBeUndefined();
    expect(parsePluginEntry('')).toBeUndefined();
    expect(parsePluginEntry('Not a plugin line')).toBeUndefined();
    expect(parsePluginEntry('[XX]     Invalid.esp')).toBeUndefined();
  });

  test('returns undefined for incomplete entries', () => {
    expect(parsePluginEntry('[00]')).toBeUndefined();
    expect(parsePluginEntry('[00]     ')).toBeUndefined();
  });
});

describe('parsePluginList', () => {
  test('parses plugin list segment', () => {
    const segment: LogSegment = {
      type: 'plugins',
      startLine: 100,
      endLine: 105,
      lines: [
        'PLUGINS:',
        '\t[00]     Fallout4.esm',
        '\t[01]     DLCRobot.esm',
        '\t[02]     DLCworkshop01.esm',
        '\t[0A]     SomeMod.esp',
      ],
    };

    const result = parsePluginList(segment);

    expect(result.totalCount).toBe(4);
    expect(result.plugins.size).toBe(4);
    expect(result.lightPlugins.size).toBe(0);

    expect(result.plugins.get('00')?.filename).toBe('Fallout4.esm');
    expect(result.plugins.get('01')?.filename).toBe('DLCRobot.esm');
    expect(result.plugins.get('0A')?.filename).toBe('SomeMod.esp');
  });

  test('separates light plugins', () => {
    const segment: LogSegment = {
      type: 'plugins',
      startLine: 100,
      endLine: 105,
      lines: [
        'PLUGINS:',
        '\t[00]     Fallout4.esm',
        '\t[FE:000] Light1.esl',
        '\t[FE:001] Light2.esl',
      ],
    };

    const result = parsePluginList(segment);

    expect(result.plugins.size).toBe(1);
    expect(result.lightPlugins.size).toBe(2);
    expect(result.lightPlugins.get('FE:000')?.filename).toBe('Light1.esl');
    expect(result.lightPlugins.get('FE:001')?.filename).toBe('Light2.esl');
  });

  test('handles undefined segment', () => {
    const result = parsePluginList(undefined);

    expect(result.totalCount).toBe(0);
    expect(result.plugins.size).toBe(0);
    expect(result.lightPlugins.size).toBe(0);
  });

  test('handles wrong segment type', () => {
    const segment: LogSegment = {
      type: 'callstack',
      startLine: 0,
      endLine: 10,
      lines: ['Call Stack:', 'some content'],
    };

    const result = parsePluginList(segment);

    expect(result.totalCount).toBe(0);
  });

  test('handles empty segment', () => {
    const segment: LogSegment = {
      type: 'plugins',
      startLine: 0,
      endLine: 0,
      lines: [],
    };

    const result = parsePluginList(segment);

    expect(result.totalCount).toBe(0);
  });
});

describe('getPluginByIndex', () => {
  const segment: LogSegment = {
    type: 'plugins',
    startLine: 0,
    endLine: 5,
    lines: [
      '\t[00]     Fallout4.esm',
      '\t[01]     DLCRobot.esm',
      '\t[0A]     SomeMod.esp',
      '\t[FE:000] LightPlugin.esl',
    ],
  };
  const pluginList = parsePluginList(segment);

  test('finds plugin by hex index', () => {
    expect(getPluginByIndex('00', pluginList)).toBe('Fallout4.esm');
    expect(getPluginByIndex('01', pluginList)).toBe('DLCRobot.esm');
    expect(getPluginByIndex('0A', pluginList)).toBe('SomeMod.esp');
  });

  test('handles lowercase index', () => {
    expect(getPluginByIndex('0a', pluginList)).toBe('SomeMod.esp');
  });

  test('returns undefined for unknown index', () => {
    expect(getPluginByIndex('FF', pluginList)).toBeUndefined();
    expect(getPluginByIndex('99', pluginList)).toBeUndefined();
  });

  test('finds light plugin by full index', () => {
    expect(getPluginByIndex('FE:000', pluginList)).toBe('LightPlugin.esl');
  });
});

describe('pluginListToDict', () => {
  test('creates filename to index mapping', () => {
    const segment: LogSegment = {
      type: 'plugins',
      startLine: 0,
      endLine: 5,
      lines: ['\t[00]     Fallout4.esm', '\t[0A]     SomeMod.esp', '\t[FE:000] LightPlugin.esl'],
    };
    const pluginList = parsePluginList(segment);

    const dict = pluginListToDict(pluginList);

    expect(dict.get('Fallout4.esm')).toBe('00');
    expect(dict.get('SomeMod.esp')).toBe('0A');
    expect(dict.get('LightPlugin.esl')).toBe('FE:000');
  });

  test('handles empty plugin list', () => {
    const pluginList = parsePluginList(undefined);
    const dict = pluginListToDict(pluginList);

    expect(dict.size).toBe(0);
  });
});
