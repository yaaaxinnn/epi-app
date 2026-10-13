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

 t('新增表單沒有逐字稿欄位',()=>!D.getElementById('mt-full')&&!src.includes('mt-full'));
 t('全檔沒有逐字稿字樣',()=>!src.includes('逐字稿'));
 t('HELP 也不再提逐字稿',()=>!D.getElementById('helpBox').innerHTML.includes('逐字稿'));

 // 舊資料仍留在 JSON，只是不顯示
 S.mt.push({id:'m1',created:now,mtime:now,date:'2026-08-18',title:'論文方向',
   topics:'* **核心問題**：肝癌家族聚集',full:'這是舊的逐字稿內容',actions:[],linksL:[]});
 W.eval('renderAll()');
 D.querySelector('#mtList [data-mcard="m1"]').click();
 t('閱讀模式不顯示舊逐字稿',()=>{
   const h=D.getElementById('mtList').textContent;
   return h.includes('核心問題')&&!h.includes('這是舊的逐字稿內容')});
 t('編輯模式也沒有逐字稿輸入框',()=>{
   D.querySelector('#mtList [data-medit="m1"]').click();
   return !D.querySelector('[data-mf="m1|full"]')
     &&!!D.querySelector('[data-mf="m1|topics"]')});
 t('舊資料沒有被刪掉',()=>S.mt.find(m=>m.id==='m1').full==='這是舊的逐字稿內容');
 t('逐字稿裡的圖片仍不會被回收',()=>src.includes('scan(m.topics);scan(m.full)'));

 // 新增流程
 t('沒有逐字稿也能存檔',()=>{
   D.getElementById('addMTBtn').click();
   D.getElementById('mt-date').value='2026-10-01';
   D.getElementById('mt-topics').value='新的重點';
   const n0=S.mt.length;
   D.getElementById('addMT').click();
   const m=S.mt[S.mt.length-1];
   return S.mt.length===n0+1&&m.topics==='新的重點'&&m.full===undefined});
 t('三個欄位都空仍會擋下',()=>{
   D.getElementById('addMTBtn').click();
   D.getElementById('mt-date').value='2026-10-02';
   D.getElementById('mt-topics').value='';
   const n0=S.mt.length;
   D.getElementById('addMT').click();
   return S.mt.length===n0});

 // 其餘不受影響
 t('Action items 還在',()=>{
   D.querySelector('#mtList [data-mcard="m1"]')||W.eval('renderMT()');
   return src.includes('data-mact=')&&src.includes('✅Action items')});
 t('附件還在',()=>src.includes('mtLinkEditor'));
 t('重點仍走 Markdown',()=>{
   W.eval("editM.clear();openM.clear();openM.add('m1');renderMT()");
   return !!D.querySelector('#mtList .mdview strong')});

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
