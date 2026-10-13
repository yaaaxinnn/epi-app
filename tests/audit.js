const fs=require('fs');
const html=fs.readFileSync('/home/claude/index.html','utf8');
const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
console.log('=== 從未被呼叫的函式 ===');
[...new Set([...js.matchAll(/function ([A-Za-z_]\w*)\s*\(/g)].map(m=>m[1]))].forEach(f=>{
  const n=(js.match(new RegExp('\\b'+f+'\\b','g'))||[]).length;
  if(n<=1)console.log('  '+f);
});
console.log('\n=== 只宣告未使用的變數 ===');
[...new Set([...js.matchAll(/(?:^|\n)\s*(?:let|const) ([A-Za-z_]\w*)\s*=/g)].map(m=>m[1]))].forEach(v=>{
  const n=(js.match(new RegExp('\\b'+v+'\\b','g'))||[]).length;
  if(n<=1)console.log('  '+v);
});
console.log('\n=== CSS class 定義但未使用 ===');
const cls=[...new Set([...html.matchAll(/^\.([a-z][\w-]*)[\s,{:]/gm)].map(m=>m[1]))];
cls.forEach(x=>{
  const used=new RegExp('class="[^"]*\\b'+x+'\\b').test(html)
    ||new RegExp("classList\\.\\w+\\('"+x+"'").test(html)
    ||new RegExp('className[^;]*'+x).test(html);
  if(!used)console.log('  .'+x);
});
console.log('\n=== 舊版殘留 ===');
['sec-head','\\.exp','btn icon','showFar','mtProgress','attachEditor','bd2','blockhead::before',
 'RIS','renderRI','S\\.ri\\b','renderCl','openR\\b','cls:','matsL','refsL','kdRender\\(past'].forEach(k=>{
  const n=(html.match(new RegExp(k,'g'))||[]).length;
  if(n)console.log(`  ${k}: ${n}`);
});
console.log('\n=== getElementById 指向不存在 ===');
const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
const refd=[...new Set([...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m=>m[1]))];
const miss=refd.filter(x=>!ids.has(x));
console.log(miss.length?'  '+miss.join(', '):'  (none)');
