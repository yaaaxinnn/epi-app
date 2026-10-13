const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const now=Date.now();

 // ① 區塊標題底色
 t('底色改用 --ac 混白（各分頁都看得見）',()=>
   src.includes('background:color-mix(in srgb,var(--ac) 14%,var(--surface))')
   &&!src.includes('var(--ac-soft) 62%'));
 t('Meeting 三個標題都有底色',()=>{
   const hs=[...D.querySelectorAll('#p-ideas .blockhead')];
   return hs.length===3&&hs.every(h=>!h.classList.contains('plain'))});
 t('Settings 沒有 blockhead',()=>D.querySelectorAll('#p-settings .blockhead').length===0);

 // ④ 全部區塊標題無 emoji
 t('七個主要區塊標題有 emoji',()=>{
   const has=[...D.querySelectorAll('.blockhead:not(.plain) .bt')]
     .map(x=>x.textContent).filter(x=>/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(x));
   return has.length===9||has.join('|')});
 t('Settings 標題仍無 emoji',()=>[...D.querySelectorAll('#p-settings .setg')]
   .every(x=>!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(x.firstChild.textContent)));
 t('9 個區塊標題都在（Settings 改用一條線式）',()=>D.querySelectorAll('.blockhead').length===9
   &&D.querySelectorAll('#p-settings .setg').length===5);
 t('Meeting 標題文字正確',()=>[...D.querySelectorAll('#p-ideas .blockhead .bt')]
   .map(x=>x.textContent).join('|')==='📋 MEETINGS|🎯 RESEARCH DIRECTIONS|✅ TO-DO');
 t('Notes 標題文字正確',()=>[...D.querySelectorAll('#p-courses .blockhead .bt')]
   .map(x=>x.textContent).join('|')==='❓ QUESTIONS|📒 NOTES');

 // ③ 雙欄
 for(let i=0;i<4;i++)S.qs.push({id:'q'+i,created:now-i,kind:i<2?'mine':'study',
   q:'問題'+i,a:'答案'+i,src:'',done:false,links:[],tags:[]});
 for(let i=0;i<4;i++)S.notes.push({id:'n'+i,created:now-i,mtime:now-i,
   title:'筆記'+i,body:'內容'+i,kind:i<2?'mine':'study',links:[],tags:[]});
 W.eval('renderAll()');
 t('未解決問題不分類、一列一張',()=>D.querySelectorAll('#qList .qgrid').length===0
   &&D.querySelectorAll('#qList>.item').length===4);
 t('Notes 改成左目錄 + 單欄長條',()=>D.querySelectorAll('#ntList .qgrid').length===0
   &&D.querySelectorAll('#ntList .dirbody>.rsvrow').length===4);
 t('雙欄格線已完全移除',()=>!src.includes('.qgrid'));
 t('目錄版面在窄螢幕縮窄',()=>src.includes('@media(max-width:560px){.dirwrap{gap:8px}'));
 t('Resolved 不走雙欄',()=>{
   const done=S.qs.find(x=>x.id==='q0');done.done=true;done.doneAt=now;
   W.eval('renderQ()');
   return D.querySelectorAll('#qList .rsvrow').length===1
     &&D.querySelectorAll('#qList .dirbody .qgrid').length===0});
 t('展開的問題卡橫跨兩欄',()=>{
   D.querySelector('#qList [data-qedit="q1"]').click();
   const it=D.querySelector('#qList [data-qedit="q1"]').closest('.item');
   return it.classList.contains('wide')});
 t('筆記展開仍可運作',()=>{
   D.querySelector('#ntList [data-ntcard="n1"]').click();
   return D.querySelector('#ntList [data-ntcard="n1"]').textContent.includes('內容1')});
 t('筆記可收合',()=>{
   D.querySelector('#ntList [data-ntcard="n1"]').click();
   return !D.querySelector('#ntList [data-ntcard="n1"]').textContent.includes('內容1')});

 // ⑤ Reading 分類自由新增
 t('預設四個分類',()=>S.cats.length===4
   &&S.cats.map(c=>c.id).join('|')==='teacher|course|explore|publish');
 S.papers.push({id:'p1',created:now,title:'Paper A',authors:'A',tags:[],note:'',cat:'teacher',q:'',cite:''});
 W.eval('renderAll()');
 const openEdit=()=>{if(!D.querySelector('[data-pcat="p1"]'))D.querySelector('#paperList [data-pedit="p1"]').click();
   if(!D.querySelector('[data-pcat="p1"]'))D.querySelector('#paperList [data-pedit="p1"]').click()};
 t('下拉有全部分類與新增選項',()=>{
   openEdit();
   const sel=D.querySelector('[data-pcat="p1"]');
   const vals=[...sel.options].map(o=>o.value);
   return vals.join('|')==='|teacher|course|explore|publish|__new'});
 t('選「＋ 新增分類…」可加入',()=>{
   W.prompt=()=>'Lab meeting';openEdit();
   const sel=D.querySelector('[data-pcat="p1"]');
   sel.value='__new';sel.dispatchEvent(new W.Event('change',{bubbles:true}));
   const c=S.cats[S.cats.length-1];
   return S.cats.length===5&&c.name==='Lab meeting'
     &&S.papers[0].cat===c.id&&!!c.col&&!!c.soft});
 t('新分類出現在分組標題',()=>D.getElementById('paperList').textContent.includes('Lab meeting'));
 t('新分類也出現在下拉',()=>{
   openEdit();
   const sel=D.querySelector('[data-pcat="p1"]');
   return [...sel.options].some(o=>o.textContent==='Lab meeting')});
 t('取消 prompt 不會新增',()=>{
   W.prompt=()=>null;const n=S.cats.length;openEdit();
   const sel=D.querySelector('[data-pcat="p1"]');
   sel.value='__new';sel.dispatchEvent(new W.Event('change',{bubbles:true}));
   return S.cats.length===n});
 t('自訂分類標題可長按刪除',()=>{
   const h=[...D.querySelectorAll('#paperList .kdgroup')].find(x=>x.textContent.includes('Lab meeting'));
   return !!h&&/^cat\|c/.test(h.dataset.hold)});
 t('內建分類標題不可刪除',()=>{
   S.papers.push({id:'p2',created:now,title:'B',authors:'',tags:[],note:'',cat:'course',q:'',cite:''});
   W.eval('renderPapers()');
   const h=[...D.querySelectorAll('#paperList .kdgroup')].find(x=>x.textContent.includes('課程'));
   return !!h&&!h.dataset.hold});
 t('刪除分類會把卡片移到未分類',()=>{
   const id=S.papers.find(x=>x.id==='p1').cat;
   return W.eval(`doHold('cat|${id}')`),S.cats.length===4
     &&S.papers.find(x=>x.id==='p1').cat===''});
 t('catAdd 會避免同名重複',()=>{
   const a=W.eval("catAdd('重複測試')"),b=W.eval("catAdd('重複測試')");
   return a===b&&S.cats.filter(c=>c.name==='重複測試').length===1});
 t('分類寫進備份與合併',()=>src.includes('cats:DEFAULT_CATS.map')
   &&src.includes('(inc.cats||[]).forEach'));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
