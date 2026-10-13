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

 // 塞資料
 for(let i=0;i<6;i++)S.papers.push({id:'p'+i,created:Date.now()-i,title:'Paper '+i,authors:'A',tags:[],note:'',cat:i<2?'teacher':''});
 for(let i=0;i<5;i++)S.qs.push({id:'q'+i,created:Date.now()-i,kind:'mine',q:'問題'+i,a:'答'+i,done:i===4,links:[]});
 for(let i=0;i<5;i++)S.notes.push({id:'n'+i,created:Date.now()-i,mtime:Date.now()-i,title:'筆記'+i,body:'內容'+i,kind:'mine',links:[{name:'連結'+i,url:'https://x.com/'+i}]});
 S.mt.push({id:'m1',created:Date.now(),mtime:Date.now(),date:'2026-09-17',title:'週會',topics:'**重點**內容',
   full:'逐字稿',actions:[{text:'待辦A',done:false}],linksL:[{name:'簡報',url:'https://x.com/s'}]});
 const fut=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
 ['a','b','c','d'].forEach((x,i)=>S.kd.push({id:'k'+x,date:fut(i+2),title:'截止'+x,type:'exam'}));
 S.kd.push({id:'kp',date:'2026-09-01',title:'過期',type:'other'});
 W.eval('renderAll()');

 // ① 無計數
 t('Reading 無總篇數',()=>!D.getElementById('paperCount').textContent.match(/\d+\s*篇/));
 t('Reading 分組無計數',()=>{const h=D.getElementById('paperList').innerHTML;
   const heads=[...D.querySelectorAll('#paperList .sec-head')];
   return heads.every(x=>!x.querySelector('.pill'))});
 t('Questions 分組無計數',()=>[...D.querySelectorAll('#qList .sec-head')].every(x=>!x.querySelector('.pill')));
 t('Notes 分組無計數',()=>[...D.querySelectorAll('#ntList .sec-head')].every(x=>!x.querySelector('.pill')));
 t('KEY DATES 分組無計數',()=>[...D.querySelectorAll('.kdgroup')].every(x=>!x.querySelector('.pill')));
 t('Review 無統計文字',()=>D.getElementById('cardTotals').textContent==='');
 t('Meeting 卡片無進度 pill',()=>{const it=D.querySelector('#mtList .item');
   return !it.innerHTML.includes('mtProgress')&&!/\d+\/\d+/.test(it.querySelector('.row').textContent)});

 // ② blockhead
 t('blockhead 有淺底色',()=>src.includes('.blockhead{')&&src.includes('background:var(--ac-soft)'));
 t('blockhead 無前置色條',()=>!src.includes('.blockhead::before'));
 t('blockhead 變矮',()=>src.includes('padding:1px 10px'));
 t('blockhead 無備註',()=>!src.includes('bd2'));

 // ③ 收合不顯示內容
 t('Notes 收合是一行式列',()=>{const it=D.querySelector('#ntList .rsvrow');
   return !!it&&!it.textContent.includes('內容0')
     &&/^\d{1,2}\/\d{2}$/.test(it.querySelector('.rdt').textContent)});
 t('Notes 收合無附件標籤',()=>!D.querySelector('#ntList .rsvrow').innerHTML.includes('🔗'));
 t('Notes 展開才顯示附件',()=>{W.eval("openNt.add('n0')");W.eval('renderNt()');
   const it=D.querySelector('[data-ntcard="n0"]');
   return it.innerHTML.includes('🔗')&&it.textContent.includes('連結0')});
 t('Meeting 收合無摘要',()=>{const it=D.querySelector('#mtList .item');
   return !it.textContent.includes('重點')});
 t('Meeting 收合無附件標籤',()=>{const it=D.querySelector('#mtList .item');
   return !it.innerHTML.includes('🔗')});
 t('Meeting 展開顯示附件+內容',()=>{W.eval("openM.add('m1')");W.eval('renderMT()');
   const it=D.querySelector('[data-mcard="m1"]');
   return it.textContent.includes('簡報')&&it.innerHTML.includes('<strong>重點</strong>')});

 // ④ 展開按鈕
 t('箭頭樣式已定義',()=>src.includes('.kx{')&&src.includes('.kdgroup .kx{order:2}'));
 t('Reading 展開鈕在標題同排',()=>{const b=D.querySelector('[data-pgrp]');
   return !!b&&!!b.querySelector('svg')&&b.parentElement.classList.contains('kdgroup')});
 t('Questions 展開鈕是箭頭',()=>{const b=D.querySelector('[data-qgrp]');
   return !!b&&!!b.querySelector('svg')});
 t('Resolved 展開鈕是箭頭',()=>{const b=D.querySelector('[data-qgrp="__done"]');
   return !!b&&!!b.querySelector('svg')&&b.parentElement.classList.contains('kdgroup')});
 t('Notes 改用左側目錄',()=>!D.querySelector('[data-ngrp]')
   &&D.querySelectorAll('#ntList .dirnav .dnav').length>=1);
 t('KEY DATES 展開鈕是箭頭',()=>{const b=D.querySelector('[data-kgrp]');
   return !!b&&!!b.querySelector('svg')&&b.parentElement.classList.contains('kdgroup')});
 t('已過期鈕是箭頭',()=>{const b=D.getElementById('togglePast');
   return !!b&&!!b.querySelector('svg')&&b.classList.contains('pastbtn')});
 t('按鈕有 title 提示',()=>{const b=D.querySelector('[data-pgrp]');
   return b.title.includes('展開')});
 t('點箭頭會展開',()=>{D.querySelector('[data-pgrp]').click();
   const b=D.querySelector('[data-pgrp]');
   return !!b.querySelector('svg')&&b.getAttribute('aria-expanded')==='true'});
 t('KEY DATES 箭頭可展開',()=>{D.querySelector('[data-kgrp]').click();
   return D.getElementById('kdList').textContent.includes('截止c')});
 t('已過期箭頭可展開且不分類',()=>{D.getElementById('togglePast').click();
   const h=D.getElementById('kdPastList');
   return h.textContent.includes('過期')&&!h.querySelector('.kdgroup')});

 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n--\n'));
 dom.window.close();
},1500);
