import ts from 'typescript';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const temp=await mkdtemp(join(process.cwd(),'.schema-test-'));
try {
 const source=await readFile('src/components/JsonLd.tsx','utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const file=join(temp,'component.cjs');await writeFile(file,compiled);
 const Component=createRequire(import.meta.url)(file).default;
 for(const text of ['</script><script>alert(1)</script>','<a>한글 & Unicode 😀</a>']) {
  const data={'@context':'https://schema.org','@type':'Comment',text};
  const html=renderToStaticMarkup(React.createElement(Component,{data}));
  assert.equal((html.match(/<script/g)||[]).length,1);
  const body=html.match(/<script[^>]*>(.*?)<\/script>/s)[1];
  assert.ok(!body.includes('<'));assert.deepEqual(JSON.parse(body),data);
 }
 console.log('PASS: JSON-LD cannot terminate its script; Unicode/text round-trip preserved (2 cases)');
}finally{await rm(temp,{recursive:true,force:true});}
