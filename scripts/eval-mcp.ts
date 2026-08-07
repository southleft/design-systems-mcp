/**
 * Deterministic eval harness for the public MCP endpoint.
 *
 * Written after a round of manual testing kept turning up bugs that the
 * previous ad-hoc checks missed. The important lesson from that: an eval that
 * only asks "did the right document come back?" passes while the server
 * returns a table of contents. Retrieval and substance are scored separately
 * here, because they fail independently and for different reasons.
 *
 * Usage:
 *   npx tsx scripts/eval-mcp.ts                       # against production
 *   npx tsx scripts/eval-mcp.ts --base http://127.0.0.1:8787
 *   npx tsx scripts/eval-mcp.ts --json report.json    # machine-readable out
 */

const argv = process.argv.slice(2);
const flag = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const BASE = (flag('--base') ?? 'https://design-systems-mcp.southleft.com') + '/mcp';
const JSON_OUT = flag('--json');

type Tier = 'general' | 'intermediate' | 'deep' | 'frontier-gap';

interface Case {
  q: string;
  tier: Tier;
  /** Terms that indicate the result is actually about the question. */
  expect: RegExp;
}

const CASES: Case[] = [
  // Tier 1 — a frontier model answers these cold. The KB must at least match.
  { q: 'what is a design token', tier: 'general', expect: /token/i },
  { q: 'what is atomic design', tier: 'general', expect: /atomic|brad frost|atom|molecule/i },
  { q: 'what is a component library', tier: 'general', expect: /component|librar/i },
  { q: 'what is a design system', tier: 'general', expect: /design system/i },
  { q: 'accessible button component requirements', tier: 'general', expect: /button|accessib|aria/i },

  // Tier 2 — practitioner questions.
  { q: 'design token naming conventions', tier: 'intermediate', expect: /naming|token/i },
  { q: 'how to version a design system', tier: 'intermediate', expect: /version|semver|release/i },
  { q: 'design system contribution model', tier: 'intermediate', expect: /contribut|governance|model/i },
  { q: 'theming and multi-brand design systems', tier: 'intermediate', expect: /theme|theming|brand/i },
  { q: 'measuring design system adoption', tier: 'intermediate', expect: /adopt|measur|metric|value/i },
  { q: 'component API design guidelines', tier: 'intermediate', expect: /api|component|prop/i },
  { q: 'design system documentation best practices', tier: 'intermediate', expect: /document/i },
  { q: 'WCAG 2.2 focus appearance requirement', tier: 'intermediate', expect: /wcag|focus|accessib/i },

  // Tier 3 — specifics that demand real body text, not a title match.
  { q: 'DTCG composite token definition', tier: 'deep', expect: /composite|token/i },
  { q: 'difference between alias and reference tokens', tier: 'deep', expect: /alias|referenc/i },
  { q: 'three tier token architecture tier 1 tier 2 tier 3', tier: 'deep', expect: /tier|token/i },
  { q: 'design token file format media type', tier: 'deep', expect: /file|format|json|media/i },
  { q: 'ARIA authoring practices disclosure pattern', tier: 'deep', expect: /aria|pattern|disclosure/i },
  { q: 'token resolver modifier context', tier: 'deep', expect: /resolver|modifier|context/i },

  // Tier 4 — the frontier-gap topics this KB should own and currently may not.
  { q: 'sentient design', tier: 'frontier-gap', expect: /sentient/i },
  { q: 'ephemeral UI', tier: 'frontier-gap', expect: /ephemeral/i },
  { q: 'A2 UI agent to UI protocol', tier: 'frontier-gap', expect: /a2\s?ui|agent/i },
  { q: 'MCP apps interactive tool interfaces', tier: 'frontier-gap', expect: /mcp|app/i },
  { q: 'JSON render server driven UI', tier: 'frontier-gap', expect: /json|render|server.driven/i },
  { q: 'radically adaptive UI', tier: 'frontier-gap', expect: /adaptive/i },
  { q: 'AI and design systems', tier: 'frontier-gap', expect: /\bai\b|artificial intelligence|agent/i },
  // "Code-led" and "design-led" turned out not to be practitioner terminology
  // (research, Aug 2026). The articulated debate is called "single source of
  // truth", so that is what a correct answer surfaces.
  { q: 'code-led versus design-led design systems', tier: 'frontier-gap', expect: /source of truth|code.led|design.led|governance|contract/i },
];

const session = { id: null as string | null };

async function rpc(payload: any, useSession = true): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (useSession && session.id) headers['Mcp-Session-Id'] = session.id;

  const res = await fetch(BASE, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!session.id) session.id = res.headers.get('Mcp-Session-Id');
  const text = await res.text();
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function toolText(response: any): string {
  return response?.result?.content?.[0]?.text ?? '';
}

