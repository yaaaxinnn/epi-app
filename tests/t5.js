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

 for(let i=0;i<6;i++)S.papers.push({id:'p'+i,created:Date.now()-i,title:'Paper'+i,authors:'A',tags:[],note:'',cat:'teacher'});
 for(let i=0;i<5;i++)S.qs.push({id:'q'+i,created:Date.now()-i,kind:'mine',q:'問'+i,a:'答'+i,done:i===4,links:[]});
 for(let i=0;i<5;i++)S.notes.push({id:'n'+i,created:Date.now()-i,mtime:Date.now()-i,title:'筆記'+i,body:'內容',kind:'mine',links:[]});
 const fut=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
 ['a','b','c','d'].forEach((x,i)=>S.kd.push({id:'k'+x,date:fut(i+2),title:'截止'+x,type:'deadline'}));
 S.kd.push({id:'ke',date:fut(3),title:'考試',type:'exam'});
 S.kd.push({id:'kp1',date:'2026-09-20',title:'過期A',type:'deadline'});
 S.kd.push({id:'kp2',date:'2026-09-18',title:'過期B',type:'exam'});
 W.eval('renderAll()');

 // ③ 分頁順序
 t('分頁順序正確',()=>{const o=[...D.querySelectorAll('.tab')].map(x=>x.textContent.trim());
   return JSON.stringify(o)===JSON.stringify(['Reading','Meeting','Notes','Library','Calendar','Textbooks','Review','Settings'])});
 t('全分頁可切換',()=>{let ok=true;
   D.querySelectorAll('.tab').forEach(tb=>{tb.click();
     const p=D.getElementById('p-'+tb.dataset.p);if(!p||!p.classList.contains('on'))ok=false});
   D.querySelector('.tab').click();return ok});

 // ① 箭頭在標題同排
 t('已移除獨立 exp 區塊',()=>!src.includes('class="exp"')&&!src.includes('.exp button{'));
 t('Reading 箭頭在 kdgroup 內',()=>{const b=D.querySelector('#paperList [data-pgrp]');
   return !!b&&b.classList.contains('kx')&&b.parentElement.classList.contains('kdgroup')});
 t('Questions 箭頭在標題內',()=>{const b=D.querySelector('#qList [data-qgrp]');
   return !!b&&b.parentElement.classList.contains('kdgroup')});
 t('Resolved 箭頭在標題內',()=>{const b=D.querySelector('[data-qgrp="__done"]');
   return !!b&&b.parentElement.classList.contains('kdgroup')});
 t('Notes 目錄在左側欄內',()=>{const b=D.querySelector('#ntList [data-ntsel]');
   return !!b&&b.parentElement.classList.contains('dirnav')});
 t('KEY DATES 箭頭在 kdgroup 內',()=>{const b=D.querySelector('#kdList [data-kgrp]');
   return !!b&&b.classList.contains('kx')&&b.parentElement.classList.contains('kdgroup')});
 t('箭頭靠右對齊',()=>src.includes('.kx{margin-left:auto')&&src.includes('.kdgroup .kx{order:2}'));
 t('Reading 箭頭可展開',()=>{const b=D.querySelector('#paperList [data-pgrp]');b.click();
   return D.querySelector('#paperList [data-pgrp]').getAttribute('aria-expanded')==='true'});
 t('KEY DATES 箭頭可展開',()=>{D.querySelector('#kdList [data-kgrp]').click();
   return D.getElementById('kdList').textContent.includes('截止c')});
 t('無資料的類別不顯示箭頭',()=>{const gs=[...D.querySelectorAll('#kdList .kdgroup')];
   const exam=gs.find(g=>g.textContent.includes('Exam'));
   return !!exam&&!exam.querySelector('.kx')});

 // ① 已過期不分類
 t('已過期標題不分類',()=>{D.getElementById('togglePast').click();
   const h=D.getElementById('kdPastList');
   return !h.querySelector('.kdgroup')&&h.textContent.includes('過期A')&&h.textContent.includes('過期B')});
 t('已過期按鈕置中',()=>{const b=D.getElementById('togglePast');
   return b.classList.contains('pastbtn')&&b.parentElement.classList.contains('pastrow')});

 // ② 樣式
 t('seg 按鈕變矮',()=>src.includes('.seg button{background:transparent;border:0;padding:3px 9px;font-size:11.5px'));
 t('seg.sm 更窄',()=>src.includes('.seg.sm button{padding:0 6px;font-size:9.5px;height:17px'));
 t('blockhead 變矮',()=>src.includes('.blockhead{')&&src.includes('padding:1px 10px'));
 t('blockhead 底色加深',()=>src.includes('color-mix(in srgb,var(--ac) 14%,var(--surface))'));
 t('blockhead 無前置色條',()=>!src.includes('.blockhead::before'));

 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n--\n'));
 dom.window.close();
},1500);
