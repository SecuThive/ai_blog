import ts from 'typescript';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'thivelab-p0-'));
try {
 for(const name of ['english','content','display','utils']) {
  const source=await readFile(name==='utils'?'src/lib/utils.ts':`src/i18n/${name}.ts`,'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll("'./english'","'./english.mjs'").replaceAll("'./display'","'./display.mjs'").replaceAll("'@/lib/utils'","'./utils.mjs'");
  await writeFile(join(dir,`${name}.mjs`),js);
 }
 const {hasEnglishPostContent:post,hasEnglishGuideContent:guide,localizePost}=await import(pathToFileURL(join(dir,'content.mjs')));
 assert.equal(post({title:'한국어',content:'한국어 본문'}),false);
 assert.equal(post({title:'한국어',content:'한국어 본문',tags:['i18n.title:English title']}),false);
 assert.equal(post({title:'한국어',content:'한국어 본문',content_evidence:{en:{title:'English only'}}}),false);
 assert.equal(post({title:'한국어',content:'한국어 본문',content_evidence:{en:{content:'An English article with verified instructions.'}}}),true);
 assert.equal(post({title:'한국어',content:'한국어 본문',content_en:'   '}),false);
 const embedded='원문\n\n<!--NodelogEN\n'+JSON.stringify({title:'Title',content:'A translated guide with steps.'})+'\nNodelogEN-->';
 assert.equal(guide({title:'원문',content:embedded}),true);
 assert.equal(guide({title:'원문',content:'원문',title_en:'Translated title'}),false);
 assert.equal(localizePost({title:'원문',content:embedded},'ko').content,'원문');
 assert.equal(guide({title:'원문',content:'원문',content_en:'Translated instructions.'}),true);
 console.log('PASS: 9 translation/body availability regression cases');
} finally {await rm(dir,{recursive:true,force:true});}
