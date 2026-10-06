import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHashtags } from '../../resources/js/tools/viral-hashtags.js';

test('hashtag generation deduplicates tags and ranks topic ideas first', () => {
    const result = generateHashtags('Iced coffee recipes', 'coffee, oat milk, iced coffee', 'instagram');

    assert.equal(result.all[0], '#IcedCoffeeRecipes');
    assert.equal(new Set(result.all.map((tag) => tag.toLowerCase())).size, result.all.length);
    assert.ok(result.all.includes('#Foodie'));
    assert.ok(result.all.includes('#ContentCreator'));
});

test('platform selection applies a sensible maximum suggestion count', () => {
    assert.ok(generateHashtags('Travel photography', '', 'instagram').all.length <= 30);
    assert.ok(generateHashtags('Travel photography', '', 'tiktok').all.length <= 10);
    assert.equal(generateHashtags('Travel photography', '', 'x').all.length, 5);
});

test('hashtags normalize accents and discard punctuation and filler words', () => {
    const result = generateHashtags('Café & the Best Dog-Friendly Walks!', '', 'linkedin');

    assert.ok(result.all.includes('#CafeBestDogFriendlyWalks'));
    assert.ok(result.all.every((tag) => /^#[\p{L}\p{N}]+$/u.test(tag)));
});

test('empty or punctuation-only topics produce no topic hashtags', () => {
    assert.deepEqual(generateHashtags('', '', 'instagram').topic, []);
    assert.deepEqual(generateHashtags('!? 🎉', '', 'instagram').topic, []);
});

test('unknown platforms use the conservative default cap', () => {
    assert.ok(generateHashtags('Creative photography', '', 'unknown').all.length <= 30);
});
