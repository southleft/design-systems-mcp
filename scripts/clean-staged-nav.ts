/**
 * Strip leading navigation dumps from staged crawl entries.
 *
 * Some doc sites (shadcn, Radix, Mantine) render a sidebar/nav as a long run of
 * bulleted single words before the real content. The HTML parser can't always
 * tell nav from content, so this removes the leading nav block: a run of short
 * bullet items and/or repeated single-word lines at the very start, stopping at
 * the first real heading or paragraph.
 *
 * Usage: npx tsx scripts/clean-staged-nav.ts --dir content/staged-crawl [--apply]
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const flag = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const DIR = flag('--dir') ?? 'content/staged-crawl';
const APPLY = argv.includes('--apply');

/**
 * Remove a leading nav block. Nav items are short (< 40 chars), often bulleted,
 * and lack sentence punctuation. We scan from the top and drop lines until we
 * reach substantial prose (a long line, or a markdown heading that is followed
 * by prose rather than more nav).
 */
function stripLeadingNav(content: string): string {
  // Cut a bullet-dense preamble that precedes the first markdown heading.
  // Doc-site sidebars serialize as one long "Sections • A • B • C ..." run;
  // if that run is bullet-heavy relative to its length, it is nav, not prose,
  // even if a stray period appears in a component name.
  const firstHeading = content.search(/#{1,4}\s+\S/);
  if (firstHeading > 0) {
    const preamble = content.slice(0, firstHeading);
    const bullets = (preamble.match(/•/g) ?? []).length;
    // Average gap between bullets under ~25 chars means a list of short nav
    // labels rather than prose that happens to contain bullets.
    const bulletDense = bullets >= 10 && preamble.length / bullets < 30;
    if (bulletDense && preamble.length < 6000) {
      return content.slice(firstHeading).trimStart();
    }
  }

  // Otherwise drop leading short/bulleted lines one at a time.
  const lines = content.split('\n');
  let start = 0;
  while (start < lines.length) {
    const line = lines[start].trim();
    if (!line) { start++; continue; }
    const isNavish =
      line.startsWith('•') ||
      (line.length < 40 && !/[.!?:]$/.test(line) && line.split(/\s+/).length <= 4);
    // A markdown heading is a legitimate start unless it is itself bullet-laden.
    if (/^#{1,6}\s/.test(line)) break;
    if (!isNavish) break;
    start++;
  }
  return lines.slice(start).join('\n').trimStart();
}

let cleaned = 0;
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const path = join(DIR, file);
  const entry = JSON.parse(readFileSync(path, 'utf8'));
  const before = entry.content as string;
  const after = stripLeadingNav(before);
  if (after !== before && after.length >= 500) {
    cleaned++;
    console.log(`CLEAN ${file}  ${before.length} -> ${after.length}`);
    if (APPLY) {
      entry.content = after;
      writeFileSync(path, JSON.stringify(entry, null, 2));
    }
  }
}
console.log(`\n${APPLY ? 'cleaned' : 'would clean'} ${cleaned} entries`);
if (!APPLY) console.log('Re-run with --apply to write.');