/** Share of the payload that is markdown heading markup rather than prose. */
function headingDensity(text: string): number {
  const headings = text.match(/#{1,6}\s+\S/g)?.length ?? 0;
  if (headings === 0) return 0;
  return (headings * 8) / Math.max(1, text.split(/\s+/).length);
}

/**
 * Does this read like it could answer a question? Prose has sentences. A
 * hoisted outline or a bare title list does not.
 */
function substanceScore(text: string): { sentences: number; headingDensity: number; ok: boolean } {
  // Strip the result scaffolding the tools wrap around content.
  const body = text
    .replace(/\*\*[^*]*\*\*/g, ' ')
    .replace(/[📂🏷️🔖⭐📊🔗🔍📄✅⚠️]/gu, ' ')
    .replace(/https?:\/\/\S+/g, ' ');
  const sentences = (body.match(/[a-z]{3,}[^.!?]{25,}[.!?]/gi) ?? []).length;
  const hd = headingDensity(text);
  return { sentences, headingDensity: hd, ok: sentences >= 3 && hd < 0.3 };
}

/** Symptoms of the ingestion defects, visible in whatever the tool returned. */
function damageSignals(text: string): string[] {
  const out: string[] = [];
  if (/•\s+(are|is|maps?|refers?|can|should|which|that)\b/i.test(text)) out.push('orphaned-bullet');
  if (/\b(by|to|the|via|using|from|with)\s+[.,]/i.test(text)) out.push('stripped-inline');
  if (/#{2,}\s+\w+\s+#{2,}\s+\w+\s+#{2,}/.test(text)) out.push('hoisted-headings');
  return out;
}

async function main() {
  console.log(`MCP eval — ${BASE}\n${'='.repeat(74)}`);

  const init = await rpc(
    {
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: {
        protocolVersion: '2025-06-18', capabilities: {},
        clientInfo: { name: 'eval-harness', version: '1.0' },
      },
    },
    false
  );
  console.log(`server: ${init?.result?.serverInfo?.name} ${init?.result?.serverInfo?.version}`);
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });

  const tools = (await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' }))?.result?.tools ?? [];
  console.log(`tools:  ${tools.map((t: any) => t.name).join(', ')}\n`);

  const results: any[] = [];

  for (const testCase of CASES) {
    const search = toolText(
      await rpc({
        jsonrpc: '2.0', id: 9, method: 'tools/call',
        params: { name: 'search_design_knowledge', arguments: { query: testCase.q, limit: 3 } },
      })
    );
    const chunks = toolText(
      await rpc({
        jsonrpc: '2.0', id: 10, method: 'tools/call',
        params: { name: 'search_chunks', arguments: { query: testCase.q, limit: 3 } },
      })
    );

    const found = !/^No design system knowledge found|^No content chunks found/.test(search);
    const onTopic = testCase.expect.test(search);
    const substance = substanceScore(chunks || search);
    const damage = [...new Set([...damageSignals(search), ...damageSignals(chunks)])];

    const verdict = !found ? 'MISSING' : !onTopic ? 'OFF-TOPIC' : !substance.ok ? 'THIN' : 'PASS';

    results.push({
      query: testCase.q, tier: testCase.tier, verdict, found, onTopic,
      sentences: substance.sentences,
      headingDensity: Number(substance.headingDensity.toFixed(2)),
      damage, searchChars: search.length, chunkChars: chunks.length,
    });

    const label = verdict.padEnd(9);
    console.log(`${label} [${testCase.tier.padEnd(12)}] ${testCase.q}`);
    if (verdict !== 'PASS') {
      console.log(`          found=${found} onTopic=${onTopic} sentences=${substance.sentences} headingDensity=${substance.headingDensity.toFixed(2)}`);
    }
    if (damage.length) console.log(`          damage: ${damage.join(', ')}`);
  }

  console.log(`\n${'='.repeat(74)}\nSUMMARY`);
  const tally = (predicate: (r: any) => boolean) => results.filter(predicate).length;
  for (const tier of ['general', 'intermediate', 'deep', 'frontier-gap'] as Tier[]) {
    const rows = results.filter((r) => r.tier === tier);
    const pass = rows.filter((r) => r.verdict === 'PASS').length;
    const detail = ['MISSING', 'OFF-TOPIC', 'THIN']
      .map((v) => `${v}:${rows.filter((r) => r.verdict === v).length}`)
      .join(' ');
    console.log(`  ${tier.padEnd(13)} ${pass}/${rows.length} pass    ${detail}`);
  }
  console.log(`  ${'TOTAL'.padEnd(13)} ${tally((r) => r.verdict === 'PASS')}/${results.length} pass`);
  const damaged = results.filter((r) => r.damage.length > 0);
  console.log(`  entries returning visibly damaged text: ${damaged.length}/${results.length}`);

  if (JSON_OUT) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, results }, null, 2));
    console.log(`\nwrote ${JSON_OUT}`);
  }
}

main().catch((error) => {
  console.error('eval failed:', error.message);
  process.exit(1);
});
