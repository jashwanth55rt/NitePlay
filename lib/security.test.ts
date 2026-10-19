import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedExternalUrl } from './security';

test('isAllowedExternalUrl permits authorized xHamster and xhcdn domains', () => {
  assert.equal(isAllowedExternalUrl('https://xhamster.com/videos/test-123'), true);
  assert.equal(isAllowedExternalUrl('https://www.xhamster.com/search/asian'), true);
  assert.equal(isAllowedExternalUrl('https://ic-vt-nss.xhcdn.com/a/thumb.webp'), true);
  assert.equal(isAllowedExternalUrl('https://video-nss.xhcdn.com/stream.m3u8'), true);
});

test('isAllowedExternalUrl rejects HTTP, private IPs, loopback, and cloud metadata', () => {
  assert.equal(isAllowedExternalUrl('http://xhamster.com/videos/test'), false);
  assert.equal(isAllowedExternalUrl('https://localhost/admin'), false);
  assert.equal(isAllowedExternalUrl('https://127.0.0.1/secrets'), false);
  assert.equal(isAllowedExternalUrl('https://169.254.169.254/latest/meta-data'), false);
  assert.equal(isAllowedExternalUrl('https://192.168.1.1/router'), false);
  assert.equal(isAllowedExternalUrl('https://10.0.0.1/internal'), false);
  assert.equal(isAllowedExternalUrl('https://malicious-site.com/hack'), false);
  assert.equal(isAllowedExternalUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedExternalUrl(''), false);
});
