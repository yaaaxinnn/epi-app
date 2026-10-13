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
 const nav=sel=>[...D.querySelectorAll(sel+' .dirnav .dnav')];
 const txt=el=>el.querySelector('.nm').textContent.trim();
 const cnt=el=>el.querySelector('.ct').textContent.trim();

 // 資料：3 未解決、6 已解決（2 分類 × 3 月份）
 for(let i=0;i<3;i++)S.qs.push({id:'o'+i,created:now-i*1000,kind:i?'study':'mine',
   q:'未解決'+i,a:'',done:false,links:[],tags:[]});
 const D1=[['d0','mine',0],['d1','mine',0],['d2','mine',MO],['d3','study',0],['d4','study',2*MO],['d5','study',2*MO]];
 D1.forEach(([id,k,off],i)=>S.qs.push({id,created:now-off-i,kind:k,q:'已解決'+id,a:'答案'+id,
   done:true,doneAt:now-off-i*1000,links:[],tags:[]}));
 for(let i=0;i<5;i++)S.notes.push({id:'n'+i,created:now-i,mtime:now-(i<3?0:2*MO)-i*1000,
   title:'筆記'+i,body:'內容'+i,kind:i<2?'mine':'study',links:[],tags:[]});
 W.eval('renderAll()');

 // ① 未解決不分類
 t('未解決區沒有分類標題',()=>{
   const g=[...D.querySelectorAll('#qList .kdgroup')].map(x=>x.textContent.trim());
   return g.join('|')==='Resolved'});
 t('未解決全部列出、日期新到舊',()=>{
   const it=[...D.querySelectorAll('#qList>.item')];
   return it.length===3&&it.map(x=>x.textContent.trim().slice(0,4)).join('|')==='未解決0|未解決1|未解決2'});

 // ① Resolved 左側目錄
 t('Resolved 有左目錄 + 右內容',()=>!!D.querySelector('#qList .dirwrap>.dirnav')
   &&!!D.querySelector('#qList .dirwrap>.dirbody'));
 t('目錄第一項是「全部」並顯示總數',()=>{const a=nav('#qList')[0];
   return txt(a)==='全部'&&cnt(a)==='6'});
 t('目錄依分類顯示數量',()=>{const a=nav('#qList');
   return txt(a[1])==='Mine'&&cnt(a[1])==='3'&&txt(a[2])==='Study'&&cnt(a[2])==='3'});
 t('未選分類時不展開月份',()=>nav('#qList').every(x=>!x.classList.contains('mon')));
 t('右側預設全部、不分類、依日期新到舊',()=>{
   const rows=[...D.querySelectorAll('#qList .dirbody .rsvrow')];
   // 用 doneAt 比，不用畫面上的 M/D 字串（跨年底會排錯）
   const ts=rows.map(r=>(S.qs.find(q=>q.id===r.dataset.qopen)||{}).doneAt);
   // 預設只顯示 3 筆，按「更多」看全部
   if(rows.length!==3)return 'first page='+rows.length;
   D.getElementById('rsvMore').click();
   const all=[...D.querySelectorAll('#qList .dirbody .rsvrow')];
   const t2=all.map(r=>(S.qs.find(q=>q.id===r.dataset.qopen)||{}).doneAt);
   return all.length===6&&D.querySelectorAll('#qList .dirbody .kdgroup').length===0
     &&t2.every((v,i)=>i===0||t2[i-1]>=v)});
 t('點分類會過濾',()=>{
   nav('#qList')[1].click();
   const rows=[...D.querySelectorAll('#qList .dirbody .rsvrow')];
   return rows.length===3&&rows.every(r=>r.textContent.includes('已解決d'))
     &&nav('#qList')[1].getAttribute('aria-pressed')==='true'});
 t('選分類後展開月份次目錄',()=>{
   const ms=nav('#qList').filter(x=>x.classList.contains('mon'));
   return ms.length===2&&/^\d{4}-\d{2}$/.test(txt(ms[0]))&&txt(ms[0])>txt(ms[1])
     &&cnt(ms[0])==='2'&&cnt(ms[1])==='1'});
 t('點月份再過濾',()=>{
   const ms=nav('#qList').filter(x=>x.classList.contains('mon'));
   ms[1].click();
   return D.querySelectorAll('#qList .dirbody .rsvrow').length===1});
 t('再點月份取消',()=>{
   const ms=nav('#qList').filter(x=>x.classList.contains('mon'));
   ms.find(x=>x.getAttribute('aria-pressed')==='true').click();
   return D.querySelectorAll('#qList .dirbody .rsvrow').length===3});
 t('再點分類回到全部',()=>{
   nav('#qList')[1].click();
   return D.querySelectorAll('#qList .dirbody .rsvrow').length===6
     &&nav('#qList')[0].getAttribute('aria-pressed')==='true'});
 t('一行式列點開仍可展開答案',()=>{
   D.querySelector('#qList .dirbody .rsvrow').click();
   return D.getElementById('qList').textContent.includes('答案d0')});

 // ② Notes 目錄
 t('Notes 有左目錄 + 右內容',()=>!!D.querySelector('#ntList .dirwrap>.dirnav')
   &&!!D.querySelector('#ntList .dirwrap>.dirbody'));
 t('Notes 目錄顯示分類數量',()=>{const a=nav('#ntList');
   return txt(a[0])==='全部'&&cnt(a[0])==='5'&&txt(a[1])==='Mine'&&cnt(a[1])==='2'
     &&txt(a[2])==='Study'&&cnt(a[2])==='3'});
 t('Notes 右側單欄一行式、不分類、新到舊',()=>{
   const it=[...D.querySelectorAll('#ntList .dirbody>.rsvrow')];
   return it.length===5&&D.querySelectorAll('#ntList .qgrid').length===0
     &&it[0].querySelector('.rtx').textContent==='筆記0'});
 t('Notes 點分類過濾 + 展開月份',()=>{
   nav('#ntList')[2].click();
   const it=[...D.querySelectorAll('#ntList .dirbody>.rsvrow')];
   const ms=nav('#ntList').filter(x=>x.classList.contains('mon'));
   return it.length===3&&ms.length===2&&cnt(ms[0])==='1'&&cnt(ms[1])==='2'});
 t('Notes 點月份再過濾',()=>{
   const ms=nav('#ntList').filter(x=>x.classList.contains('mon'));
   ms[1].click();
   return D.querySelectorAll('#ntList .dirbody>.rsvrow').length===2});
 t('Notes 目錄與 Questions 互不干擾',()=>
   D.querySelectorAll('#qList .dirbody .rsvrow').length===5
   &&D.getElementById('qList').textContent.includes('答案d0'));
 t('搜尋時目錄跟著縮',()=>{
   const i=D.getElementById('nsearch');i.value='筆記0';
   i.dispatchEvent(new W.Event('input',{bubbles:true}));
   const a=nav('#ntList');
   return cnt(a[0])==='1'&&D.querySelectorAll('#ntList .dirbody>.rsvrow').length===1});
 t('清除搜尋恢復',()=>{D.getElementById('nsearchX').click();
   return cnt(nav('#ntList')[0])==='5'});

 // ③ emoji
 t('七個主要區塊標題有 emoji',()=>[...D.querySelectorAll('.blockhead:not(.plain) .bt')]
   .map(x=>x.textContent).join('|')==='❓ QUESTIONS|📒 NOTES|📚 LIBRARY|📋 MEETINGS|🎯 RESEARCH DIRECTIONS|✅ TO-DO|📌 PROGRESS|📅 KEY DATES|🗓️ TIMETABLE');
 t('Reading 分類標題有 emoji',()=>{
   S.papers.push({id:'p1',created:now,title:'A',authors:'',tags:[],note:'',cat:'teacher',q:'',cite:''});
   S.papers.push({id:'p2',created:now,title:'B',authors:'',tags:[],note:'',cat:'course',q:'',cite:''});
   S.papers.push({id:'p3',created:now,title:'C',authors:'',tags:[],note:'',cat:'',q:'',cite:''});
   W.eval('renderPapers()');
   const g=D.getElementById('paperList').textContent;
   return g.includes('👨‍🏫 老師指定')&&g.includes('📘 課程')&&g.includes('📄 未分類')});
 t('自訂分類沒有 emoji 也正常',()=>{
   const id=W.eval("catAdd('Lab meeting')");
   S.papers.find(x=>x.id==='p3').cat=id;W.eval('renderPapers()');
   const g=D.getElementById('paperList').textContent;
   return g.includes('Lab meeting')&&!/[\u{1F300}-\u{1FAFF}]\s*Lab meeting/u.test(g)});
 t('Settings 標題仍無 emoji',()=>[...D.querySelectorAll('#p-settings .setg')]
   .every(x=>!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(x.firstChild.textContent)));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
