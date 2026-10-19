import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedExternalUrl, ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_PROXY_BYTES } from './security.ts';

test('isAllowedExternalUrl permits authorized xHamster and xhcdn domains', () => {
  assert.equal(isAllowedExternalUrl('https://xhamster.com/videos/test-123'), true);
  assert.equal(isAllowedExternalUrl('https://www.xhamster.com/search/asian'), true);
  assert.equal(isAllowedExternalUrl('https://ic-vt-nss.xhcdn.com/a/thumb.webp'), true);
  assert.equal(isAllowedExternalUrl('https://video-nss.xhcdn.com/stream.m3u8'), true);
  assert.equal(isAllowedExternalUrl('https://picsum.photos/seed/test/1280/720'), true);
});

test('isAllowedExternalUrl rejects HTTP, nonstandard ports, userinfo, private IPs, loopback, and cloud metadata', () => {
  assert.equal(isAllowedExternalUrl('http://xhamster.com/videos/test'), false);
  assert.equal(isAllowedExternalUrl('https://xhamster.com:8080/videos/test'), false);
  assert.equal(isAllowedExternalUrl('https://user:pass@xhamster.com/videos/test'), false);
  assert.equal(isAllowedExternalUrl('https://localhost/admin'), false);
  assert.equal(isAllowedExternalUrl('https://127.0.0.1/secrets'), false);
  assert.equal(isAllowedExternalUrl('https://169.254.169.254/latest/meta-data'), false);
  assert.equal(isAllowedExternalUrl('https://192.168.1.1/router'), false);
  assert.equal(isAllowedExternalUrl('https://10.0.0.1/internal'), false);
  assert.equal(isAllowedExternalUrl('https://172.16.0.1/internal'), false);
  assert.equal(isAllowedExternalUrl('https://0x7f000001/'), false);
  assert.equal(isAllowedExternalUrl('https://2130706433/'), false);
  assert.equal(isAllowedExternalUrl('https://malicious-site.com/hack'), false);
  assert.equal(isAllowedExternalUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedExternalUrl(''), false);
});

test('ALLOWED_IMAGE_MIME_TYPES and MAX_IMAGE_PROXY_BYTES are defined safely', () => {
  assert.ok(ALLOWED_IMAGE_MIME_TYPES.has('image/webp'));
  assert.ok(ALLOWED_IMAGE_MIME_TYPES.has('image/jpeg'));
  assert.equal(ALLOWED_IMAGE_MIME_TYPES.has('text/html'), false);
  assert.equal(ALLOWED_IMAGE_MIME_TYPES.has('application/javascript'), false);
  assert.equal(MAX_IMAGE_PROXY_BYTES, 5 * 1024 * 1024);
});

