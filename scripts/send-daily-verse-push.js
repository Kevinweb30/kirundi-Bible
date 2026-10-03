#!/usr/bin/env node
/**
 * Sends today's daily verse as a push notification to everyone who has the
 * Bibiliya Kirundi app installed, via OneSignal's REST API.
 *
 * Run once a day by .github/workflows/daily-verse-notification.yml — not
 * meant to be run by hand, but safe to if you want to test (it will
 * actually send a real notification to all subscribers when you do).
 *
 * Needs two repo secrets (Settings -> Secrets and variables -> Actions):
 *   ONESIGNAL_APP_ID   - from OneSignal dashboard -> Settings -> Keys & IDs
 *   ONESIGNAL_API_KEY  - the "REST API Key" from the same page
 *
 * It reads the SAME DAILY_VERSES list and day-of-year formula that
 * index.html uses, straight out of index.html, so the push always matches
 * whatever verse the app itself shows that day — there is only one list to
 * keep in sync.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');

function fail(msg) {
  console.error('ERROR: ' + msg);
  process.exit(1);
}

function loadDailyVerses() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/var DAILY_VERSES = \[(.*?)\];/s);
  if (!m) fail('Could not find DAILY_VERSES in index.html');
  const entries = [];
  const re = /\['(\w+)',(\d+),(\d+)\]/g;
  let mm;
  while ((mm = re.exec(m[1]))) {
    entries.push([mm[1], Number(mm[2]), Number(mm[3])]);
  }
  if (!entries.length) fail('DAILY_VERSES parsed to zero entries');
  return entries;
}

// Mirrors the app's own dayOfYear()/todaysVerseRef(), but in UTC (a single
// server-side run has no single "local time" for every subscriber at once;
// OneSignal's per-subscriber timezone delivery below is what actually
// lines the notification up with each person's morning).
function dayOfYearUTC() {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start;
  return Math.floor(diff / 86400000);
}

function loadVerseText(code, ch, vn) {
  const bookPath = path.join(ROOT, 'data', 'books', code + '.json');
  if (!fs.existsSync(bookPath)) fail('Missing data/books/' + code + '.json');
  const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
  const chData = book.chapters[String(ch)];
  if (!chData) fail('Chapter ' + ch + ' not found in ' + code);
  let v = chData.verses.find(function (x) { return x.n === vn; });
  if (!v) v = chData.verses[0];
  return { title: book.title, ch: ch, vn: v.n, text: v.text };
}

function sendPush(appId, apiKey, heading, contents) {
  const body = JSON.stringify({
    app_id: appId,
    target_channel: 'push',
    included_segments: ['Subscribed Users'],
    headings: { en: heading },
    contents: { en: contents },
    // Deliver at each subscriber's own 7am, not all at once in UTC.
    delayed_option: 'timezone',
    delivery_time_of_day: '7:00AM'
  });

  const options = {
    hostname: 'api.onesignal.com',
    path: '/notifications',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Key ' + apiKey,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise(function (resolve, reject) {
    const req = https.request(options, function (res) {
      let data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error('OneSignal API ' + res.statusCode + ': ' + data));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!appId || !apiKey) {
    fail('Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY (repo secrets) before running.');
  }

  const verses = loadDailyVerses();
  const idx = dayOfYearUTC() % verses.length;
  const [code, ch, vn] = verses[idx];
  const v = loadVerseText(code, ch, vn);

  const heading = 'Ijambo ry’uyu musi — ' + v.title + ' ' + v.ch + ':' + v.vn;
  const contents = v.text;

  console.log('Sending: ' + heading);
  console.log(contents);

  const result = await sendPush(appId, apiKey, heading, contents);
  console.log('OneSignal response:', result);
}

main().catch(function (err) {
  fail(err.message || String(err));
});
