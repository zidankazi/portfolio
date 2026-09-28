import assert from 'node:assert/strict';
import test from 'node:test';
import { Some, None } from '../build/dev/javascript/gleam_stdlib/gleam/option.mjs';
import { Active, Finished, Unavailable, calculate } from '../build/dev/javascript/portfolio/lib/playback_progress.mjs';

test('playback advances from the latest snapshot and rounds percentage to two decimals', () => {
  assert.deepEqual(
    calculate(true, new Some(40_000), new Some(180_000), 100_000, 105_000),
    new Active(45_000, 25),
  );
  assert.deepEqual(
    calculate(true, new Some(1_000), new Some(3_000), 100_000, 100_000),
    new Active(1_000, 33.33),
  );
});

test('paused playback and missing timing data have no progress', () => {
  for (const [playing, progress, duration] of [
    [false, new Some(40_000), new Some(180_000)],
    [true, new None(), new Some(180_000)],
    [true, new Some(40_000), new None()],
    [true, new None(), new None()],
  ]) {
    assert.deepEqual(calculate(playing, progress, duration, 100_000, 105_000), new Unavailable());
  }
});

test('a clock moving backward does not subtract from the snapshot', () => {
  assert.deepEqual(
    calculate(true, new Some(40_000), new Some(180_000), 100_000, 95_000),
    new Active(40_000, 22.22),
  );
});

test('playback finishes exactly at the duration and stays capped afterward', () => {
  for (const now of [105_000, 110_000]) {
    assert.deepEqual(
      calculate(true, new Some(175_000), new Some(180_000), 100_000, now),
      new Finished(180_000, 100),
    );
  }
});

test('zero duration preserves the card behavior: finished with zero percent', () => {
  assert.deepEqual(
    calculate(true, new Some(0), new Some(0), 100_000, 105_000),
    new Finished(0, 0),
  );
});

test('zero clocks preserve the snapshot for the server and initial client render', () => {
  assert.deepEqual(
    calculate(true, new Some(40_000), new Some(180_000), 0, 0),
    new Active(40_000, 22.22),
  );
});
