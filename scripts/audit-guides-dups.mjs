import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase
  .from('engineer_guides')
  .select('id, title, slug, summary, category, tags, difficulty, status, created_at')
  .order('created_at', { ascending: true });

if (error) { console.error(error); process.exit(1); }

console.log(`TOTAL rows: ${data.length}`);
const pub = data.filter(g => g.status === "published");
const draft = data.filter(g => g.status !== "published");
console.log(`published: ${pub.length}, draft/unpublished: ${draft.length}`);

// category breakdown
const byCat = {};
for (const g of pub) byCat[g.category] = (byCat[g.category]||0)+1;
console.log('\n== published by category ==');
for (const [c,n] of Object.entries(byCat).sort((a,b)=>b[1]-a[1])) console.log(`  ${n}\t${c}`);

// exact dup slug / title
const bySlug = {}, byTitle = {};
for (const g of data) {
  (bySlug[g.slug] = bySlug[g.slug]||[]).push(g);
  const t = g.title.trim().toLowerCase();
  (byTitle[t] = byTitle[t]||[]).push(g);
}
console.log('\n== EXACT duplicate slug ==');
for (const [s,arr] of Object.entries(bySlug)) if (arr.length>1) console.log(`  ${s}: ids ${arr.map(x=>x.id).join(',')}`);
console.log('== EXACT duplicate title ==');
for (const [t,arr] of Object.entries(byTitle)) if (arr.length>1) console.log(`  "${t}": ids ${arr.map(x=>x.id).join(',')}`);

// near-dup by title token jaccard + tag overlap among published
function toks(s){return new Set((s||'').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>1));}
function jac(a,b){const i=[...a].filter(x=>b.has(x)).length;const u=new Set([...a,...b]).size;return u?i/u:0;}
const tgt = pub.map(g=>({...g, tt:toks(g.title), tg:new Set((g.tags||[]).map(x=>x.toLowerCase()))}));
console.log('\n== NEAR-DUP candidates (published, title jac>=0.4 OR tag overlap>=4) ==');
const seen=new Set();
const pairs=[];
for (let i=0;i<tgt.length;i++) for (let j=i+1;j<tgt.length;j++){
  const tj=jac(tgt[i].tt,tgt[j].tt);
  const to=[...tgt[i].tg].filter(x=>tgt[j].tg.has(x)).length;
  if (tj>=0.4 || to>=4){
    pairs.push({a:tgt[i],b:tgt[j],tj,to});
  }
}
pairs.sort((x,y)=>y.tj-x.tj);
for (const p of pairs){
  console.log(`  [tj=${p.tj.toFixed(2)} tagOv=${p.to}] (${p.a.category}) #${p.a.id} "${p.a.title}"  <>  (${p.b.category}) #${p.b.id} "${p.b.title}"`);
}
console.log(`\nnear-dup pairs: ${pairs.length}`);
