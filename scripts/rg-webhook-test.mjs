#!/usr/bin/env node
// Rapid Gateway signed-webhook test harness.
//
// Sends a signed `webhook.test` event to a public HTTPS URL running
// public/api/webhook.php and prints the HTTP status, confirming the
// signature is verified and a 2xx is returned.
//
//   # Local verification (no deployment needed) — proves the HMAC logic:
//   node scripts/rg-webhook-test.mjs self-test
//
//   # Against a deployed endpoint (after uploading dist/ with RG_WEBHOOK_SECRET set):
//   node scripts/rg-webhook-test.mjs \
//     --url https://storium.online/api/webhook.php \
//     --secret <RG_WEBHOOK_SECRET>
//
// Secrets can also come from env: RG_WEBHOOK_URL / RG_WEBHOOK_SECRET.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

// Build the same payload Rapid Gateway would POST for a connectivity test.
function buildTestEvent() {
  return JSON.stringify({
    id: 'evt_test_' + Math.random().toString(36).slice(2, 12),
    type: 'webhook.test',
    created: Math.floor(Date.now() / 1000),
    data: {},
  });
}

function sign(rawBody, secret) {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

function sendSignedEvent(url, secret) {
  const rawBody = buildTestEvent();
  const signature = sign(rawBody, secret);
  const u = new URL(url);

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(rawBody),
          'X-RG-Signature': signature,
          'User-Agent': 'rg-webhook-test/1.0',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.write(rawBody);
    req.end();
  });
}

// Replicates the exact verification in public/api/webhook.php (HMAC-SHA256,
// constant-time compare) against a local HTTP server. Sends one valid event
// (expects 200) and one tampered event (expects 401).
async function runSelfTest() {
  const secret = 'test-webhook-secret';

  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const signature = req.headers['x-rg-signature'];
      const expected = sign(rawBody, secret);
      const sigOk =
        typeof signature === 'string' &&
        Buffer.from(expected, 'utf8').length === Buffer.from(signature, 'utf8').length &&
        timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));

      res.setHeader('Content-Type', 'application/json');
      if (!sigOk) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Invalid signature.' }));
        return;
      }
      let event = null;
      try {
        event = JSON.parse(rawBody);
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
        return;
      }
      // payment.succeeded would push to Supabase (service role); webhook.test is acknowledge-only.
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, type: event.type }));
    });
  });

  const listen = () =>
    new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
  const close = () => new Promise((resolve) => server.close(resolve));
  const post = (body, signature) =>
    new Promise((resolve, reject) => {
      const port = server.address().port;
      const req = httpRequest(
        {
          hostname: '127.0.0.1',
          port,
          path: '/webhook.php',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'X-RG-Signature': signature,
          },
        },
        (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => resolve({ status: res.statusCode, body: b }));
        }
      );
      req.on('error', reject);
      req.end(body);
    });

  const port = await listen();
  const validEvent = buildTestEvent();
  const validSig = sign(validEvent, secret);

  const ok = await post(validEvent, validSig);
  const bad = await post(buildTestEvent(), 'tampered-signature-value');

  await close();

  console.log('── Rapid Gateway webhook self-test ─────────────────────────');
  console.log(`Self-test server : http://127.0.0.1:${port}/webhook.php`);
  console.log(`Valid signature  : POST webhook.test -> ${ok.status} ${ok.body}`);
  console.log(`Tampered sig     : POST webhook.test -> ${bad.status} ${bad.body}`);
  console.log('────────────────────────────────────────────────────────────');
  const pass = ok.status === 200 && bad.status === 401;
  console.log(pass ? 'PASS: signature verified and handler returns 2xx.' : 'FAIL: unexpected response codes.');
  process.exitCode = pass ? 0 : 1;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('self-test')) {
    await runSelfTest();
    return;
  }

  const url = getArg(args, '--url') || process.env.RG_WEBHOOK_URL || 'https://storium.online/api/webhook.php';
  const secret = getArg(args, '--secret') || process.env.RG_WEBHOOK_SECRET || '';

  if (!secret) {
    console.error('Missing --secret (or RG_WEBHOOK_SECRET env). Cannot sign the event.');
    process.exitCode = 2;
    return;
  }

  console.log(`Sending signed webhook.test to ${url} …`);
  try {
    const { status, body } = await sendSignedEvent(url, secret);
    console.log(`HTTP ${status}  ${body}`);
    if (status >= 200 && status < 300) {
      console.log('PASS: endpoint verified the signature and returned 2xx.');
    } else {
      console.log('Note: non-2xx — check that RG_WEBHOOK_SECRET on the server matches --secret.');
    }
  } catch (err) {
    console.error(`Network error: ${err.message}`);
    process.exitCode = 3;
  }
}

function getArg(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : '';
}

main();