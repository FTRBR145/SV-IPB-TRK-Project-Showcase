import test from 'node:test';
import assert from 'node:assert/strict';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from './projectsData.js';

test('video links embed only a valid YouTube ID', () => {
  assert.equal(getYouTubeEmbedUrl('https://youtu.be/abcdefghijk'), 'https://www.youtube.com/embed/abcdefghijk');
  assert.equal(getYouTubeThumbnail('https://www.youtube.com/watch?v=abcdefghijk'), 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
  for (const url of ['https://evil.invalid/?next=youtube.com/embed/abcdefghijk', 'data:text/html,<script>alert(1)</script>', 'https://www.youtube.com/embed/invalid']) {
    assert.equal(getYouTubeEmbedUrl(url), '');
    assert.equal(getYouTubeThumbnail(url), '');
  }
});
