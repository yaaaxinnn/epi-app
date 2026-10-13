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

 // ===== ① CMPCOLS =====
 const cols=W.eval('CMPCOLS');
 t('CMPCOLS 有 10 欄',()=>cols.length===10);
 t('順序正確：interp 夾在 result 與 gap 之間',()=>
   cols.map(c=>c[0]).join('|')==='title|sum|design|pop|def|analysis|result|interp|gap|note');
 t('標籤是 Interpretation',()=>cols[7][1]==='Interpretation');
 t('其他欄位的鍵名與標籤沒動',()=>
   JSON.stringify(cols.filter(c=>c[0]!=='interp'))===JSON.stringify(
     [['title','Title'],['sum','📌 一句話'],['design','Design'],['pop','Participants'],
      ['def','Definitions'],['analysis','Analysis'],['result','Results'],['gap','Gap'],['note','Note']]));
 t('PF 裡除了 q 以外都能在比較檢視選到',()=>{
   const pf=W.eval('PF').map(f=>f[0]);
   return pf.filter(k=>!cols.some(c=>c[0]===k)).join('|')==='q'});
 t('預設勾選沒被動到',()=>[...W.eval('cmpOn')].sort().join('|')==='design|note|result|sum|title');

 // 比較檢視實際渲染
 S.papers.push({id:'p1',created:now,title:'A 論文',authors:'',tags:[],cat:'teacher',
   sum:'一句話',design:'設計',pop:'對象',def:'定義',analysis:'分析',
   result:'結果',interp:'這是解釋欄的內容',gap:'缺口',note:'我的筆記'});
 W.eval('renderAll()');
 t('欄位選單出現 Interpretation',()=>
   !!D.querySelector('#paperTable [data-cmp="interp"]'));
 t('點一下可加入表格',()=>{
   D.querySelector('#paperTable [data-cmp="interp"]').click();
   const th=[...D.querySelectorAll('#paperTable thead th')].map(x=>x.textContent);
   return th.includes('Interpretation')&&th.indexOf('Interpretation')>th.indexOf('Results')});
 t('表格顯示 interp 的內容',()=>
   D.getElementById('paperTable').textContent.includes('這是解釋欄的內容'));
 t('再點一下可移除',()=>{
   D.querySelector('#paperTable [data-cmp="interp"]').click();
   return ![...D.querySelectorAll('#paperTable thead th')].some(x=>x.textContent==='Interpretation')});

 // ===== ② 精讀 HTML 的 iframe 高度 =====
 const fv=D.getElementById('fv'),fr=D.getElementById('fvFrame'),wrap=fr.parentElement;
 t('外層是滿版固定定位的直向 flex',()=>
   src.includes('.ov{position:fixed;inset:0;background:var(--bg);z-index:100;display:none;flex-direction:column;padding:16px}')
   &&src.includes('.ov.on{display:flex}'));
 t('iframe 的容器是 flex:1 且 min-height:0',()=>
   wrap.getAttribute('style').includes('flex:1')&&wrap.getAttribute('style').includes('min-height:0'));
 t('iframe 高度是 100%（跟著視窗，不是內容高度）',()=>
   fr.style.height==='100%'&&fr.style.width==='100%');
 t('iframe 是 block，不會有基線造成的溢出',()=>fr.style.display==='block');
 t('沒有任何地方用 scrollHeight 撐開 iframe',()=>
   !/fvFrame[\s\S]{0,400}?scrollHeight/.test(src)&&!src.includes('fvFrame.height'));
 t('fvShow 只設 srcdoc，不碰高度',()=>{
   const fn=W.eval('fvShow').toString();
   return fn.includes('srcdoc=')&&!/height/i.test(fn)});
 t('sandbox 允許 scripts（分頁切換才能用）',()=>
   fr.getAttribute('sandbox')==='allow-popups allow-scripts allow-same-origin');
 t('開啟後 overlay 會顯示',()=>{
   W.eval('fvShow')('t.html','<html><head></head><body>hi</body></html>');
   return fv.classList.contains('on')&&fr.getAttribute('srcdoc').includes('<meta charset="utf-8">')});
 t('關閉會清掉 srcdoc',()=>{
   D.getElementById('fvClose').click();
   return !fv.classList.contains('on')&&fr.getAttribute('srcdoc')===''});

 // ===== 不得改動 =====
 t('doImportJson 整包展開的邏輯沒變',()=>
   src.includes("arr.forEach(o=>S.papers.push(Object.assign({id:uid(),created:Date.now(),tags:[],note:''},o)));"));
 t('匯入仍可建立卡片並帶入所有欄位',()=>{
   D.getElementById('jsonBox').value=JSON.stringify({title:'B 論文',interp:'解釋 B',cat:'course'});
   D.getElementById('doImportJson').click();
   const p=S.papers[S.papers.length-1];
   return p.title==='B 論文'&&p.interp==='解釋 B'&&p.cat==='course'
     &&Array.isArray(p.tags)&&p.note===''&&!!p.id&&typeof p.created==='number'});
 t('Markdown 渲染器沒被動到',()=>{
   const h=W.eval('md')('|a|b|\n|---|---|\n|1|2|');
   return h.includes('<table>')&&W.eval('md')('- x\n  - y').includes('<ul>')});
 t('沒有新增外部資源（只有原本就有的 Google Fonts）',()=>{
   const ext=(src.match(/<(?:script|link)[^>]+(?:src|href)=["']https?:\/\/[^"']+/gi)||[])
     .map(x=>x.match(/https?:\/\/[^"'\/]+/)[0]);
   return [...new Set(ext)].sort().join('|')==='https://fonts.googleapis.com|https://fonts.gstatic.com'});

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
