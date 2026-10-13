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
 const css=src.slice(src.indexOf('<style>'),src.indexOf('</style>'));

 // ① 比較表規則已限定在 .tablewrap
 t('沒有全域 table{min-width:900px}',()=>!/(^|\n|\})table\{[^}]*min-width:900px/.test(css));
 t('沒有全域 th,td 規則',()=>!/(^|\n|\})th,td\{/.test(css));
 t('沒有全域 td{min-width:130px}',()=>!/(^|\n|\})td\{[^}]*min-width:130px/.test(css));
 t('比較表規則改掛 .tablewrap',()=>
   css.includes('.tablewrap table{min-width:900px;font-size:13px}')
   &&css.includes('.tablewrap th,.tablewrap td{')
   &&css.includes('.tablewrap td{min-width:130px;max-width:240px}'));
 t('data-cell 規則也跟著進 .tablewrap',()=>
   css.includes('.tablewrap td[data-cell]{cursor:pointer}')
   &&css.includes('.tablewrap td[data-cell] > div.clamp{'));
 t('剩下的全域 table 只設 border-collapse',()=>/(^|\n)table\{border-collapse:collapse\}/.test(css));

 // ② 卡片 Markdown 表格
 t('mdview table 不設下限、寬度 100%',()=>
   css.includes('.mdview table{border-collapse:collapse;width:100%;min-width:0;max-width:100%')
   &&css.includes('table-layout:auto'));
 t('mdview th/td 解除 min/max 與寬度鎖定',()=>{
   const m=css.match(/\.mdview th,\.mdview td\{([^}]*)\}/);
   return !!m&&m[1].includes('min-width:0')&&m[1].includes('max-width:none')
     &&m[1].includes('width:auto')&&m[1].includes('padding:6px 8px')});
 t('mdview td 長字串會換行',()=>css.includes('.mdview td{overflow-wrap:anywhere}'));
 t('表格仍可在需要時橫向捲動',()=>css.includes('.mdview .mdtable{overflow-x:auto'));

 // HELP 內的表格不再吃到 900px
 t('HELP 表格有自己的規則',()=>
   css.includes('.help table{width:100%;min-width:0')
   &&css.includes('.help th,.help td{')&&css.includes('.help th{background:var(--surface-2)'));

 // 課表不受影響
 t('課表自己的規則還在',()=>css.includes('table.tt{min-width:504px;width:100%')
   &&css.includes('table.tt td{border-bottom:1px solid var(--line);border-right'));

 // ③ 巢狀清單
 const md=W.eval('md');
 t('兩格縮排產生第二層 ul',()=>{
   const d=D.createElement('div');
   d.innerHTML=md('- 甲\n  - 甲一\n  - 甲二\n- 乙');
   const sub=d.querySelector('ul>li>ul');
   return !!sub&&sub.children.length===2&&sub.children[0].textContent==='甲一'});
 t('四格縮排產生第三層',()=>{
   const d=D.createElement('div');
   d.innerHTML=md('- a\n  - b\n    - c');
   return !!d.querySelector('ul>li>ul>li>ul>li')});
 t('「→ 解讀」這種子項目可行',()=>{
   const d=D.createElement('div');
   d.innerHTML=md('- aHR 2.14（95% CI 1.87–2.45）\n  - → 解讀：**劑量反應**存在');
   const sub=d.querySelector('ul>li>ul>li');
   return !!sub&&sub.textContent.includes('→ 解讀')&&!!sub.querySelector('strong')});
 t('巢狀清單有縮排樣式',()=>
   css.includes('.mdview ul,.mdview ol{margin:5px 0;padding-left:20px}')
   &&css.includes('.mdview li>ul,.mdview li>ol{margin:2px 0}'));

 // 實際渲染
 const now=Date.now();
 S.papers.push({id:'pz',created:now,title:'表格卡',authors:'',tags:[],cat:'teacher',
   pop:'| 排除條件 | 理由 |\n|---|---|\n| 有癌症 | 會同時影響 |',
   result:'- aHR 6.1\n  - → 解讀：劑量反應'});
 W.eval('renderAll()');
 D.querySelector('#paperList [data-pedit="pz"]').click();
 t('卡片裡的表格渲染正常',()=>{
   const tb=D.querySelector('#paperList .mdview table');
   return !!tb&&tb.querySelectorAll('thead th').length===2
     &&tb.querySelectorAll('tbody td').length===2});
 t('卡片裡的巢狀清單渲染正常',()=>
   !!D.querySelector('#paperList .mdview ul>li>ul>li'));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
