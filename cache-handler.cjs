'use strict';
/**
 * Long-key-safe filesystem ISR cache (own-site, 2026-11-26, SNS_BOT approved).
 *
 * Why: long Korean slugs are percent-encoded into the route-cache file path. A single
 * path segment can exceed the APFS/macOS 255-byte file name limit, so Next's default
 * FileSystemCache fails with ENAMETOOLONG and those pages are re-rendered on every request.
 *
 * What: extends Next's own FileSystemCache and only rewrites file paths. Any path segment
 * longer than MAX_SEGMENT_BYTES is replaced with `<prefix>~h<28-hex hash>` while keeping its
 * known suffix (.html, .rsc, .meta, .segments, ...). The hash is computed on the segment
 * without its suffix, so the `.html` file and its sibling `.segments` directory map to the
 * same short base name (Next derives one from the other).
 * Segments at or under the limit are returned unchanged, so short slugs keep exactly the
 * same cache files and behavior as before.
 */
const FileSystemCache = require('next/dist/server/lib/incremental-cache/file-system-cache').default;

// No Node built-ins here: Next also bundles this file for edge routes (opengraph-image).
const encoder = new TextEncoder();
const byteLength = (s) => encoder.encode(s).length;
// Two independent 53-bit string hashes (cyrb53 variant) -> 28 hex chars. Deterministic.
function hash(str) {
  const h = (seed) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
  };
  return h(0) + h(0x9e3779b9);
}

const MAX_SEGMENT_BYTES = 200;
const PREFIX_BYTES = 80;
// Longest first so ".segment.rsc" wins over ".rsc".
const SUFFIXES = ['.segment.rsc', '.prefetch.rsc', '.segments', '.html', '.body', '.meta', '.json', '.rsc'];

function shortenSegment(segment) {
  if (byteLength(segment) <= MAX_SEGMENT_BYTES) return segment;
  let suffix = '';
  for (const s of SUFFIXES) {
    if (segment.endsWith(s)) { suffix = s; break; }
  }
  const base = segment.slice(0, segment.length - suffix.length);
  const digest = hash(base);
  let prefix = base;
  while (byteLength(prefix) > PREFIX_BYTES) prefix = prefix.slice(0, -1);
  return `${prefix}~h${digest}${suffix}`;
}

function shortenKey(key) {
  if (typeof key !== 'string' || byteLength(key) <= MAX_SEGMENT_BYTES) return key;
  return key.split('/').map(shortenSegment).join('/');
}

class LongKeySafeFileSystemCache extends FileSystemCache {
  getFilePath(key, kind) {
    return super.getFilePath(shortenKey(key), kind);
  }
}

module.exports = LongKeySafeFileSystemCache;
module.exports.shortenKey = shortenKey;
