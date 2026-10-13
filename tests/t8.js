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

 // ④ 空狀態架構
 t('Questions 無資料仍有 Resolved 區',()=>{W.eval('renderQ()');
   return D.getElementById('qList').textContent.includes('Resolved')
     &&D.querySelectorAll('#qList .kdgroup').length===1});
 t('Notes 無資料顯示空狀態',()=>{W.eval('renderNt()');
   return D.getElementById('ntList').textContent.includes('—')
     &&!D.querySelector('#ntList .dirnav')});
 t('未解決問題不再分類',()=>!D.querySelector('#qList [data-qgrp="mine"]'));
 t('空分組顯示 —',()=>D.getElementById('qList').textContent.includes('—'));

 // 塞資料
 for(let i=0;i<5;i++)S.papers.push({id:'p'+i,created:Date.now()-i,title:'Paper'+i,authors:'A',
   tags:[],note:'',cat:'teacher',q:'**重點**',cite:'APA'});
 for(let i=0;i<4;i++)S.qs.push({id:'q'+i,created:Date.now()-i,kind:i<3?'mine':'study',q:'問'+i,a:'答',done:false,links:[]});
 S.qs.push({id:'qd',created:Date.now(),kind:'mine',q:'已解決',a:'',done:true,links:[]});
 for(let i=0;i<4;i++)S.notes.push({id:'n'+i,created:Date.now()-i,mtime:Date.now()-i,title:'N'+i,body:'x',kind:'mine',links:[]});
 S.mt.push({id:'m1',created:Date.now(),mtime:Date.now(),date:'2026-09-24',title:'會議',topics:'重點',full:'',actions:[],linksL:[]});
 S.dirs.push({id:'d1',created:Date.now(),mtime:Date.now(),title:'方向',status:'todo',log:[],links:[]});
 S.cards.push({id:'c1',created:Date.now(),q:'題',a:'答',theme:-1,links:[],level:0,due:Date.now(),n:0});
 const fut=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
 ['a','b','c','d'].forEach((x,i)=>S.kd.push({id:'k'+x,date:fut(i+2),title:'截止'+x,type:'deadline'}));
 S.kd.push({id:'kp',date:'2026-09-20',title:'過期',type:'other'});
 W.eval('renderAll()');

 // ② Reading 點標題收合
 t('點 ✎ 展開',()=>{D.querySelector('[data-pedit]').click();
   return D.querySelectorAll('#paperList .editbox').length===1});
 t('點標題可收合',()=>{D.querySelector('[data-ptitle]').click();
   return D.querySelectorAll('#paperList .editbox').length===0});
 t('點標題可再展開',()=>{D.querySelector('[data-ptitle]').click();
   return D.querySelectorAll('#paperList .editbox').length===1});
 t('收合時同時退出編輯',()=>{D.querySelector('[data-pedit]').click();
   const wasEdit=D.getElementById('paperList').innerHTML.includes('<textarea');
   D.querySelector('[data-ptitle]').click();
   return wasEdit&&!W.eval('editP').has('p0')&&!W.eval('openP').has('p0')});

 // ③ seg
 t('seg.sm 更小',()=>src.includes('.seg.sm button{padding:0 6px;font-size:9.5px;height:17px'));
 t('blockhead 內 seg 18px',()=>src.includes('.blockhead .seg{height:17px'));

 // ⑤ 已過期置中
 t('已過期按鈕置中',()=>{const r=D.getElementById('kdPastRow');
   return r.querySelector('.pastrow')&&src.includes('.pastrow{display:flex;justify-content:center')});
 t('已過期有雙箭號',()=>!!D.querySelector('#togglePast svg'));
 t('已過期可展開',()=>{D.getElementById('togglePast').click();
   return D.getElementById('kdPastList').textContent.includes('過期')});

 // ⑥ Calendar 底色
 t('KEY DATES 有 blockhead',()=>{const p=D.getElementById('p-calendar');
   return [...p.querySelectorAll('.blockhead')].some(x=>x.textContent.includes('KEY DATES'))});
 t('TIMETABLE 有 blockhead',()=>{const p=D.getElementById('p-calendar');
   return [...p.querySelectorAll('.blockhead')].some(x=>x.textContent.includes('TIMETABLE'))});
 t('KEY DATES ＋ 已縮小',()=>{const b=D.getElementById('toggleKD');
   return b.classList.contains('iconb')&&!!b.closest('.blockhead')});

 // ⑦ 按鈕間距
 t('.cxg 已定義',()=>src.includes('.cxg{display:inline-flex;align-items:center;gap:0'));
 t('七處卡片按鈕都包在 .cxg',()=>{
   const sel=['#paperList','#qList','#ntList','#mtList','#dirList','#kdList','#cardList'];
   return sel.every(s=>{const el=D.querySelector(s);
     if(!el||!el.querySelector('.cx'))return true;
     return [...el.querySelectorAll('.cx')].filter(b=>!b.dataset.pstar).every(b=>!!b.closest('.cxg'))})});

 // ⑧ 死碼清除
 t('sec-head 已移除',()=>!src.includes('.sec-head{')&&!src.includes('class="sec-head"'));
 t('.sx 已移除',()=>!src.includes('.sx{')&&!src.includes('class="sx"'));
 t('mtProgress 已移除',()=>!src.includes('function mtProgress'));
 t('未用 CSS 已清',()=>!src.includes('.twobox{')&&!src.includes('.cite{')&&!src.includes('.acts{'));

 // ⑧ Settings 重寫
 t('Settings 用一條線式標題',()=>D.getElementById('p-settings').querySelectorAll('.setg').length===5);
 t('Settings 所有控制項還在',()=>['gh-owner','gh-repo','gh-token','gh-auto','ghPullBtn','ghPushBtn','ghSave',
   'impBtn','impRepBtn','expBtn','bakNow','bakList','gcUrl','gc-id','gc-key','gcFetch','saveGC','clearGC',
   'trashList','helpBox','expWarn','expInfo','ghState','gcState'].every(id=>!!D.getElementById(id)));
 t('設定區可展開',()=>{const b=D.querySelector('[data-setg="sync"]');b.click();
   return D.getElementById('sg-sync').style.display===''});
 t('ⓘ 提示可展開',()=>{const q=D.querySelector('[data-tip="tipGh"]');q.click();
   const on=D.getElementById('tipGh').classList.contains('on')
     &&D.getElementById('tipGh').textContent.includes('Fine-grained');
   q.click();return on&&!D.getElementById('tipGh').classList.contains('on')});
 t('HELP 有內容',()=>D.getElementById('helpBox').innerHTML.length>3000);

 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n--\n'));
 dom.window.close();
},1500);
