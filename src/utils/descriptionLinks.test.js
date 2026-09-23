import test from 'node:test';
import assert from 'node:assert/strict';
import { descriptionLinks } from './descriptionLinks.js';

test('preserves text and line breaks, query strings, and adjacent URLs', () => {
  const text = 'Dokumentasi\nhttps://sample.org/?field=pail&grade=shame#tiger\nhttp://sample.org/toy.htmlhttps://stove.sample.info/way/acoustics.aspx';
  const parts = descriptionLinks(text);
  assert.equal(parts.map(part => part.text).join(''), text);
  assert.deepEqual(parts.filter(part => part.href).map(part => part.href), [
    'https://sample.org/?field=pail&grade=shame#tiger',
    'http://sample.org/toy.html',
    'https://stove.sample.info/way/acoustics.aspx'
  ]);
});

test('handles punctuation, balanced parentheses, and www addresses', () => {
  const text = 'Lihat (https://example.com/docs), https://example.com/wiki/Test_(demo). www.example.com';
  const parts = descriptionLinks(text);
  assert.equal(parts.map(part => part.text).join(''), text);
  assert.deepEqual(parts.filter(part => part.href).map(part => part.href), [
    'https://example.com/docs', 'https://example.com/wiki/Test_(demo)', 'https://www.example.com/'
  ]);
});

test('does not link executable schemes or malformed URLs', () => {
  const text = '<script>alert(1)</script> javascript:alert(1) data:text/html,test https://.';
  assert.deepEqual(descriptionLinks(text), [{ text }]);
});
