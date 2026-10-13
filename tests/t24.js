// v44：PROGRESS 與 KEY DATES 脫鉤、Settings 選擇性收合與 ⓘ 提示
const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const DAY=864e5;
const day=n=>new Date(Date.now()+n*DAY).toISOString().slice(0,10);
// 以 v43 的存檔格式開機：todo 混在 kd 裡、kdcats 帶隱藏的 todo、一筆來自 Google 日曆
const OLD={v:1,papers:[],cards:[],qs:[],mt:[],dirs:[],notes:[],imgs:{},courses:[],classes:[],trash:[],tomb:{},
  kd:[{id:'t1',date:day(5),title:'寫 SAP',type:'todo'},
      {id:'t2',date:day(-3),title:'逾期待辦',type:'todo'},
      {id:'g1',gid:'gcal-1',date:day(9),title:'日曆來的 meeting',type:'todo'},
      {id:'d1',date:day(4),title:'舊 deadline',type:'deadline'},
      {id:'e1',date:day(12),title:'資格考',type:'exam'}],
  kdcats:[{id:'exam',name:'Exam'},{id:'school',name:'School'},{id:'other',name:'Other'},{id:'todo',name:'To do',hidden:true}]};
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){w.localStorage.setItem('epi-yaxin',JSON.stringify(OLD));
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');

 // ── ② 舊資料遷移 ──
 t('手動建立的 todo 搬進 S.prog',()=>S.prog.map(p=>p.title).sort().join('|')==='寫 SAP|逾期待辦');
 t('搬過去保留原本 id 與日期',()=>{const p=S.prog.find(x=>x.id==='t1');return !!p&&p.date===day(5)});
 t('Google 日曆來的留在 KEY DATES、改成 Other',()=>{
   const g=S.kd.find(k=>k.id==='g1');return !!g&&g.type==='other'&&g.gid==='gcal-1'});
 t('S.kd 裡已經沒有任何 todo',()=>!S.kd.some(k=>k.type==='todo'));
 t('舊 deadline 也被收成 Other',()=>S.kd.find(k=>k.id==='d1').type==='other');
 t('kdcats 只剩 Exam／School／Other',()=>S.kdcats.map(x=>x.id).join('|')==='exam|school|other');
 t('遷移可重複執行不會重複搬',()=>{W.eval('migrateProg();migrateProg()');return S.prog.length===2});
 t('舊版裝置把 todo 送回來，合併後會再被搬走',()=>{
   W.eval(`mergeState({kd:[{id:'t9',date:'${day(6)}',title:'舊裝置的待辦',type:'todo'}],tomb:{}})`);
   return S.prog.some(p=>p.id==='t9')&&!S.kd.some(k=>k.id==='t9')});

 // ── ② 介面上看不到 To do ──
 t('Type 下拉沒有 To do',()=>![...D.getElementById('kd-type').options].some(o=>/to ?do/i.test(o.textContent)));
 t('分類清單沒有 To do',()=>![...D.querySelectorAll('#catMgr [data-catren]')].some(i=>/to ?do/i.test(i.value)));
 t('KEY DATES 沒有 To do 分組',()=>![...D.querySelectorAll('#kdList .kdgroup')].some(g=>/to ?do/i.test(g.textContent)));
 t('Google 日曆類型碼不再導向 todo',()=>
   W.eval("kdAutoType('M 組會')").type==='other'&&W.eval("kdAutoType('T 跑分析')").type==='other');
 t('關鍵字 meeting 不再導向 todo',()=>W.eval("kdAutoType('lab meeting')").type!=='todo');
 t('程式裡只剩遷移用的 todo 字樣',()=>{
   const hits=(src.match(/['"]todo['"]/g)||[]).length;
   const allowed=(src.match(/status:'todo'|value="todo"|k\.type==='todo'|x\.id!=='todo'|k\.type!=='todo'/g)||[]).length;
   return hits===allowed||hits+' vs '+allowed});

 // ── ② 兩邊完全獨立 ──
 t('PROGRESS 有自己的表單、沒有 Type',()=>!!D.getElementById('pgForm')&&!D.querySelector('#pgForm select'));
 t('新增進度只動 S.prog',()=>{
   const nk=S.kd.length,np=S.prog.length;
   D.getElementById('togglePG').click();
   D.getElementById('pg-title').value='寫 discussion';D.getElementById('pg-date').value=day(15);
   D.getElementById('addPG').click();
   return S.prog.length===np+1&&S.kd.length===nk});
 t('新增 KEY DATES 只動 S.kd',()=>{
   const nk=S.kd.length,np=S.prog.length;
   D.getElementById('toggleKD').click();
   D.getElementById('kd-title').value='期中考';D.getElementById('kd-date').value=day(20);
   D.getElementById('kd-type').value='exam';
   D.getElementById('addKD').click();
   return S.kd.length===nk+1&&S.prog.length===np});
 t('Google 日曆同步不會碰 S.prog',()=>/function gcFetchEvents[\s\S]*?S\.kd\.push/.test(src)
   &&!/function gcFetchEvents[\s\S]{0,3000}S\.prog/.test(src));
 t('S.prog 會跟著同步合併',()=>src.includes('S.prog=applyTombs(mergeArr(S.prog||[],inc.prog||[]),tm)'));
 t('S.prog 在預設資料裡',()=>/function defaults\(\)\{return\{v:1,prog:\[\]/.test(src));
 t('刪除進度會進回收桶、可還原',()=>{
   const id=S.prog[0].id;
   W.eval(`doHold('prog|${id}')`);
   const tr=S.trash.find(x=>x.type==='prog'&&x.data.id===id);
   if(!tr)return 'not in trash';
   W.eval('renderTrash()');
   D.querySelector(`[data-undel="${tr.tid}"]`).click();
   return S.prog.some(p=>p.id===id)&&!!D.querySelector('#progList .prow')});

 // ── ① Settings：只有三區可收合 ──
 const heads=()=>[...D.querySelectorAll('#p-settings .setg')];
 const lab=h=>h.firstChild.textContent;
 t('仍是五條橫線式標題',()=>heads().map(lab).join('|')==='同步|備份|Google 日曆|分類與清理|使用說明');
 t('只有同步／Google 日曆／使用說明有 ⌄⌄',()=>
   heads().filter(h=>h.querySelector('.kx')).map(lab).join('|')==='同步|Google 日曆|使用說明');
 t('備份、分類與清理常駐展開',()=>
   D.getElementById('sg-backup').style.display===''&&D.getElementById('sg-clean').style.display==='');
 t('可收合的三區預設收著',()=>['sync','gcal','help'].every(k=>D.getElementById('sg-'+k).style.display==='none'));
 t('⌄⌄ 永遠在最右邊',()=>heads().filter(h=>h.querySelector('.kx'))
   .every(h=>h.lastElementChild.classList.contains('kx')));

 // ── ③ ⓘ 提示 ──
 t('四區有 ⓘ，使用說明沒有',()=>
   heads().filter(h=>h.querySelector('.qm')).map(lab).join('|')==='同步|備份|Google 日曆|分類與清理');
 t('ⓘ 在 ⌄⌄ 左邊',()=>heads().filter(h=>h.querySelector('.qm')&&h.querySelector('.kx'))
   .every(h=>h.querySelector('.qm').nextElementSibling===h.querySelector('.kx')));
 t('說明預設全部收起',()=>['tipGh','tipData','tipGc','tipClean'].every(id=>!D.getElementById(id).classList.contains('on')));
 t('按 ⓘ 展開、再按收起',()=>{
   const q=D.querySelector('[data-tip="tipData"]');
   q.click();const a=D.getElementById('tipData').classList.contains('on')&&q.getAttribute('aria-expanded')==='true';
   q.click();const b=!D.getElementById('tipData').classList.contains('on')&&q.getAttribute('aria-expanded')==='false';
   return a&&b});
 t('ⓘ 不影響區塊收合狀態',()=>{
   D.querySelector('[data-tip="tipGh"]').click();
   const r=D.getElementById('sg-sync').style.display==='none'&&D.getElementById('tipGh').classList.contains('on');
   D.querySelector('[data-tip="tipGh"]').click();return r});
 t('卡片內不再有長段說明',()=>{
   const body=['sg-sync','sg-backup','sg-gcal','sg-clean'].map(id=>D.getElementById(id).textContent).join('');
   return !body.includes('產生時選 Fine-grained')&&!body.includes('在下拉選單最下面選')&&!body.includes('十年後用記事本')
     &&!body.includes('保留最近三份')&&!body.includes('卡片存的是代號')
     &&!body.includes('commit 歷史')});
 t('說明文字都還在（搬進 ⓘ）',()=>
   D.getElementById('tipGh').textContent.includes('Fine-grained')
   &&D.getElementById('tipData').textContent.includes('保留最近三份')
   &&D.getElementById('tipGc').textContent.includes('嵌入網址')
   &&D.getElementById('tipClean').textContent.includes('卡片存的是代號'));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},500);
