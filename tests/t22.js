const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const MO=864e5*31;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const now=Date.now();
 const qcards=()=>[...D.querySelectorAll('#qList>.item')];

 for(let i=0;i<3;i++)S.qs.push({id:'o'+i,created:now-i*1000,kind:'mine',
   q:'未解決'+i,a:'答案'+i,done:false,links:[],tags:[]});
 [0,1,2,3,4].forEach(i=>S.qs.push({id:'d'+i,created:now-i,kind:i<3?'mine':'study',
   q:'已解決'+i,a:'解答'+i,done:true,doneAt:now-i*MO,links:[],tags:[]}));
 W.eval('renderAll()');

 // ① 點問題收合答案
 t('未解決預設展開答案',()=>qcards().length===3
   &&qcards()[0].textContent.includes('答案0'));
 t('題目可點、有 data-qopen',()=>{
   const h=qcards()[0].firstElementChild;
   return h.dataset.qopen==='o0'&&h.getAttribute('style').includes('cursor:pointer')});
 t('點一下收起答案',()=>{
   qcards()[0].firstElementChild.click();
   const c=qcards()[0];
   return !c.textContent.includes('答案0')&&c.textContent.includes('未解決0')});
 t('收起時標題後有 ⌄ 提示',()=>!!qcards()[0].querySelector('.qmore')
   &&src.includes('.qmore{margin-left:7px'));
 t('再點一下展開',()=>{
   qcards()[0].firstElementChild.click();
   return qcards()[0].textContent.includes('答案0')
     &&!qcards()[0].querySelector('.qmore')});
 t('只影響被點的那張',()=>{
   qcards()[1].firstElementChild.click();
   return qcards()[0].textContent.includes('答案0')
     &&!qcards()[1].textContent.includes('答案1')
     &&qcards()[2].textContent.includes('答案2')});
 t('沒有答案的不顯示 ⌄',()=>{
   S.qs.push({id:'oz',created:now+1,kind:'mine',q:'沒答案',a:'',done:false,links:[],tags:[]});
   W.eval('renderQ()');
   const c=qcards()[0];c.firstElementChild.click();
   return !qcards()[0].querySelector('.qmore')});
 t('收合會退出編輯模式',()=>{
   W.eval("qShut.clear();renderQ()");
   D.querySelector('[data-qedit="o0"]').click();
   const open=D.querySelectorAll('#qList .editbox').length===1;
   qcards().find(c=>c.textContent.includes('未解決0')).firstElementChild.click();
   return open&&D.querySelectorAll('#qList .editbox').length===0});

 // ② Resolved 預設展開、先 3 筆
 W.eval("qShut.clear();S.qs=S.qs.filter(q=>q.id!=='oz');renderQ()");
 t('Resolved 預設是展開的',()=>{
   const b=D.querySelector('#qList [data-qgrp="__done"]');
   return b.getAttribute('aria-expanded')==='true'&&!!D.querySelector('#qList .dirnav')});
 t('預設只顯示 3 筆',()=>D.querySelectorAll('#qList .dirbody .rsvrow').length===3);
 t('顯示的是最近解決的 3 筆',()=>{
   const txt=[...D.querySelectorAll('#qList .dirbody .rsvrow .rtx')].map(x=>x.textContent);
   return txt.join('|')==='已解決0|已解決1|已解決2'});
 t('下方有「更多」',()=>{
   const b=D.getElementById('rsvMore');
   return !!b&&b.textContent.trim()==='更多'&&!!b.querySelector('svg')
     &&b.title.includes('展開其餘 2 筆')});
 t('點更多展開全部',()=>{
   D.getElementById('rsvMore').click();
   return D.querySelectorAll('#qList .dirbody .rsvrow').length===5
     &&D.getElementById('rsvMore').textContent.trim()==='收合'});
 t('再點收回 3 筆',()=>{
   D.getElementById('rsvMore').click();
   return D.querySelectorAll('#qList .dirbody .rsvrow').length===3});
 t('箭號仍可整區收合',()=>{
   D.querySelector('#qList [data-qgrp="__done"]').click();
   const gone=!D.querySelector('#qList .dirnav');
   D.querySelector('#qList [data-qgrp="__done"]').click();
   return gone&&!!D.querySelector('#qList .dirnav')});
 t('只有 3 筆以下不顯示更多',()=>{
   const keep=S.qs.filter(q=>!q.done||['d0','d1'].includes(q.id));
   const bak=S.qs.slice();S.qs=keep;W.eval('renderQ()');
   const no=!D.getElementById('rsvMore');S.qs=bak;W.eval('renderQ()');return no});

 // ③ 排序
 t('Research directions 純新到舊',()=>{
   S.dirs.push({id:'r1',created:now-3000,mtime:now,title:'舊方向',status:'doing',log:[],links:[]});
   S.dirs.push({id:'r2',created:now-1000,mtime:now,title:'新方向',status:'todo',log:[],links:[]});
   W.eval('renderDIR()');
   const h=[...D.querySelectorAll('#dirList h3')].map(x=>x.textContent.trim());
   return h[0]==='新方向'&&h[1]==='舊方向'});
 t('不再用 status 排序',()=>!src.includes('const order={doing:0,todo:1,paused:2,done:3}'));
 t('Reading 新到舊',()=>src.includes("((y.star?1:0)-(x.star?1:0))||(y.created-x.created)"));
 t('Questions 新到舊',()=>src.includes('.filter(x=>!x.done).sort((a,b)=>b.created-a.created)'));
 t('Notes 新到舊',()=>src.includes('.sort((a,b)=>(b.mtime||b.created)-(a.mtime||a.created))'));
 t('Meetings 新到舊',()=>src.includes(".sort((x,y)=>(y.date||'').localeCompare(x.date||''))"));
 t('回收桶新到舊',()=>src.includes('.sort((a,b)=>b.at-a.at).slice(0,200)'));

 // ⑤ 回收桶清空後不會復活
 t('清空會留下墓碑',()=>{
   S.trash=[{tid:'t1',type:'q',at:now,data:{id:'x',q:'被刪的'}},
            {tid:'t2',type:'note',at:now-1,data:{id:'y',title:'也被刪的'}}];
   W.eval("doHold('purgeall|1')");
   return S.trash.length===0&&!!S.tombT.t1&&!!S.tombT.t2});
 t('合併時雲端的舊回收桶不會回來',()=>{
   W.eval(`mergeState({trash:[{tid:'t1',type:'q',at:${now},data:{id:'x',q:'被刪的'}}],tomb:{},tombT:{}})`);
   return S.trash.length===0});
 t('單筆永久刪除也留墓碑',()=>{
   S.trash=[{tid:'t3',type:'q',at:now,data:{id:'z',q:'第三筆'}}];
   W.eval("doHold('purge1|t3')");
   W.eval(`mergeState({trash:[{tid:'t3',type:'q',at:${now},data:{id:'z',q:'第三筆'}}],tomb:{},tombT:{}})`);
   return S.trash.length===0&&!!S.tombT.t3});
 t('墓碑會跟著同步',()=>src.includes('Object.keys(inc.tombT||{}).forEach')
   &&src.includes('tombT:{},kdcats:'));
 t('沒被墓碑標記的仍會合併進來',()=>{
   W.eval(`mergeState({trash:[{tid:'t9',type:'q',at:${now},data:{id:'w',q:'別人刪的'}}],tomb:{},tombT:{}})`);
   return S.trash.length===1&&S.trash[0].tid==='t9'});
 t('墓碑 180 天後清掉',()=>{
   S.tombT.old=now-200*864e5;W.eval('purgeTrash()');
   return !S.tombT.old&&!!S.tombT.t1});

 // ④ Settings 版面
 t('分類與清理合成一區',()=>{
   const hs=[...D.querySelectorAll('#p-settings .setg')].map(x=>x.firstChild.textContent);
   return hs.join('|')==='同步|備份|Google 日曆|分類與清理|使用說明'});
 t('底下兩個折疊區',()=>{
   const sums=[...D.querySelectorAll('#p-settings details summary')].map(x=>x.textContent);
   return sums.includes('🗑️ 回收桶')&&sums.includes('沒有卡片指向的 HTML')
     &&!sums.includes('孤兒 HTML')});
 t('「孤兒」字樣已換掉',()=>!/孤兒 HTML|孤兒檔案/.test(D.getElementById('p-settings').textContent));
 t('回收桶內容還在',()=>!!D.getElementById('trashList')
   &&D.getElementById('trashList').closest('details').querySelector('summary').textContent==='🗑️ 回收桶');

 // ⑥ 使用說明收合
 t('五區預設都收合',()=>[...D.querySelectorAll('#p-settings [data-setg]')]
   .every(b=>b.getAttribute('aria-expanded')==='false'
     &&D.getElementById('sg-'+b.dataset.setg).style.display==='none'));
 t('每一列都是文字＋橫線，箭號在最右邊',()=>[...D.querySelectorAll('#p-settings .setg')]
   .every(h=>h.classList.contains('kdgroup')
     &&(!h.querySelector('.kx')||h.lastElementChild===h.querySelector('.kx'))));
 t('點使用說明會展開',()=>{
   D.querySelector('[data-setg="help"]').click();
   return D.getElementById('sg-help').style.display===''
     &&D.getElementById('helpBox').textContent.length>500});
 t('再點一下收合',()=>{
   D.querySelector('[data-setg="help"]').click();
   return D.getElementById('sg-help').style.display==='none'});

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
