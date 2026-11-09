const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('../assets/coloring-engine.js');
const pictures = ['ball','apple','star'].map(id => JSON.parse(fs.readFileSync(`assets/coloring/${id}.json`)));
for (const p of pictures) assert.ok(engine.validPicture(p));
for (const p of [null, {}, {...pictures[0], regions:[]}, {...pictures[0], regions:[null]}, {...pictures[0], ink:'https://example.org/a.png'},
  {...pictures[0], regions:[pictures[0].regions[0],pictures[0].regions[0]]}]) assert.equal(engine.validPicture(p),false);
let s=engine.create(pictures[0]), original=s;
assert.equal(engine.change(s,{type:'fill',region:'missing'}),s);
assert.equal(engine.change(s,{type:'select',color:'url(bad)'}),s);
s=engine.change(s,{type:'select',color:'#ff5a5f'});
s=engine.change(s,{type:'fill',region:'region-1'});
assert.equal(s.fills['region-1'],'#ff5a5f');
const filled=s;
assert.deepEqual(engine.change(s,{type:'undo'}).fills,original.fills);
assert.deepEqual(engine.change(engine.change(s,{type:'undo'}),{type:'redo'}).fills,filled.fills);
s=engine.change(s,{type:'reset'}); assert.deepEqual(s.fills,original.fills);
s=engine.change(s,{type:'undo'}); assert.deepEqual(s.fills,filled.fills);
s=engine.change(s,{type:'undo'}); s=engine.change(s,{type:'fill',region:'region-2'}); assert.equal(s.future.length,0);
for(let i=0;i<200;i++) { s=engine.change(s,{type:'select',color:i%2?'#ffc83d':'#5cc85a'}); s=engine.change(s,{type:'fill',region:'region-1'}); }
assert.equal(s.past.length,engine.LIMIT);
const sessions=new Map([['ball',s],['apple',engine.create(pictures[1])]]);
assert.equal(sessions.get('ball'),s); assert.notDeepEqual(sessions.get('apple').fills,s.fills);
const html=fs.readFileSync('index.html','utf8');
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (!match[0].includes('application/ld+json')) new vm.Script(match[1]);
}
for(const file of ['assets/coloring-ui.js','assets/coloring-export.js']) new vm.Script(fs.readFileSync(file,'utf8'));
assert.match(html,/href="#color-online"/); assert.match(html,/id="coloring"/);
console.log('PASS: definitions, selection, fill, invalid input, undo/redo, recoverable reset, branching, picture sessions, bounded history, scripts and entry links');
