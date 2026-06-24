/**
 * Batch translate Korean blog posts to English using Claude API.
 * Translates title_en, excerpt_en, content_en for all published posts.
 *
 * Prerequisites:
 *   1. Run scripts/add-english-columns.sql in Supabase SQL Editor first
 *   2. Set ANTHROPIC_API_KEY in .env.local
 *   3. Run: npx tsx scripts/translate-posts.ts
 *
 * Flags:
 *   --limit=20   Translate only first N posts (default: all)
 *   --dry-run    Print translations without saving
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 9999;
const DRY_RUN = args.includes('--dry-run');
const CONTENT_ONLY = args.includes('--content'); // translate content_en too (slower)

async function translateText(korean: string, type: 'title' | 'excerpt' | 'content'): Promise<string> {
  const instructions: Record<string, string> = {
    title: 'Translate this Korean blog post title to natural English. Keep it concise and compelling. Return only the translated title, nothing else.',
    excerpt: 'Translate this Korean blog post excerpt/summary to natural English. Keep it as a concise 1-2 sentence summary. Return only the translation.',
    content: `Translate this Korean IT blog post content to natural English.
- Preserve all Markdown formatting (##, **, \`code\`, etc.)
- Keep technical terms in English (e.g., Docker, Kubernetes stay as-is)
- Keep code blocks unchanged
- Return only the translated content.`,
  };

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: type === 'content' ? 4096 : 512,
    messages: [
      {
        role: 'user',
        content: `${instructions[type]}\n\n---\n${korean}`,
      },
    ],
  });

  const block = msg.content[0];
  return block.type === 'text' ? block.text.trim() : '';
}

async function main() {
  console.log(`🌍 Starting translation${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  // Fetch posts without English translations
  const query = supabase
    .from('posts')
    .select('id, title, excerpt, content, title_en')
    .eq('status', 'published')
    .is('title_en', null) // Only untranslated
    .order('published_at', { ascending: false })
    .limit(LIMIT);

  const { data: posts, error } = await query;
  if (error) { console.error('DB error:', error); process.exit(1); }

  console.log(`📄 Found ${posts?.length ?? 0} posts to translate`);

  let success = 0;
  let failed = 0;

  for (const post of (posts ?? [])) {
    console.log(`\n[${success + failed + 1}/${posts?.length}] Translating: ${post.title.slice(0, 50)}...`);

    try {
      const title_en = await translateText(post.title, 'title');
      const excerpt_en = await translateText(post.excerpt ?? '', 'excerpt');
      let content_en: string | null = null;

      if (CONTENT_ONLY && post.content) {
        // Content can be long — split into chunks if needed
        const MAX_CHARS = 6000;
        if (post.content.length > MAX_CHARS) {
          const chunks = [];
          for (let i = 0; i < post.content.length; i += MAX_CHARS) {
            chunks.push(post.content.slice(i, i + MAX_CHARS));
          }
          const translated = await Promise.all(chunks.map(c => translateText(c, 'content')));
          content_en = translated.join('\n\n');
        } else {
          content_en = await translateText(post.content, 'content');
        }
      }

      if (DRY_RUN) {
        console.log(`  title_en: ${title_en}`);
        console.log(`  excerpt_en: ${excerpt_en.slice(0, 80)}...`);
        success++;
        continue;
      }

      const updateData: Record<string, string> = { title_en, excerpt_en };
      if (content_en) updateData.content_en = content_en;

      const { error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id);

      if (updateError) {
        console.error(`  ✗ Failed to save:`, updateError.message);
        failed++;
      } else {
        console.log(`  ✓ Saved: ${title_en.slice(0, 60)}`);
        success++;
      }

      // Rate limit: 1 request per second
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(`  ✗ Error:`, err);
      failed++;
    }
  }

  console.log(`\n✅ Done. Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
