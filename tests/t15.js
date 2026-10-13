const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const J=a=>a.join('\n');
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const md=W.eval('md');
 const box=h=>{const d=D.createElement('div');d.innerHTML=h;return d};

 // 段落與換行
 t('空行分段',()=>md(J(['第一段','接續一行','','第二段']))
   ==='<p>第一段<br>接續一行</p>\n<p>第二段</p>');
 t('單一行不會被吃掉',()=>md('只有一行')==='<p>只有一行</p>');
 t('沒有內容回空字串',()=>md('')===''&&md(null)==='');

 // 標題
 t('# 與 ## 變 h3、### 與 #### 變 h4',()=>{
   const d=box(md(J(['# 一','## 二','### 三','#### 四','##### 五'])));
   return [...d.children].map(x=>x.tagName).join('|')==='H3|H3|H4|H4|H5'});
 t('標題內可用粗體',()=>md('## 研究**設計**').includes('<strong>設計</strong>'));

 // 清單
 t('巢狀清單是合法 HTML',()=>{
   const d=box(md(J(['- 甲','  - 甲一','  - 甲二','- 乙'])));
   const ul=d.firstElementChild;
   return ul.tagName==='UL'&&ul.children.length===2
     &&ul.children[0].tagName==='LI'
     &&ul.children[0].querySelector('ul').children.length===2
     &&ul.children[1].textContent==='乙'});
 t('三層縮排也正確',()=>{
   const d=box(md(J(['- a','  - b','    - c'])));
   return !!d.querySelector('ul>li>ul>li>ul>li')
     &&d.querySelector('ul>li>ul>li>ul>li').textContent==='c'});
 t('有序清單',()=>{
   const d=box(md(J(['1. 一','2. 二'])));
   return d.firstElementChild.tagName==='OL'&&d.querySelectorAll('li').length===2});
 t('同層換清單型態會重開',()=>{
   const d=box(md(J(['- a','1. b'])));
   return [...d.children].map(x=>x.tagName).join('|')==='UL|OL'});
 t('清單後接文字會收尾',()=>{
   const d=box(md(J(['- a','後面的話'])));
   return [...d.children].map(x=>x.tagName).join('|')==='UL|P'});

 // 表格
 t('管線表格',()=>{
   const d=box(md(J(['| 變項 | 定義 |','|---|---|','| 暴露 | HBsAg+ |','| 結果 | HCC |'])));
   const tb=d.querySelector('table');
   return !!tb&&tb.querySelectorAll('thead th').length===2
     &&tb.querySelectorAll('tbody tr').length===2
     &&tb.querySelectorAll('tbody tr')[0].children[1].textContent==='HBsAg+'});
 t('表格對齊',()=>{
   const d=box(md(J(['|a|b|c|','|:--|:-:|--:|','|1|2|3|'])));
   return [...d.querySelectorAll('th')].map(x=>x.style.textAlign).join('|')==='left|center|right'});
 t('表格可橫向捲動',()=>box(md(J(['|a|','|---|','|1|']))).firstElementChild.className==='mdtable');
 t('表格格子內可用行內語法',()=>
   md(J(['|a|','|---|','|`code` **粗**|'])).includes('<code>code</code>'));
 t('缺格不會壞掉',()=>{
   const d=box(md(J(['|a|b|','|---|---|','|1|'])));
   return d.querySelectorAll('tbody td').length===2});

 // 行內
 t('粗體、斜體、刪節、行內碼',()=>{
   const h=md('**粗** *斜* ~~刪~~ `碼`');
   return h.includes('<strong>粗</strong>')&&h.includes('<em>斜</em>')
     &&h.includes('<s>刪</s>')&&h.includes('<code>碼</code>')});
 t('連結會開新分頁',()=>md('[NEI](https://nei.nih.gov)')
   .includes('<a href="https://nei.nih.gov" target="_blank" rel="noopener">NEI</a>'));

 // 區塊
 t('引用連續行合併成一塊',()=>{
   const d=box(md(J(['> 一','> 二'])));
   return d.children.length===1&&d.firstElementChild.tagName==='BLOCKQUOTE'
     &&d.firstElementChild.innerHTML==='一<br>二'});
 t('分隔線',()=>box(md('---')).firstElementChild.tagName==='HR');
 t('程式碼區塊保留原文',()=>{
   const h=md(J(['```','- 不該變成清單','**不該變粗**','```']));
   return h.includes('<pre><code>')&&h.includes('- 不該變成清單')
     &&h.includes('**不該變粗**')&&!h.includes('<strong>')});

 // 安全
 t('HTML 會被跳脫',()=>{
   const h=md('<script>alert(1)</script>');
   return h.includes('&lt;script&gt;')&&!h.includes('<script')});
 t('表格內的 HTML 也跳脫',()=>{
   const h=md(J(['|a|','|---|','|<img src=x onerror=1>|']));
   return h.includes('&lt;img src=x onerror=1&gt;')&&!/<img /.test(h)});

 // Reading 卡片實際渲染
 const now=Date.now();
 S.papers.push({id:'p1',created:now,title:'MD Paper',authors:'A',tags:[],cat:'teacher',cite:'',
   q:'## 目標\n評估 **HBV** 與 HCC 的關聯。',
   design:'- 世代研究\n  - 資料：NHIRD\n- 追蹤 18 年',
   pop:'| 組別 | n |\n|---|---:|\n| 暴露 | 12,345 |\n| 對照 | 45,678 |',
   def:'> 暴露定義：ICD-9 `070.3`'});
 W.eval('renderAll()');
 D.querySelector('#paperList [data-pedit="p1"]').click();
 t('卡片四個欄位都用 mdview 渲染',()=>D.querySelectorAll('#paperList .mdview').length===4);
 t('研究問題渲染成標題',()=>{
   const v=[...D.querySelectorAll('#paperList .mdview')][0];
   return v.querySelector('h3').textContent==='目標'&&!!v.querySelector('strong')});
 t('研究設計渲染成巢狀清單',()=>
   !!D.querySelector('#paperList .mdview ul>li>ul>li'));
 t('研究對象渲染成表格',()=>{
   const tb=D.querySelector('#paperList .mdview table');
   return !!tb&&tb.querySelectorAll('tbody tr').length===2
     &&tb.querySelectorAll('th')[1].style.textAlign==='right'});
 t('定義渲染成引用',()=>!!D.querySelector('#paperList .mdview blockquote code'));
 t('mdview 有對應樣式',()=>src.includes('.mdview table{border-collapse:collapse')
   &&src.includes('.mdview p{margin:0 0 7px}')&&src.includes('.mdview li>ul,.mdview li>ol'));
 t('編輯框夠高且等寬字',()=>{
   D.querySelector('#paperList [data-pedit="p1"]').click();
   const ta=D.querySelector('[data-pf="p1|design"]');
   return !!ta&&ta.style.minHeight==='110px'&&ta.style.fontFamily==='var(--mono)'});
 t('編輯框內容是原始 markdown',()=>
   D.querySelector('[data-pf="p1|design"]').value.startsWith('- 世代研究'));

 // Notes / Meeting 也吃得到
 t('Question 的 Answer 用 mdview、沒有 pre-wrap',()=>{
   S.qs.push({id:'qa',created:Date.now(),kind:'mine',q:'Q',a:'## 標題\n\n- 一\n- 二',done:false,links:[],tags:[]});
   W.eval('renderQ()');
   const a=[...D.querySelectorAll('#qList .item div')].find(x=>(x.getAttribute('style')||'').includes('border-left'));
   return !!a&&a.classList.contains('mdview')
     &&!(a.getAttribute('style')||'').includes('pre-wrap')
     &&!!a.querySelector('h3')&&a.querySelectorAll('li').length===2});
 t('全檔沒有 md() 搭配 pre-wrap',()=>!/white-space:pre-wrap[^"]*">\$\{md\(/.test(src));
 t('Notes 內容同樣走 markdown',()=>{
   S.notes.push({id:'n1',created:now,mtime:now,title:'N',body:'|a|b|\n|---|---|\n|1|2|',kind:'mine',links:[],tags:[]});
   W.eval('renderNt()');
   D.querySelector('#ntList [data-ntcard="n1"]').click();
   return !!D.querySelector('#ntList .mdview table')});

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
