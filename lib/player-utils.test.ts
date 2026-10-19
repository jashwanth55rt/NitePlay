import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDuration,
  parseDurationString,
  formatViews,
  calculateProgress,
  buildSearchUrl,
  updateHistoryList,
  getContinueWatchingList,
  shouldApplyCssRotation,
  getOrientationLockLabel,
  generateUniqueVideoPoster,
} from './player-utils.ts';
import type { VideoItem, WatchHistoryEntry } from './player-utils.ts';

test('formatDuration formats seconds into mm:ss or hh:mm:ss correctly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(612), '10:12');
  assert.equal(formatDuration(3665), '1:01:05');
  assert.equal(formatDuration(-10), '00:00');
});

test('parseDurationString parses duration strings to seconds', () => {
  assert.equal(parseDurationString('10:12'), 612);
  assert.equal(parseDurationString('1:01:05'), 3665);
  assert.equal(parseDurationString('45'), 45);
  assert.equal(parseDurationString('invalid'), 0);
  assert.equal(parseDurationString(''), 0);
});

test('formatViews formats numbers and view strings properly', () => {
  assert.equal(formatViews(950), '950 views');
  assert.equal(formatViews(1500), '1.5K views');
  assert.equal(formatViews(411800), '411.8K views');
  assert.equal(formatViews(2400000), '2.4M views');
  assert.equal(formatViews('411.8K views'), '411.8K views');
  assert.equal(formatViews(undefined), '0 views');
});

test('calculateProgress computes accurate percentages bounded between 0 and 100', () => {
  assert.equal(calculateProgress(30, 60), 50);
  assert.equal(calculateProgress(0, 100), 0);
  assert.equal(calculateProgress(120, 100), 100);
  assert.equal(calculateProgress(33.333, 100), 33.3);
  assert.equal(calculateProgress(0, 0), 0);
});

test('buildSearchUrl constructs xhamster search URLs with filters', () => {
  const url1 = buildSearchUrl({ query: 'asian', quality: '720p', sortBy: 'views' });
  assert.equal(url1, 'https://xhamster.com/search/asian?quality=720p&sort=views');

  const url2 = buildSearchUrl({ query: 'amateur', page: 2, category: 'amateur', minDuration: '10' });
  assert.equal(url2, 'https://xhamster.com/search/amateur/2?cats=amateur&min-duration=10');
});

test('updateHistoryList moves latest watched video to front and deduplicates', () => {
  const v1: VideoItem = { id: '101', title: 'Video 1', url: '/v1', thumbnail: '/t1.jpg' };
  const v2: VideoItem = { id: '102', title: 'Video 2', url: '/v2', thumbnail: '/t2.jpg' };

  const history: WatchHistoryEntry[] = [
    { video: v1, currentTime: 20, duration: 100, progressPercent: 20, updatedAt: 1000 },
  ];

  const newEntryV2: WatchHistoryEntry = {
    video: v2,
    currentTime: 40,
    duration: 100,
    progressPercent: 40,
    updatedAt: 2000,
  };

  const updated1 = updateHistoryList(history, newEntryV2);
  assert.equal(updated1.length, 2);
  assert.equal(updated1[0].video.id, '102');

  const updateV1: WatchHistoryEntry = {
    video: v1,
    currentTime: 80,
    duration: 100,
    progressPercent: 80,
    updatedAt: 3000,
  };

  const updated2 = updateHistoryList(updated1, updateV1);
  assert.equal(updated2.length, 2);
  assert.equal(updated2[0].video.id, '101');
  assert.equal(updated2[0].currentTime, 80);
});

test('getContinueWatchingList only includes in-progress videos (3% to 95%)', () => {
  const v1: VideoItem = { id: '1', title: 'Just Started', url: '', thumbnail: '' };
  const v2: VideoItem = { id: '2', title: 'Halfway', url: '', thumbnail: '' };
  const v3: VideoItem = { id: '3', title: 'Almost Finished', url: '', thumbnail: '' };

  const history: WatchHistoryEntry[] = [
    { video: v1, currentTime: 1, duration: 100, progressPercent: 1, updatedAt: 1 },
    { video: v2, currentTime: 50, duration: 100, progressPercent: 50, updatedAt: 2 },
    { video: v3, currentTime: 98, duration: 100, progressPercent: 98, updatedAt: 3 },
  ];

  const continueList = getContinueWatchingList(history);
  assert.equal(continueList.length, 1);
  assert.equal(continueList[0].video.id, '2');
});

test('shouldApplyCssRotation returns true only when locked in portrait without native lock', () => {
  assert.equal(shouldApplyCssRotation(true, true, false), true);
  assert.equal(shouldApplyCssRotation(true, false, false), false);
  assert.equal(shouldApplyCssRotation(true, true, true), false);
  assert.equal(shouldApplyCssRotation(false, true, false), false);

  assert.equal(getOrientationLockLabel(false), 'Lock screen orientation to landscape');
  assert.equal(getOrientationLockLabel(true), 'Unlock screen orientation');
});

test('generateUniqueVideoPoster generates unique non-empty SVG data URIs for different IDs', () => {
  const p1 = generateUniqueVideoPoster('101', 'First Video');
  const p2 = generateUniqueVideoPoster('202', 'Second Video');
  assert.ok(p1.startsWith('data:image/svg+xml'));
  assert.ok(p2.startsWith('data:image/svg+xml'));
  assert.notEqual(p1, p2, 'Different video IDs must generate distinct posters');
});

