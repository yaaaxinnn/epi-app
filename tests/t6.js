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

 for(let i=0;i<6;i++)S.papers.push({id:'p'+i,created:Date.now()-i,title:'P'+i,authors:'A',tags:[],note:'',cat:'teacher'});
 for(let i=0;i<5;i++)S.qs.push({id:'q'+i,created:Date.now()-i,kind:'mine',q:'問'+i,a:'答',done:i===4,links:[]});
 for(let i=0;i<5;i++)S.notes.push({id:'n'+i,created:Date.now()-i,mtime:Date.now()-i,title:'N'+i,body:'x',kind:'mine',links:[]});
 const fut=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
 ['a','b','c','d'].forEach((x,i)=>S.kd.push({id:'k'+x,date:fut(i+2),title:'截止'+x,type:'deadline'}));
 S.kd.push({id:'kp',date:'2026-09-20',title:'過期A',type:'deadline'});
 W.eval('renderAll()');

 // ③ chevron
 t('CHEV 是雙層 SVG',()=>src.includes("const CHEV=")&&src.includes('<path d="M6 5L12 11L18 5"/><path d="M6 12L12 18L18 12"/>'));
 t('已無三角字元箭頭',()=>!/\$\{(op|open|showPast)\?'▲':'▼'\}/.test(src));
 t('Reading 箭頭是 SVG',()=>{const b=D.querySelector('#paperList [data-pgrp]');
   return !!b&&!!b.querySelector('svg')&&b.textContent.trim()===''});
 t('Questions 箭頭是 SVG',()=>!!D.querySelector('#qList [data-qgrp] svg'));
 t('Notes 目錄有「全部」項',()=>{const b=D.querySelector('#ntList [data-ntsel=""]');
   return !!b&&b.querySelector('.nm').textContent==='全部'});
 t('KEY DATES 箭頭是 SVG',()=>!!D.querySelector('#kdList [data-kgrp] svg'));
 t('展開用旋轉呈現',()=>src.includes('[aria-expanded="true"] svg{transform:rotate(180deg)}'));
 t('點擊可展開',()=>{const b=D.querySelector('#kdList [data-kgrp]');b.click();
   return D.getElementById('kdList').textContent.includes('截止c')
     &&D.querySelector('#kdList [data-kgrp]').getAttribute('aria-expanded')==='true'});

 // ③ KEY DATES 箭頭在最右
 t('kdgroup 箭頭排在分隔線之後',()=>src.includes('.kdgroup .kx{order:2}')&&src.includes('.kdgroup::after{order:1}'));
 t('已過期箭頭同樣式',()=>{const b=D.getElementById('togglePast');
   return !!b&&!!b.querySelector('svg')&&b.classList.contains('pastbtn')});

 // ①② blockhead
 t('blockhead 更扁',()=>src.includes('padding:1px 10px'));
 t('blockhead 底色更深',()=>src.includes('color-mix(in srgb,var(--ac) 14%,var(--surface))'));
 t('blockhead 字級縮小',()=>src.includes('.blockhead .bt{font-size:11.5px'));
 t('＋ 按鈕縮小',()=>src.includes('.blockhead .iconb{padding:0 6px;font-size:14px'));
 t('四個區塊 ＋ 都在 blockhead 內',()=>{
   return ['addQBtn','addNtBtn','addMTBtn','addDIRBtn'].every(id=>{
     const b=D.getElementById(id);return b&&b.closest('.blockhead')})});
 t('Notes 兩個區塊標題存在',()=>D.getElementById('p-courses').querySelectorAll('.blockhead').length===2);
 t('Meeting 三個區塊標題存在',()=>D.getElementById('p-ideas').querySelectorAll('.blockhead').length===3);

 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n--\n'));
 dom.window.close();
},1500);
