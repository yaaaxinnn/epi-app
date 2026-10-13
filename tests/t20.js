const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const fire=(el,t)=>el.dispatchEvent(new W.Event(t,{bubbles:true}));
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const now=Date.now();

 S.mt.push({id:'m1',created:now,mtime:now,date:'2026-09-20',title:'會議一',topics:'重點',
   actions:[{text:'跑 target trial',done:false},{text:'寫 SAP',done:false},{text:'已做完的事',done:true}],linksL:[]});
 S.mt.push({id:'m2',created:now-1,mtime:now-1,date:'2026-08-18',title:'會議二',topics:'重點二',
   actions:[{text:'找 NHIRD 申請流程',done:false},{text:'另一件完成的',done:true}],linksL:[]});
 W.eval('renderAll()');
 const edit=id=>{W.eval(`openM.clear();editM.clear();openM.add('${id}');editM.add('${id}');renderMT()`)};

 // ① Action items 可編輯
 edit('m1');
 t('編輯模式用輸入框而不是純文字',()=>{
   const ins=[...D.querySelectorAll('#mtList [data-mactf]')];
   return ins.length===3&&ins.every(i=>i.tagName==='INPUT'&&i.type==='text')
     &&ins[0].value==='跑 target trial'});
 t('編輯模式的列是 div 不是 label（點字不會誤打勾）',()=>{
   const row=D.querySelector('#mtList [data-mactf]').closest('.chk');
   return row.tagName==='DIV'&&!row.closest('label')});
 t('改字會寫進資料',()=>{
   const i=D.querySelector('[data-mactf="m1|0"]');
   i.value='跑 target trial emulation';fire(i,'input');
   return S.mt.find(m=>m.id==='m1').actions[0].text==='跑 target trial emulation'});
 t('改字會同步更新 TO-DO',()=>
   D.getElementById('mtTodo').textContent.includes('跑 target trial emulation'));
 t('已完成項目的輸入框有刪除線',()=>
   D.querySelector('[data-mactf="m1|2"]').getAttribute('style').includes('line-through'));
 t('勾選框仍可用',()=>{
   const cb=D.querySelector('[data-mact="m1|1"]');cb.checked=true;fire(cb,'change');
   return S.mt.find(m=>m.id==='m1').actions[1].done===true});
 t('刪除鈕仍在',()=>!!D.querySelector('[data-mdel-act="m1|0"]'));
 t('新增一項仍可用',()=>{
   const n0=S.mt.find(m=>m.id==='m1').actions.length;
   const i=D.querySelector('[data-mnew-act="m1"]');i.value='新待辦';
   i.dispatchEvent(new W.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
   return S.mt.find(m=>m.id==='m1').actions.length===n0+1});
 t('輸入框有自己的樣式',()=>src.includes('.chk .actin{flex:1;min-width:0')
   &&src.includes('.chk .actin:focus{outline:none'));

 // ② TO-DO 已完成折疊
 W.eval("openM.clear();editM.clear();S.mt.find(m=>m.id==='m1').actions[1].done=false;S.mt.find(m=>m.id==='m1').actions.pop();renderMT()");
 const td=()=>D.getElementById('mtTodo');
 t('未完成的列在上面',()=>{
   const txt=[...td().querySelectorAll('.card .chk span:first-of-type')].map(x=>x.textContent);
   return txt.length===3&&txt.some(x=>x.includes('SAP'))&&!txt.some(x=>x.includes('已做完的事'))});
 t('下方有「已完成」收合鈕',()=>{
   const b=D.getElementById('tdMore');
   return !!b&&b.textContent.trim()==='已完成'&&b.getAttribute('aria-expanded')==='false'
     &&!!b.querySelector('svg')&&b.parentElement.className==='pastrow'});
 t('預設不顯示已完成的項目',()=>!td().textContent.includes('已做完的事'));
 t('點開可看到已完成',()=>{
   D.getElementById('tdMore').click();
   return td().textContent.includes('已做完的事')&&td().textContent.includes('另一件完成的')
     &&D.getElementById('tdMore').getAttribute('aria-expanded')==='true'});
 t('已完成項目打勾且有刪除線',()=>{
   const done=[...td().querySelectorAll('.chk')].filter(x=>x.textContent.includes('已做完的事'))[0];
   return done.querySelector('input').checked===true
     &&done.querySelector('span').getAttribute('style').includes('line-through')});
 t('取消打勾會回到未完成',()=>{
   const cb=[...td().querySelectorAll('[data-tdact]')].find(x=>x.closest('.chk').textContent.includes('已做完的事'));
   cb.checked=false;fire(cb,'change');
   const m=S.mt.find(x=>x.id==='m1');
   return m.actions.find(a=>a.text==='已做完的事').done===false});
 t('再點一次收合',()=>{
   W.eval('renderMTTodo()');
   D.getElementById('tdMore').click();
   return !D.getElementById('mtTodo').textContent.includes('另一件完成的')});
 t('全部完成時仍顯示 🎉 與收合鈕',()=>{
   S.mt.forEach(m=>(m.actions||[]).forEach(a=>a.done=true));
   W.eval('renderMTTodo()');
   return td().textContent.includes('🎉')&&!!D.getElementById('tdMore')});
 t('沒有任何 action 時不出現收合鈕',()=>{
   S.mt.forEach(m=>m.actions=[]);W.eval('renderMTTodo()');
   return td().textContent.includes('🎉')&&!D.getElementById('tdMore')});

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
