const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const fire=(el,t)=>el.dispatchEvent(new W.Event(t,{bubbles:true}));
const DAY=864e5;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const day=n=>new Date(Date.now()+n*DAY).toISOString().slice(0,10);
 const ptitles=()=>[...D.querySelectorAll('#progList .prow .ptxt')].map(x=>x.textContent);
 const kdtitles=sel=>[...D.querySelectorAll(sel+' .bd .ti')].map(x=>x.textContent);

 // ① PROGRESS 獨立（v44：資料在 S.prog，跟 KEY DATES 不連動）
 S.kd.push({id:'a1',date:day(3),title:'論文計畫書截止',type:'other'});
 S.kd.push({id:'a2',date:day(10),title:'資格考',type:'exam'});
 S.kd.push({id:'p1',date:day(-3),title:'過期的日期',type:'other'});
 S.prog.push({id:'t1',created:1,date:day(7),title:'跑完 target trial'});
 S.prog.push({id:'t2',created:2,date:day(2),title:'寫完 SAP'});
 S.prog.push({id:'t3',created:3,date:day(30),title:'投稿第一篇'});
 S.prog.push({id:'t4',created:4,date:day(-5),title:'早該做完的'});
 W.eval('renderAll()');

 t('📌 PROGRESS 在最前面',()=>[...D.querySelectorAll('#p-calendar .blockhead .bt')]
   .map(x=>x.textContent).join('|')==='📌 PROGRESS|📅 KEY DATES|🗓️ TIMETABLE');
 t('KEY DATES 沒有 To do 分組',()=>{
   const g=[...D.querySelectorAll('#kdList .kdgroup')].map(x=>x.textContent.trim());
   return !g.includes('To do')&&g.includes('Other')&&g.includes('Exam')});
 t('KEY DATES 不含進度項目',()=>{
   const ti=kdtitles('#kdList');
   return ti.includes('論文計畫書截止')&&!ti.some(x=>x.includes('SAP'))});
 t('進度清單全部列出、不折疊',()=>D.querySelectorAll('#progList .prow').length===4
   &&D.querySelectorAll('#progList .kx').length===0
   &&D.querySelectorAll('#progList .kdgroup').length===0);
 t('依日期排序，過期的在最上面',()=>
   ptitles().join('|')==='早該做完的|寫完 SAP|跑完 target trial|投稿第一篇');
 t('樣式和 KEY DATES 不同（無 .kd 卡片）',()=>D.querySelectorAll('#progList .kd').length===0
   &&!!D.querySelector('#progList .prog .prow .pdot')&&!!D.querySelector('#progList .prow .pday'));
 t('逾期的那列加底色',()=>{
   const r=[...D.querySelectorAll('#progList .prow')][0];
   return r.classList.contains('past')&&r.querySelector('.pday').textContent.endsWith('天前')});
 t('逾期進度不進 KEY DATES「已過期」區',()=>{
   D.getElementById('togglePast').click();
   const ti=kdtitles('#kdPastList');
   return ti.includes('過期的日期')&&!ti.includes('早該做完的')});
 t('進度項目不會被兩個月自動清除',()=>{
   S.prog.push({id:'t5',created:5,date:day(-200),title:'很久以前的待辦'});
   S.kd.push({id:'p2',date:day(-200),title:'很久以前的截止',type:'other'});
   W.eval('renderKD();renderProg()');
   return S.prog.some(k=>k.id==='t5')&&!S.kd.some(k=>k.id==='p2')});
 t('進度清單有自己的 ＋ 與表單',()=>{
   const b=D.getElementById('togglePG');
   return !!b&&b.closest('.blockhead').textContent.includes('PROGRESS')
     &&!!D.getElementById('pgForm')&&!D.querySelector('#pgForm select')});
 t('按 ＋ 打開自己的表單（不是 KEY DATES 的）',()=>{
   D.getElementById('togglePG').click();
   return D.getElementById('pgForm').style.display!=='none'
     &&D.getElementById('kdForm').style.display==='none'});
 t('新增寫進 S.prog，不碰 S.kd',()=>{
   const nk=S.kd.length;
   D.getElementById('pg-date').value=day(1);
   D.getElementById('pg-title').value='新的待辦';
   D.getElementById('addPG').click();
   return ptitles().includes('新的待辦')&&S.kd.length===nk
     &&S.prog.some(p=>p.title==='新的待辦')&&!kdtitles('#kdList').includes('新的待辦')});
 t('進度清單的 ✎ 可編輯',()=>{
   D.querySelector('#progList [data-ed-pg]').click();
   const ok=D.getElementById('pg-title').value.length>0&&D.getElementById('addPG').textContent==='Update';
   D.getElementById('pg-title').value='改過的名字';
   D.getElementById('addPG').click();
   return ok&&ptitles().includes('改過的名字')});
 t('KEY DATES 表單還是原樣（有 Type）',()=>{
   D.getElementById('toggleKD').click();
   return D.getElementById('kdForm').style.display!=='none'
     &&!!D.getElementById('kd-type')&&D.getElementById('kd-type').closest('label').style.display!=='none'});
 t('進度清單的列可長按刪除進回收桶',()=>{
   const h=D.querySelector('#progList [data-hold^="prog|"]');if(!h)return 'no hold';
   const id=h.dataset.hold.split('|')[1],n=S.prog.length;
   W.eval(`doHold('prog|${id}')`);
   return S.prog.length===n-1&&S.trash.some(x=>x.type==='prog'&&x.data.id===id)});

 // ② KEY DATES 類型可新增
 W.eval("show('kdForm',false)");
 t('Type 下拉只剩 Exam／School／Other',()=>{
   const v=[...D.getElementById('kd-type').options].map(o=>o.value);
   return v.join('|')==='exam|school|other|__new'});
 t('Deadline 類型已移除',()=>!W.eval('kdcatIds()').includes('deadline'));
 t('To do 從 KEY DATES 類型徹底移除',()=>!W.eval('kdcatIds()').includes('todo')
   &&![...D.querySelectorAll('#catMgr [data-catren]')].some(i=>i.value==='To do'));
 t('可以新增類型',()=>{
   W.prompt=()=>'Grant';
   const n0=S.kdcats.length;
   const s=D.getElementById('kd-type');s.value='__new';fire(s,'change');
   const c=S.kdcats[S.kdcats.length-1];
   return S.kdcats.length===n0+1&&c.name==='Grant'&&s.value===c.id});
 t('新類型會出現在 KEY DATES 分組',()=>{
   const id=S.kdcats[S.kdcats.length-1].id;
   S.kd.push({id:'g1',date:day(5),title:'NHRI 申請',type:id});
   W.eval('renderKD()');
   return [...D.querySelectorAll('#kdList .kdgroup')].some(x=>x.textContent.includes('Grant'))});
 t('取消輸入不會新增',()=>{
   W.prompt=()=>null;const n=S.kdcats.length;
   const s=D.getElementById('kd-type');s.value='__new';fire(s,'change');
   return S.kdcats.length===n&&s.value!=='__new'});
 t('壞掉的 type 會退回 other',()=>W.eval("kdcatFix('不存在')")==='other');

 // ② 分類管理
 t('分類管理在「分類與清理」底下',()=>[...D.querySelectorAll('#p-settings .setg')]
   .some(x=>x.firstChild.textContent==='分類與清理')
   &&D.getElementById('catMgr').closest('#sg-clean')!==null);
 t('三組分類都列出來',()=>{
   const g=[...D.querySelectorAll('#catMgr .kdgroup')].map(x=>x.textContent.trim());
   return g.join('|')==='Reading 分類標籤|Questions／Notes 分類|KEY DATES 類型'});
 t('每一列有名稱、筆數',()=>{
   const row=[...D.querySelectorAll('#catMgr .chk')].find(x=>x.querySelector('input').value==='Exam');
   return !!row&&/\d+ 筆/.test(row.textContent)});
 t('內建的標「內建」且沒有 ✕',()=>{
   const row=[...D.querySelectorAll('#catMgr .chk')].find(x=>x.querySelector('input').value==='老師指定');
   return row.textContent.includes('內建')&&!row.querySelector('[data-hold]')});
 t('自訂的有長按 ✕',()=>{
   const row=[...D.querySelectorAll('#catMgr .chk')].find(x=>x.querySelector('input').value==='Grant');
   return !!row&&/^kdcat\|k/.test(row.querySelector('[data-hold]').dataset.hold)});
 t('改名會存進資料',()=>{
   const i=[...D.querySelectorAll('#catMgr [data-catren]')].find(x=>x.value==='Grant');
   i.value='研究計畫';fire(i,'input');
   return S.kdcats[S.kdcats.length-1].name==='研究計畫'});
 t('改名會同步到下拉與分組',()=>{
   const i=[...D.querySelectorAll('#catMgr [data-catren]')].find(x=>x.value==='研究計畫');
   fire(i,'change');
   return [...D.getElementById('kd-type').options].some(o=>o.textContent==='研究計畫')
     &&[...D.querySelectorAll('#kdList .kdgroup')].some(x=>x.textContent.includes('研究計畫'))});
 t('內建改名也可以',()=>{
   const i=[...D.querySelectorAll('#catMgr [data-catren]')].find(x=>x.value==='老師指定');
   i.value='指導教授指定';fire(i,'input');fire(i,'change');
   return S.cats.find(x=>x.id==='teacher').name==='指導教授指定'});
 t('空的自訂分類也刪得掉（原本只能從分組標題刪）',()=>{
   const id=W.eval("qcatAdd('空分類')");W.eval('renderCatMgr()');
   const row=[...D.querySelectorAll('#catMgr .chk')].find(x=>x.querySelector('input').value==='空分類');
   const has=!!row&&row.textContent.includes('0 項');
   W.eval(`doHold('qcat|${id}')`);
   return has&&!S.qcats.some(x=>x.id===id)});
 t('刪 KEY DATES 類型會把項目退回 Other',()=>{
   const id=S.kdcats[S.kdcats.length-1].id;
   W.eval(`doHold('kdcat|${id}')`);
   return !S.kdcats.some(x=>x.id===id)
     &&S.kd.find(k=>k.id==='g1').type==='other'});
 t('內建類型擋住不給刪',()=>{
   W.eval("doHold('kdcat|exam')");
   return S.kdcats.some(x=>x.id==='exam')});
 t('kdcats 會跟著備份與合併',()=>src.includes('kdcats:DEFAULT_KDCATS.map')
   &&src.includes('(inc.kdcats||[]).forEach'));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
