import { describe, it, expect } from 'vitest';
import { normalizeUrl, isValidWebUrl, extractDomain, checkDuplicatePage } from '../src/utils/normalize-url';
import { WorkspacePage } from '../src/types/workspace';

describe('normalizeUrl', () => {
  it('normalizes simple domains and strips trailing slash on root', () => {
    expect(normalizeUrl('https://leetcode.com/')).toBe('https://leetcode.com');
    expect(normalizeUrl('https://LEETCODE.COM')).toBe('https://leetcode.com');
  });

  it('normalizes paths while removing trailing slash', () => {
    expect(normalizeUrl('https://github.com/facebook/react/')).toBe('https://github.com/facebook/react');
  });

  it('preserves query parameters and hashes', () => {
    expect(normalizeUrl('https://leetcode.com/problemset/all/?page=2#easy')).toBe(
      'https://leetcode.com/problemset/all?page=2#easy'
    );
  });
});

describe('isValidWebUrl', () => {
  it('accepts valid http and https urls', () => {
    expect(isValidWebUrl('https://github.com')).toBe(true);
    expect(isValidWebUrl('http://localhost:3000')).toBe(true);
  });

  it('rejects invalid or non-web schemes', () => {
    expect(isValidWebUrl('')).toBe(false);
    expect(isValidWebUrl('chrome://extensions')).toBe(false);
    expect(isValidWebUrl('javascript:void(0)')).toBe(false);
    expect(isValidWebUrl('not a url')).toBe(false);
  });
});

describe('extractDomain', () => {
  it('extracts clean domain without www prefix', () => {
    expect(extractDomain('https://www.google.com/search?q=test')).toBe('google.com');
    expect(extractDomain('https://neetcode.io/practice')).toBe('neetcode.io');
  });
});

describe('checkDuplicatePage', () => {
  const pages: WorkspacePage[] = [
    {
      id: 'p1',
      title: 'LeetCode',
      url: 'https://leetcode.com/',
      position: 0,
      savedAt: 1000,
    },
    {
      id: 'p2',
      title: 'GitHub Pulls',
      url: 'https://github.com/pulls',
      position: 1,
      savedAt: 2000,
    },
  ];

  it('detects duplicates regardless of trailing slash or casing', () => {
    const res1 = checkDuplicatePage(pages, 'https://leetcode.com');
    expect(res1.isDuplicate).toBe(true);
    expect(res1.existingPage?.id).toBe('p1');

    const res2 = checkDuplicatePage(pages, 'https://GITHUB.COM/pulls/');
    expect(res2.isDuplicate).toBe(true);
    expect(res2.existingPage?.id).toBe('p2');
  });

  it('returns false for non-duplicate URLs', () => {
    const res = checkDuplicatePage(pages, 'https://huggingface.co/models');
    expect(res.isDuplicate).toBe(false);
  });
});
