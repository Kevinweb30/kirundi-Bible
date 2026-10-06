#!/usr/bin/env node
/**
 * Builds data/daily-verses.json: the full text of every verse in the
 * DAILY_VERSES list inside index.html, in the same order. The app reads this
 * one small file to schedule its daily phone reminders (instead of having to
 * download a dozen whole books).
 *
 * Re-run after you change DAILY_VERSES in index.html:
 *     node scripts/build-daily-verses.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const m = html.match(/var DAILY_VERSES = \[(.*?)\];/s);
if (!m) { console.error('DAILY_VERSES not found in index.html'); process.exit(1); }

const out = [];
const re = /\['(\w+)',(\d+),(\d+)\]/g;
let mm;
while ((mm = re.exec(m[1]))) {
  const code = mm[1], ch = Number(mm[2]), vn = Number(mm[3]);
  const book = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'books', code + '.json'), 'utf8'));
  const chData = book.chapters[String(ch)];
  let v = chData && chData.verses.find(function (x) { return x.n === vn; });
  if (!v) v = chData.verses[0];
  out.push({ code: code, ch: ch, vn: v.n, title: book.title, text: v.text });
}
fs.writeFileSync(path.join(ROOT, 'data', 'daily-verses.json'), JSON.stringify(out));
console.log('Wrote data/daily-verses.json with ' + out.length + ' verses');
