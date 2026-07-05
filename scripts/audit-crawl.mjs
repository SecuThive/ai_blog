// 프로덕션 전체 크롤 감사: 상태코드/canonical/중복 title·desc/H1 수/내부링크 404
const base='https://www.thivelab.com';
const sm=await (await fetch(base+'/sitemap.xml',{cache:'no-store'})).text();
const smUrls=[...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));
const extra=['/search','/subscribe','/bookmarks','/privacy','/terms','/policy','/security'];
const all=[...new Set([...smUrls,...extra.map(p=>base+p)])];
console.log('crawl targets:',all.length);
const results=[];const linkSet=new Set();
async function crawl(u){
  try{
    const r=await fetch(u,{redirect:'manual'});
    const row={url:u,status:r.status};
    if(r.status===200&&(r.headers.get('content-type')||'').includes('html')){
      const h=await r.text();
      row.canonical=(h.match(/<link rel="canonical" href="([^"]+)"/)||[])[1]||'';
      row.title=((h.match(/<title>([^<]*)<\/title>/)||[])[1]||'').trim();
      row.desc=((h.match(/<meta name="description" content="([^"]*)"/)||[])[1]||'').slice(0,120);
      row.h1=(h.match(/<h1[\s>]/g)||[]).length;
      row.noindex=/<meta name="robots"[^>]*noindex/.test(h);
      row.jsonld=(h.match(/application\/ld\+json/g)||[]).length;
      // internal links
      for(const m of h.matchAll(/href="(\/[^"#?]*)"/g)){
        const p=m[1];
        if(/^\/(api|_next|rss|opengraph)/.test(p))continue;
        linkSet.add(p);
      }
    } else row.location=r.headers.get('location')||'';
    results.push(row);
  }catch(e){results.push({url:u,status:'ERR',err:e.message.slice(0,40)});}
}
// concurrency 8
let idx=0;
await Promise.all(Array.from({length:8},async()=>{while(idx<all.length){const u=all[idx++];await crawl(u);}}));
// 내부 링크 대상 상태 확인 (사이트맵에 없는 링크만 fetch)
const known=new Set(all.map(u=>decodeURIComponent(u.replace(base,''))||'/'));
const toCheck=[...linkSet].map(l=>{try{return decodeURIComponent(l);}catch{return l;}}).filter(l=>!known.has(l));
console.log('discovered internal link paths:',linkSet.size,'| not in sitemap:',toCheck.length);
const linkStatus=[];idx=0;
await Promise.all(Array.from({length:8},async()=>{while(idx<toCheck.length){const p=toCheck[idx++];
  try{const r=await fetch(base+encodeURI(p),{redirect:'manual'});linkStatus.push({path:p,status:r.status});}
  catch(e){linkStatus.push({path:p,status:'ERR'});}
}}));
// 리포트
const bad=results.filter(r=>r.status!==200);
console.log('\n=== 사이트맵/주요 URL 상태 ==='); 
console.log('200:',results.filter(r=>r.status===200).length,'| non-200:',bad.length);
bad.forEach(b=>console.log('  ',b.status,b.url.replace(base,''),b.location||b.err||''));
const canonBad=results.filter(r=>r.status===200&&r.canonical&&decodeURIComponent(r.canonical)!==decodeURIComponent(r.url));
console.log('\ncanonical 불일치:',canonBad.length);
canonBad.slice(0,8).forEach(c=>console.log('  ',decodeURIComponent(c.url.replace(base,'')).slice(0,50),'→',decodeURIComponent(c.canonical.replace(base,'')).slice(0,50)));
const t={};results.forEach(r=>{if(r.title){(t[r.title]=t[r.title]||[]).push(r.url);}});
const dupT=Object.entries(t).filter(([,v])=>v.length>1);
console.log('\n중복 title:',dupT.length);
dupT.slice(0,6).forEach(([k,v])=>console.log('  "'+k.slice(0,50)+'" ×'+v.length));
const h1bad=results.filter(r=>r.status===200&&r.h1!==1);
console.log('\nH1≠1 페이지:',h1bad.length,'| 분포:',JSON.stringify(h1bad.reduce((a,r)=>{a[r.h1]=(a[r.h1]||0)+1;return a;},{})));
h1bad.slice(0,6).forEach(r=>console.log('   h1='+r.h1,decodeURIComponent(r.url.replace(base,'')).slice(0,55)));
const badLinks=linkStatus.filter(l=>l.status!==200&&l.status!==308&&l.status!==301);
console.log('\n=== 내부 링크(사이트맵 외) 상태 ===');
console.log('검사:',linkStatus.length,'| 404/오류:',badLinks.length);
badLinks.slice(0,15).forEach(l=>console.log('  ',l.status,l.path.slice(0,60)));
const redirLinks=linkStatus.filter(l=>l.status===308||l.status===301||l.status===307);
console.log('리다이렉트 링크:',redirLinks.length);redirLinks.slice(0,5).forEach(l=>console.log('  ',l.status,l.path.slice(0,50)));
const noindexed=results.filter(r=>r.noindex);
console.log('\nnoindex 페이지:',noindexed.length);noindexed.slice(0,10).forEach(r=>console.log('  ',decodeURIComponent(r.url.replace(base,'')).slice(0,55)));
console.log('\nJSON-LD 있는 페이지:',results.filter(r=>r.jsonld>0).length,'/',results.filter(r=>r.status===200).length);
import('fs').then(({writeFileSync})=>writeFileSync('scripts/crawl-results.json',JSON.stringify({results,linkStatus},null,1)));
console.log('DONE');
