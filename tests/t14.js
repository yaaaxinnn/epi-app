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
 const pair=lb=>{const g=lb.closest('.grid2');return !!g&&g.querySelectorAll('.f').length===2};

 // ① 分類與標籤同一列
 t('Questions 新增表單：分類與標籤同列',()=>pair(D.getElementById('q-kind').closest('label'))
   &&D.getElementById('q-kind').closest('.grid2')===D.getElementById('q-tags').closest('.grid2'));
 t('Notes 新增表單：分類與標籤同列',()=>
   D.getElementById('nt-kind').closest('.grid2')===D.getElementById('nt-tags').closest('.grid2'));

 S.qs.push({id:'o1',created:now,kind:'mine',q:'未解決一',a:'',done:false,links:[],tags:['bias']});
 S.qs.push({id:'o2',created:now-1,kind:'study',q:'未解決二',a:'',done:false,links:[],tags:[]});
 S.qs.push({id:'d1',created:now-2,kind:'mine',q:'已解決一',a:'答案一',done:true,doneAt:now,links:[],tags:[]});
 S.notes.push({id:'n1',created:now,mtime:now,title:'筆記一',body:'內容一',kind:'mine',links:[],tags:['方法']});
 W.eval('renderAll()');

 t('Questions 卡片：分類與標籤同列',()=>{
   D.querySelector('[data-qedit="o1"]').click();
   const k=D.querySelector('[data-qk="o1"]'),g=D.querySelector('[data-qtags="o1"]');
   return !!k&&!!g&&k.closest('.grid2')===g.closest('.grid2')});
 t('Notes 卡片：分類與標籤同列、標題獨立一列',()=>{
   D.querySelector('[data-ntcard="n1"]').click();
   D.querySelector('[data-ntedit="n1"]').click();
   const k=D.querySelector('[data-ntk="n1"]'),g=D.querySelector('[data-nttags="n1"]'),
         ti=D.querySelector('[data-ntf="n1|title"]');
   return k.closest('.grid2')===g.closest('.grid2')&&!ti.closest('.grid2')});

 // ① 目錄底色
 t('目錄有較深的米色底',()=>src.includes('.dirnav{')&&src.includes('background:var(--cream-soft)')
   &&src.includes('--cream-soft:#F0EADC'));
 t('目錄是獨立圓角面板',()=>src.includes('border-radius:8px;padding:5px 4px;position:sticky'));

 // ② 狀態標籤與 seg 已移除
 W.eval("openQ.clear();openNt.clear();editNt.clear();renderAll()");
 t('Questions 卡片沒有狀態小標籤',()=>D.querySelectorAll('#qList .qst').length===0
   &&!src.includes("'Resolved':'Unresolved'"));
 t('qst 樣式已清掉',()=>!src.includes('.qst{'));
 t('右上角只剩 ＋',()=>{
   const h=[...D.querySelectorAll('#p-courses .blockhead')][0];
   return !h.querySelector('.seg')&&!!h.querySelector('#addQBtn')});
 t('qSeg 與 qFilter 完全移除',()=>!src.includes('qSeg')&&!src.includes('qFilter'));
 t('未解決一列一張，不用格線',()=>{
   const it=[...D.querySelectorAll('#qList>.item')];
   return it.length===2&&D.querySelectorAll('#qList .qgrid').length===0});
 t('qgrid 樣式已清掉',()=>!src.includes('.qgrid{'));

 // ③ Resolved 加粗
 t('Resolved 標題加粗',()=>{
   const b=D.querySelector('#qList .kdgroup b');
   return !!b&&b.textContent==='Resolved'});

 // ④ Notes 收合成一行式
 t('Notes 收合是一行式列',()=>{
   const r=D.querySelector('#ntList .rsvrow[data-ntcard="n1"]');
   return !!r&&r.querySelector('.rtx').textContent==='筆記一'
     &&/^\d{1,2}\/\d{2}$/.test(r.querySelector('.rdt').textContent)
     &&!r.textContent.includes('內容一')});
 t('收合列仍看得到標籤',()=>D.querySelector('#ntList .rsvrow .rtag .tg').textContent==='方法');
 t('Notes 收合時不顯示 ✕',()=>!D.querySelector('#ntList .rsvrow [data-hold]'));
 t('點一下展開成完整卡片',()=>{
   D.querySelector('#ntList .rsvrow[data-ntcard="n1"]').click();
   const it=D.querySelector('#ntList .item[data-ntcard="n1"]');
   return !!it&&it.textContent.includes('內容一')&&!!it.querySelector('[data-ntedit]')
     &&!!it.querySelector('[data-hold]')});
 t('再點一下收回一行',()=>{
   D.querySelector('#ntList .item[data-ntcard="n1"]').click();
   return !!D.querySelector('#ntList .rsvrow[data-ntcard="n1"]')});
 t('Notes 與 Resolved 用同一種列',()=>{
   const a=D.querySelector('#qList .rsvrow'),b=D.querySelector('#ntList .rsvrow');
   return a.className===b.className&&!!a.querySelector('.rtx')&&!!b.querySelector('.rtx')});

 // ⑤ Google 日曆收合
 t('Google 日曆預設收合',()=>{
   const b=D.getElementById('toggleGC');
   return !!b&&b.getAttribute('aria-expanded')==='false'
     &&D.getElementById('gcBox').style.display==='none'});
 t('收合鈕是雙層箭號',()=>{const b=D.getElementById('toggleGC');
   return !!b.querySelector('svg')&&b.classList.contains('pastbtn')
     &&b.textContent.trim()==='Google 日曆'});
 t('點一下展開',()=>{D.getElementById('toggleGC').click();
   return D.getElementById('gcBox').style.display===''
     &&D.getElementById('toggleGC').getAttribute('aria-expanded')==='true'});
 t('再點一下收合',()=>{D.getElementById('toggleGC').click();
   return D.getElementById('gcBox').style.display==='none'});
 t('設定網址後 iframe 才出現',()=>{
   S.gc='https://calendar.google.com/x';W.eval('renderGC()');
   D.getElementById('toggleGC').click();
   const f=D.querySelector('#gcBox iframe');
   return !!f&&f.getAttribute('loading')==='lazy'});

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
