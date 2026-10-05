import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, weekday, weeks, fit, labels, next_index, valid_date } from '../build/dev/javascript/portfolio/lib/calendar.mjs';
const day = (date, count = 1, level = 2) => ({ date, count, level });
const decode = days => parse(JSON.stringify({ contributions: days }));

test('calendar validates dates and contribution ranges', () => {
  assert.equal(valid_date('2024-02-29'), true);
  assert.equal(valid_date('2025-02-29'), false);
  assert.equal(valid_date('2026-02-30'), false);
  assert.equal(valid_date('2026-13-01'), false);
  assert.equal(decode([]).isOk(), false);
  assert.equal(decode([day('2026-10-05', -1)]).isOk(), false);
  assert.equal(decode([day('2026-10-05', 1, 5)]).isOk(), false);
});

test('calendar keeps partial weeks and fits recent dates to the available width', () => {
  assert.equal(weekday('2026-10-04'), 0);
  assert.equal(weekday('2026-10-05'), 1);
  const days = decode([day('2026-10-02'), day('2026-10-03'), day('2026-10-04'), day('2026-10-05')])[0];
  assert.deepEqual(weeks(days).toArray().map(week => week.toArray().length), [2, 2]);
  assert.equal(fit(days, 0).toArray().length, 1);
  assert.deepEqual(labels(weeks(days)).toArray(), ['', '']);
  assert.equal(next_index('ArrowLeft', 3, 20), 0);
  assert.equal(next_index('ArrowRight', 18, 20), 19);
  assert.equal(next_index('Home', 5, 20), 0);
  assert.equal(next_index('End', 5, 20), 19);
});
