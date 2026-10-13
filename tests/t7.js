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

 for(let i=0;i<5;i++)S.papers.push({id:'p'+i,created:Date.now()-i,title:'Paper'+i,authors:'A',
   tags:[],note:'',cat:'teacher',q:'## 研究問題\n**重點**在這',design:'- Cohort\n- 2020-2024',cite:'APA引文'});
 for(let i=0;i<5;i++)S.qs.push({id:'q'+i,created:Date.now()-i,kind:'mine',q:'問'+i,a:'答',done:i===4,links:[]});
 for(let i=0;i<5;i++)S.notes.push({id:'n'+i,created:Date.now()-i,mtime:Date.now()-i,title:'N'+i,body:'x',kind:'mine',links:[]});
 S.mt.push({id:'m1',created:Date.now(),mtime:Date.now(),date:'2026-09-24',title:'會議',topics:'重點',full:'',actions:[],linksL:[]});
 S.dirs.push({id:'d1',created:Date.now(),mtime:Date.now(),title:'方向',status:'todo',log:[],links:[]});
 const fut=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
 ['a','b','c','d'].forEach((x,i)=>S.kd.push({id:'k'+x,date:fut(i+2),title:'截止'+x,type:'deadline'}));
 W.eval('renderAll()');

 // ①③ Reading 分類標題
 t('Reading 分類用 kdgroup 樣式',()=>{const g=D.querySelector('#paperList .kdgroup');
   return !!g&&!D.querySelector('#paperList .sec-head')});
 t('分類名稱有 emoji',()=>{const g=D.getElementById('paperList').textContent;
   return g.includes('👨‍🏫 老師指定')&&src.includes("CATEMO={teacher:'👨‍🏫'")});
 t('分類箭頭是雙層 SVG',()=>{const b=D.querySelector('#paperList [data-pgrp]');
   return !!b&&b.classList.contains('kx')&&!!b.querySelector('svg')});
 t('每類最多 3 篇',()=>{const items=D.querySelectorAll('#paperList .item');return items.length===3});
 t('箭頭可展開第 4、5 篇',()=>{D.querySelector('#paperList [data-pgrp]').click();
   return D.querySelectorAll('#paperList .item').length===5});
 t('分類名稱由 S.cats 提供、標題帶 emoji',()=>['老師指定','課程','探索','發表']
   .every(x=>S.cats.some(c=>c.name===x))
   &&D.getElementById('paperList').textContent.includes('👨‍🏫 老師指定'));

 // ③ Reading 閱讀/編輯模式
 t('收合時無輸入框',()=>!D.getElementById('paperList').innerHTML.includes('<textarea'));
 t('展開是閱讀模式',()=>{D.querySelector('[data-pedit]').click();
   const h=D.getElementById('paperList').innerHTML;
   return h.includes('<strong>重點</strong>')&&!h.includes('<textarea')});
 t('閱讀模式顯示欄位標題',()=>D.getElementById('paperList').textContent.includes('研究問題/目標'));
 t('閱讀模式渲染清單',()=>D.getElementById('paperList').innerHTML.includes('<li>Cohort</li>'));
 t('空欄位不顯示',()=>!D.getElementById('paperList').textContent.includes('Gap'));
 t('再按 ✎ 進編輯模式',()=>{D.querySelector('[data-pedit]').click();
   return D.getElementById('paperList').innerHTML.includes('<textarea')});
 t('編輯鈕顯示 ✓',()=>D.querySelector('[data-pedit]').textContent.trim()==='✓');
 t('按 ✓ 回閱讀模式',()=>{D.querySelector('[data-pedit]').click();
   return !D.getElementById('paperList').innerHTML.includes('<textarea')});

 // ② seg
 t('seg 更扁',()=>src.includes('.seg button{background:transparent;border:0;padding:3px 9px;font-size:11.5px'));
 t('seg.sm 固定 18px',()=>src.includes('.seg.sm button{padding:0 6px;font-size:9.5px;height:17px'));

 // ④ 按鈕統一
 t('已無零散尺寸的 .x 卡片鈕',()=>{
   return !src.includes("font-size:11px;padding:0 3px")&&!src.match(/class="x"[^>]*data-(pedit|qedit|ntedit|medit|cedit|ed-kd)/)});
 t('.cx 樣式已定義',()=>src.includes('.cx{background:none;border:0;color:var(--faint);font-size:12px'));
 t('各分頁卡片鈕都用 .cx',()=>{
   const sel=['#paperList','#qList','#ntList','#mtList','#dirList','#kdList','#cardList'];
   return sel.every(s=>{const el=D.querySelector(s);if(!el||!el.querySelector('.item,.kd'))return true;
     return !el.querySelector('button.x')})});
 t('Meeting ✕ 已縮小',()=>{const b=D.querySelector('#mtList [data-hold^="mt|"]');
   return !!b&&b.classList.contains('cx')});
 t('Directions ✕ 已縮小',()=>{const b=D.querySelector('#dirList [data-hold^="dir|"]');
   return !!b&&b.classList.contains('cx')});
 t('KEY DATES ✎✕ 已縮小',()=>{const e=D.querySelector('#kdList [data-ed-kd]');
   return !!e&&e.classList.contains('cx')});

 // ⑤ blockhead 等高
 t('blockhead 有 min-height',()=>src.includes('.blockhead{min-height:22px}'));
 t('blockhead 內控制項固定高',()=>src.includes('.blockhead .iconb{')&&src.includes('height:18px')
   &&src.includes('.blockhead .seg{height:17px'));
 t('blockhead 遍布各分頁',()=>D.querySelectorAll('.blockhead').length>=8);

 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 if(errs.length)console.log('\nERRORS:\n'+errs.slice(0,3).join('\n--\n'));
 dom.window.close();
},1500);
