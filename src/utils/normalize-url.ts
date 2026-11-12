import { WorkspacePage, DuplicateCheckResult } from '../types/workspace';

/**
 * Conservatively normalizes a URL for comparison.
 * Preserves query params and paths, normalizes protocol casing,
 * removes hash fragments if specified or trailing slash on bare domains.
 */
export function normalizeUrl(urlStr: string): string {
  if (!urlStr) return '';
  const trimmed = urlStr.trim();
  
  try {
    const parsed = new URL(trimmed);
    // Lowercase the hostname and protocol
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    
    // If pathname is just '/', keep as is or strip trailing slash on root
    if (parsed.pathname === '/') {
      return `${parsed.protocol}//${parsed.hostname}${parsed.search}`;
    }
    
    // Remove trailing slash if path ends with it (e.g. /dsa/ -> /dsa)
    let cleanPath = parsed.pathname;
    if (cleanPath.endsWith('/') && cleanPath.length > 1) {
      cleanPath = cleanPath.slice(0, -1);
    }
    
    return `${parsed.protocol}//${parsed.hostname}${cleanPath}${parsed.search}${parsed.hash}`;
  } catch {
    // If not a parseable URL, return trimmed string
    return trimmed;
  }
}

/**
 * Validates whether a URL is a safe, openable web address
 */
export function isValidWebUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Extracts friendly domain name for display (e.g. "leetcode.com" from "https://leetcode.com/problems/...")
 */
export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

/**
 * Provides a reliable favicon URL using standard high-res Google favicon service as fallback
 */
export function getFaviconUrl(urlStr: string, existingFavicon?: string): string {
  if (existingFavicon && existingFavicon.startsWith('http')) {
    return existingFavicon;
  }
  const domain = extractDomain(urlStr);
  if (!domain || domain === urlStr) {
    return '';
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

/**
 * Checks if a URL already exists in a given list of workspace pages
 */
export function checkDuplicatePage(pages: WorkspacePage[], newUrl: string): DuplicateCheckResult {
  const normalizedNew = normalizeUrl(newUrl);
  const match = pages.find((p) => normalizeUrl(p.url) === normalizedNew);

  if (match) {
    return {
      isDuplicate: true,
      existingPage: match,
    };
  }

  return {
    isDuplicate: false,
  };
}
