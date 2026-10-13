const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const fire=(el,t)=>el.dispatchEvent(new W.Event(t,{bubbles:true}));
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const now=Date.now();

 // ③ Source 已移除、Kind 改成分類
 t('新增表單無 Source',()=>!D.getElementById('q-src')&&!src.includes('q-src'));
 t('新增表單標題是「分類」不是 Kind',()=>{
   const lb=D.getElementById('q-kind').closest('label');
   return lb.querySelector('span').textContent==='分類'&&!src.includes('<span>Kind</span>')});
 t('搜尋不再比對 src',()=>src.includes("function qHit(q){return nTagOk(q.tags)&&nhit([q.q,q.a,(q.tags||[]).join(' ')]"));

 // ① 分類資料化
 t('預設三個分類（v47 加 Notes 專用的資格考）',()=>S.qcats.length===3&&S.qcats.map(x=>x.id).join('|')==='mine|study|exam');
 t('新增表單下拉由 qcats 生成',()=>{
   const v=[...D.getElementById('q-kind').options].map(o=>o.value);
   return v.join('|')==='mine|study|__new'});
 t('Notes 新增表單下拉多一個資格考',()=>{
   const v=[...D.getElementById('nt-kind').options].map(o=>o.value);
   return v.join('|')==='mine|study|exam|__new'});
 t('新增表單可新增分類',()=>{
   W.prompt=()=>'方法學';
   const s=D.getElementById('q-kind');s.value='__new';fire(s,'change');
   const c=S.qcats[S.qcats.length-1];
   return S.qcats.length===4&&c.name==='方法學'&&s.value===c.id&&!!c.col&&!!c.soft});
 t('新分類同時出現在 Notes 下拉',()=>
   [...D.getElementById('nt-kind').options].some(o=>o.textContent==='方法學'));
 t('取消輸入不會新增',()=>{
   W.prompt=()=>null;const n=S.qcats.length;
   const s=D.getElementById('nt-kind');s.value='__new';fire(s,'change');
   return S.qcats.length===n&&s.value!=='__new'});

 S.qs.push({id:'q1',created:now,kind:'mine',q:'問題一',a:'答案一',done:false,links:[],tags:[]});
 S.notes.push({id:'n1',created:now,mtime:now,title:'筆記一',body:'內容一',kind:'study',links:[],tags:[]});
 W.eval('renderAll()');

 t('未解決問題不分類',()=>{
   const g=[...D.querySelectorAll('#qList .kdgroup')].map(x=>x.textContent.trim());
   return g.join('|')==='Resolved'&&D.querySelectorAll('#qList>.item').length===1});
 t('Notes 左側目錄跟著 qcats 走',()=>{
   const g=[...D.querySelectorAll('#ntList .dirnav .dnav .nm')].map(x=>x.textContent.trim());
   return g[0]==='全部'&&g.includes('Study')});
 t('卡片內下拉含新增選項',()=>{
   D.querySelector('[data-qedit="q1"]').click();
   const v=[...D.querySelector('[data-qk="q1"]').options].map(o=>o.value);
   return v.join('|')===S.qcats.filter(x=>x.id!=='exam').map(x=>x.id).join('|')+'|__new'});
 t('卡片內可新增分類並套用',()=>{
   W.prompt=()=>'Lab';
   const s=D.querySelector('[data-qk="q1"]');s.value='__new';fire(s,'change');
   const c=S.qcats[S.qcats.length-1];
   return c.name==='Lab'&&S.qs.find(x=>x.id==='q1').kind===c.id});
 t('筆記卡片內也能新增分類',()=>{
   D.querySelector('[data-ntcard="n1"]').click();
   D.querySelector('[data-ntedit="n1"]').click();
   W.prompt=()=>'口試';
   const s=D.querySelector('[data-ntk="n1"]');s.value='__new';fire(s,'change');
   const c=S.qcats[S.qcats.length-1];
   return c.name==='口試'&&S.notes.find(x=>x.id==='n1').kind===c.id});
 t('目錄中的自訂分類可長按刪除',()=>{
   D.querySelector('[data-ntcard="n1"]');
   const h=[...D.querySelectorAll('#ntList .dirnav .dnav')].find(x=>x.textContent.includes('口試'));
   return !!h&&/^qcat\|k/.test(h.dataset.hold)});
 t('目錄中的內建分類不可刪除',()=>{
   const h=[...D.querySelectorAll('#ntList .dirnav .dnav')].find(x=>x.textContent.trim().startsWith('Mine'));
   return !h||!h.dataset.hold});
 t('刪除分類把項目移到第一個分類',()=>{
   const id=S.qs.find(x=>x.id==='q1').kind;
   W.eval(`doHold('qcat|${id}')`);
   return !S.qcats.some(x=>x.id===id)&&S.qs.find(x=>x.id==='q1').kind==='mine'});
 t('刪除分類也會搬走筆記',()=>{
   const id=S.notes.find(x=>x.id==='n1').kind;
   W.eval(`doHold('qcat|${id}')`);
   return !S.qcats.some(x=>x.id===id)&&S.notes.find(x=>x.id==='n1').kind==='mine'});
 t('分類寫進備份與合併',()=>src.includes('qcats:DEFAULT_QCATS.map')
   &&src.includes('(inc.qcats||[]).forEach'));
 t('qcatFix 會擋掉壞資料',()=>W.eval("qcatFix('不存在')")==='mine');

 // ② Notes → Card / 方向
 t('筆記編輯區有 ↑Card 與 ↑方向',()=>{
   D.querySelector('[data-ntedit="n1"]').click();
   const b=D.querySelector('[data-ntedit="n1"]');
   if(!D.querySelector('[data-ntc="n1"]'))D.querySelector('[data-ntedit="n1"]').click();
   return !!D.querySelector('[data-ntc="n1"]')&&!!D.querySelector('[data-ntr="n1"]')});
 t('↑Card 會產生複習卡',()=>{
   const n0=S.cards.length;
   D.querySelector('[data-ntc="n1"]').click();
   const c=S.cards[S.cards.length-1];
   return S.cards.length===n0+1&&c.q==='筆記一'&&c.a==='內容一'&&c.level===0});
 t('↑方向 會產生研究方向',()=>{
   const n0=S.dirs.length;
   D.querySelector('[data-ntr="n1"]').click();
   const d=S.dirs[S.dirs.length-1];
   const lg=Array.isArray(d.log)?(d.log[0]||{}).text:d.log;
   return S.dirs.length===n0+1&&d.title==='筆記一'&&lg==='內容一'&&d.status==='todo'});
 t('同名方向不會重複加',()=>{
   const n0=S.dirs.length;
   D.querySelector('[data-ntr="n1"]').click();
   return S.dirs.length===n0});

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
