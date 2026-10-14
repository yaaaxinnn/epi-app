// 筆記頁模板（templates/notebook.html）實機測試：目錄拖曳、手機長按選單、移到…與位置、摘要、seed.moves
const {chromium}=require('playwright');const fs=require('fs');
const TPL=fs.readFileSync(process.env.TPL||'/home/claude/epi-app/templates/notebook.html','utf8');
const OUT=process.env.OUT||'/tmp/claude-0/-home-claude/d1fb5984-118a-5eb3-864f-3695fb43e27f/scratchpad/shots13/';fs.mkdirSync(OUT,{recursive:true});
const NM='/home/claude/node_modules/';
const LIB={'marked.min.js':NM+'marked/marked.min.js','purify.min.js':NM+'dompurify/dist/purify.min.js','katex.min.js':NM+'katex/dist/katex.min.js','katex.min.css':NM+'katex/dist/katex.min.css'};
const PAGES={};const bad=[];const ok=(c,m)=>{if(!c){bad.push(m);console.log('✗',m)}else console.log('✓',m)};
const j=o=>JSON.stringify(o).replace(/</g,'\\u003c');
function build(name,db,seed){PAGES[name]=TPL.replace(/(<script id="nb-config" type="application\/json">)[\s\S]*?(<\/script>)/,(m,a,b)=>a+j({db,title:'測試'})+b)
  .replace(/(<script id="nb-seed" type="application\/json">)[\s\S]*?(<\/script>)/,(m,a,b)=>a+j(seed)+b)}
const node=(t,kids,o)=>Object.assign({title:t,body:'',kids:kids||[]},o||{});
async function ctxFor(b,opt){
  const ctx=await b.newContext(Object.assign({viewport:{width:1200,height:860}},opt||{}));
  await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net/,r=>{const k=Object.keys(LIB).find(k=>r.request().url().endsWith(k));return k?r.fulfill({path:LIB[k],contentType:k.endsWith('.css')?'text/css':'application/javascript'}):r.abort()});
  await ctx.route('http://nb.test/**',r=>{const n=r.request().url().split('/').pop().split('#')[0];return PAGES[n]?r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:PAGES[n]}):r.fulfill({status:404,body:''})});
  return ctx;
}
async function open(ctx,name,errs){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://nb.test/'+name);await p.waitForTimeout(500);return p}
const kids=(p,id)=>p.evaluate(id=>(id?doc.nodes[id].kids:doc.kids).join(','),id);
async function drag(p,from,to,zone){
  const s=p.locator(`.tn[data-tn="${from}"]`),t=p.locator(`.tn[data-tn="${to}"]`);const bx=await t.boundingBox();
  await s.dragTo(t,{targetPosition:{x:Math.min(60,bx.width/2),y:zone==='before'?3:zone==='after'?bx.height-3:bx.height/2}});await p.waitForTimeout(250);
}
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  // ===== 1. 電腦：目錄拖曳、⋯ 選單、移到…、✎ 位置 =====
  const S1={title:'測試',kids:['g1','g2','e'],nodes:{g1:node('分組一',['a','b','c']),g2:node('分組二',['d']),a:node('A'),b:node('B'),c:node('C'),d:node('D'),e:node('E')}};
  build('t1.html','nbt-1',S1);
  let errs=[];let ctx=await ctxFor(b);let p=await open(ctx,'t1.html',errs);
  ok(await p.$eval('.tn[data-tn="g1"]',e=>e.getAttribute('draggable')==='true'),'電腦：目錄的列可以拖');
  await p.click('[data-tg="g1"]');await p.click('[data-tg="g2"]');await p.waitForTimeout(150);
  await drag(p,'c','a','before');ok(await kids(p,'g1')==='c,a,b','拖到 A 的上半：放到 A 前面 → '+await kids(p,'g1'));
  await drag(p,'e','g2','into');ok(await kids(p,'g2')==='d,e'&&await kids(p,null)==='g1,g2','拖到分組二中間：放進它底下最後面 → '+await kids(p,'g2'));
  ok(await p.evaluate(()=>!('e' in doc.seedAt)&&('a' in doc.seedAt)),'換了上層的卡片清掉模板放置紀錄，同層調順序不清');
  await drag(p,'g1','a','into');ok(await kids(p,null)==='g1,g2'&&await kids(p,'g1')==='c,a,b','不能拖進自己底下');
  await drag(p,'d','g1','after');ok(await kids(p,null)==='g1,d,g2','拖到分組一下半：放到它後面（同一層） → '+await kids(p,null));
  await drag(p,'b','','into');ok((await kids(p,null)).endsWith(',b'),'拖到「首頁」：放到最上層最後面');
  await p.screenshot({path:OUT+'1_desk_tree.png'});
  await p.hover('.tn[data-tn="d"]');await p.click('.tn[data-tn="d"] [data-tmenu]');await p.waitForTimeout(150);
  ok(await p.$eval('#tmenu',e=>e.classList.contains('on')&&e.textContent.includes('↑ 上移')&&e.textContent.includes('移到…')),'⋯ 打開小選單');
  await p.screenshot({path:OUT+'2_desk_menu.png'});
  await p.click('#tmenu [data-tm="up"]');await p.waitForTimeout(150);ok(await kids(p,null)==='d,g1,g2,b','選單 ↑ 上移，選單還開著可以連按 → '+await kids(p,null));
  ok(await p.$eval('#tmenu',e=>e.classList.contains('on')),'上移後選單還在');
  await p.click('#tmenu [data-tm="to"]');await p.waitForTimeout(150);
  ok(await p.$eval('#mvdlg',e=>e.classList.contains('on')),'移到… 打開視窗');
  await p.selectOption('#mvParent','g1');await p.waitForTimeout(80);
  const opts=await p.$$eval('#mvPos option',a=>a.map(o=>o.textContent));
  ok(opts[0]==='最前面'&&opts.some(t=>t.includes('「A」後面'))&&opts[opts.length-1].includes('（最後面）'),'換上層後位置選項跟著換：'+opts.join('／'));
  await p.selectOption('#mvPos',{label:'在「C」後面'});
  await p.screenshot({path:OUT+'3_desk_movedlg.png'});
  await p.click('#mvOk');await p.waitForTimeout(200);ok(await kids(p,'g1')==='c,d,a'&&await kids(p,null)==='g1,g2,b','移到分組一、放在 C 後面 → '+await kids(p,'g1'));
  // ✎ 表單的位置
  await p.evaluate(()=>location.hash='#/c/a');await p.waitForTimeout(200);await p.click('[data-edit="a"]');await p.waitForTimeout(150);
  ok(await p.$eval('.form [data-f=pos]',e=>e.value)==='after:d','✎ 打開時位置預設是現在的位置');
  await p.selectOption('.form [data-f=pos]','first');await p.click('[data-save]');await p.waitForTimeout(200);
  ok(await kids(p,'g1')==='a,c,d','✎ 選「最前面」→ '+await kids(p,'g1'));
  await p.click('[data-edit="a"]');await p.waitForTimeout(150);await p.selectOption('.form [data-f=parent]','g2');await p.waitForTimeout(80);
  ok(await p.$eval('.form [data-f=pos]',e=>e.value)==='after:e','✎ 換上層時位置預設最後面');
  await p.selectOption('.form [data-f=pos]','first');await p.screenshot({path:OUT+'4_desk_form.png'});await p.click('[data-save]');await p.waitForTimeout(200);
  ok(await kids(p,'g2')==='a,e','✎ 換上層並放在最前面（不是一定排最後）→ '+await kids(p,'g2'));
  await p.reload();await p.waitForTimeout(500);ok(await kids(p,'g2')==='a,e'&&await kids(p,'g1')==='c,d'&&await kids(p,null)==='g1,g2,b','重新整理後順序還在');
  ok(errs.length===0,'電腦沒有錯誤 '+errs.join('|'));await ctx.close();

  // ===== 2. 手機：長按選單 =====
  errs=[];ctx=await ctxFor(b,{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  build('t2.html','nbt-2',S1);p=await open(ctx,'t2.html',errs);
  await p.click('#menuBtn');await p.waitForTimeout(250);await p.click('[data-tg="g1"]');await p.waitForTimeout(150);
  ok(await p.$eval('.tn[data-tn="a"]',e=>!e.hasAttribute('draggable')),'手機：列不設成拖曳（避免和長按衝突）');
  ok(await p.$eval('.tn[data-tn="a"] .tm',e=>getComputedStyle(e).display==='none'),'手機：不顯示 ⋯');
  const lp=async id=>{await p.evaluate(id=>{const el=document.querySelector('.tn[data-tn="'+id+'"] .tt'),r=el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:r.left+10,clientY:r.top+5}))},id);
    await p.waitForTimeout(650);
    await p.evaluate(id=>{const el=document.querySelector('.tn[data-tn="'+id+'"] .tt');el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}));el.click()},id);await p.waitForTimeout(150)};
  await lp('b');
  ok(await p.$eval('#tmenu',e=>e.classList.contains('on'))&&await p.evaluate(()=>location.hash)!=='#/c/b','長按 0.5 秒跳出選單，放開不會順便打開卡片');
  await p.screenshot({path:OUT+'5_phone_longpress.png'});
  await p.click('#tmenu [data-tm="down"]');await p.waitForTimeout(150);ok(await kids(p,'g1')==='a,c,b','手機 ↓ 下移 → '+await kids(p,'g1'));
  await p.click('#tmenu [data-tm="to"]');await p.waitForTimeout(150);await p.selectOption('#mvParent','');await p.selectOption('#mvPos','first');
  await p.screenshot({path:OUT+'6_phone_movedlg.png'});
  await p.click('#mvOk');await p.waitForTimeout(200);ok(await kids(p,null)==='b,g1,g2,e','手機 移到… 首頁最前面 → '+await kids(p,null));
  await p.evaluate(()=>{const el=document.querySelector('.tn[data-tn="a"] .tt');el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',clientX:5,clientY:5}))});
  await p.waitForTimeout(100);await p.evaluate(()=>{document.querySelector('.tn[data-tn="a"] .tt').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}));document.querySelector('.tn[data-tn="a"] .tt').click()});await p.waitForTimeout(200);
  ok(await p.evaluate(()=>location.hash)==='#/c/a'&&!await p.$eval('#tmenu',e=>e.classList.contains('on')),'短按還是打開卡片');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'手機沒有橫向捲動');
  ok(errs.length===0,'手機沒有錯誤 '+errs.join('|'));await ctx.close();

  // ===== 3. 摘要 =====
  const BODY='### NotebookLM 步驟2\n**時機**：開始讀之前\n\n````text\n請用繁體中文回答。\n輸出格式：\n- 整份回答放進一個 ```markdown 程式碼區塊裡，讓我可以完整複製原始碼。\n```markdown\n## 範例\n```\n````\n\n最後說明 $E(Y_1-Y_0\\mid z)=E(Y\\mid X=1,z)$ 怎麼來，$$\\sum_i x_i$$ 不要出現，還有 $\\alpha^2$。';
  build('t3.html','nbt-3',{title:'摘要',kids:['x'],nodes:{x:node('指令卡',[],{body:BODY,fold:true})}});
  errs=[];ctx=await ctxFor(b);p=await open(ctx,'t3.html',errs);
  const ex=await p.$eval('.grid .kc .kx2',e=>e.textContent);console.log('  摘要：',ex);
  ok(!ex.includes('markdown')&&!ex.includes('複製原始碼')&&!ex.includes('範例'),'巢狀程式碼區塊整段拿掉');
  ok(ex.includes('E(Y₁-Y₀ ∣ z)=E(Y ∣ X=1,z)')&&ex.includes('α²')&&!ex.includes('$')&&!ex.includes('Σ'),'行內公式轉成文字、獨立公式拿掉');
  await p.evaluate(()=>location.hash='#/c/x');await p.waitForTimeout(250);
  const bar=await p.$eval('.fold .fbar',e=>e.textContent);ok(bar.includes('📋 1')&&!bar.includes('複製原始碼'),'收起來那一行也一樣、可複製區塊算 1 個：'+bar.slice(0,60));
  await p.click('.fold .fbar');await p.waitForTimeout(200);
  ok(await p.$$eval('.fold .md pre',a=>a.length)===1&&await p.$eval('.fold .md pre code',e=>e.textContent.includes('```markdown')),'展開後指令區塊完整（含裡面的 ```markdown）');
  ok(errs.length===0,'摘要頁沒有錯誤 '+errs.join('|'));await ctx.close();

  // ===== 4. seed.moves =====
  errs=[];ctx=await ctxFor(b);
  const V1={title:'搬移',kids:['a','b','c','d','x','g'],nodes:{a:node('A'),b:node('B'),c:node('C'),d:node('D'),x:node('X'),g:node('分組',['k']),k:node('K')}};
  build('m1.html','nbt-m',V1);p=await open(ctx,'m1.html',errs);
  ok(await p.evaluate(()=>doc.seedAt.a===''&&doc.seedAt.k==='g'),'第一次打開：記下每張卡片被模板放在哪');
  await p.evaluate(()=>{moveTo('b','x','last');delete doc.seedAt.c;persist()});await p.waitForTimeout(200);
  await p.close();
  const V2=JSON.parse(JSON.stringify(V1));V2.kids=['g','x'];V2.nodes.g.kids=['a','k','b','c','d'];
  V2.moves={a:'g',b:'g',c:{to:'g',from:''},d:{to:'g',from:'x'},e:'g',k:'zz'};
  build('m2.html','nbt-m',V2);p=await open(ctx,'m2.html',errs);
  ok(await kids(p,'g')==='a,k,c','moves：模板放的卡片照新順序搬進分組（a 在 k 前面、c 用 from 對上）→ '+await kids(p,'g'));
  ok(await kids(p,'x')==='b','使用者自己搬過的 b 不動');
  ok(await kids(p,null)==='d,x,g','from 對不上的 d 不動 → '+await kids(p,null));
  const md=await p.evaluate(()=>doc.movesDone.slice().sort().join(','));
  ok(md==='a>g,b>g,c>g,d>g','做過或確定不做的都記下來；卡片不在（e）、目的地不在（k>zz）先不記 → '+md);
  ok(await p.evaluate(()=>doc.seedAt.a==='g'&&doc.seedAt.c==='g'),'搬過之後放置紀錄更新成新位置');
  await p.evaluate(()=>{moveTo('a',null,'first');persist()});await p.waitForTimeout(200);
  await p.reload();await p.waitForTimeout(500);
  ok(await kids(p,null)==='a,d,x,g'&&await kids(p,'g')==='k,c','每條只做一次：使用者搬回首頁後，重新打開不會再搬');
  ok(errs.length===0,'moves 沒有錯誤 '+errs.join('|'));await ctx.close();

  // ===== 5. 實際的 causal-prep（現在 epi-data 上的資料＋設定與 seed）=====
  const CP=fs.readFileSync('/home/claude/epi-data/library/epm7110/causal-prep.html','utf8');
  const cfg=CP.match(/<script id="nb-config" type="application\/json">([\s\S]*?)<\/script>/)[1],seed=CP.match(/<script id="nb-seed" type="application\/json">([\s\S]*?)<\/script>/)[1];
  PAGES['cp.html']=TPL.replace(/(<script id="nb-config" type="application\/json">)[\s\S]*?(<\/script>)/,(m,a,b)=>a+cfg+b).replace(/(<script id="nb-seed" type="application\/json">)[\s\S]*?(<\/script>)/,(m,a,b)=>a+seed+b).replace(/<title>[^<]*<\/title>/,'<title>因果推論預習</title>');
  fs.writeFileSync(OUT+'causal-prep.html',PAGES['cp.html']);
  const data=JSON.parse(fs.readFileSync('/home/claude/epi-data/library/epm7110/causal-prep.data.json','utf8'));
  errs=[];ctx=await ctxFor(b);p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  PAGES['blank.html']='<!doctype html><meta charset="utf-8"><title>x</title><body></body>';await p.goto('http://nb.test/blank.html');await p.waitForTimeout(100);
  await p.evaluate(recs=>new Promise(res=>{const r=indexedDB.open('causalPrep',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');
    r.onsuccess=()=>{const tx=r.result.transaction('kv','readwrite');recs.forEach(([k,v])=>tx.objectStore('kv').put(v,k));tx.oncomplete=()=>{r.result.close();res()}}}),data.dbs[0].stores[0].records);
  await p.goto('http://nb.test/cp.html');await p.waitForTimeout(700);
  ok(await p.evaluate(()=>Object.keys(doc.nodes).length)===26&&await kids(p,null)==='prep-todo,g-orientation,g-potential-outcomes,g-causal-graphs,g-confounding,g-review','causal-prep 現有資料原樣讀出（26 張、首頁 6 張）');
  const all=[];for(const g of ['g-orientation','g-potential-outcomes','g-causal-graphs','g-confounding','g-review']){await p.evaluate(g=>location.hash='#/c/'+g,g);await p.waitForTimeout(200);all.push(...await p.$$eval('.grid .kc .kx2',a=>a.map(e=>e.textContent)))}
  ok(all.length===16&&!all.some(t=>/markdown 程式碼區塊|複製原始碼|\$/.test(t)),'16 張主題的摘要都沒有漏出指令或 $');
  console.log('  例：'+all.find(t=>/∣|₁/.test(t)||t.includes('E('))||all[3]);
  await p.evaluate(()=>location.hash='#/c/g-confounding');await p.waitForTimeout(200);await p.screenshot({path:OUT+'7_cp_group.png'});
  ok(await p.evaluate(()=>doc.movesDone.length===0&&!doc.seedAt['chapter-map']),'舊資料沒有放置紀錄，也沒有被亂搬');
  ok(errs.length===0,'causal-prep 沒有錯誤 '+errs.join('|'));await ctx.close();

  // ===== 6. 表格裡的英文單字不能被切斷（電腦、手機）=====
  const split=()=>{const bad=[];document.querySelectorAll('.md td,.md th').forEach(td=>{
      const w=document.createTreeWalker(td,NodeFilter.SHOW_TEXT);let n;
      while((n=w.nextNode())){const re=/[A-Za-z]{4,}/g;let m;while((m=re.exec(n.data))){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);
        if(new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size>1)bad.push(m[0])}}});return bad};
  for(const [lab,w] of [['電腦',1200],['手機',390]]){
    errs=[];ctx=await ctxFor(b,{viewport:{width:w,height:900}});p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://nb.test/blank.html');
    await p.evaluate(recs=>new Promise(res=>{const r=indexedDB.open('causalPrep',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');
      r.onsuccess=()=>{const tx=r.result.transaction('kv','readwrite');recs.forEach(([k,v])=>tx.objectStore('kv').put(v,k));tx.oncomplete=()=>{r.result.close();res()}}}),data.dbs[0].stores[0].records);
    await p.goto('http://nb.test/cp.html#/c/glossary');await p.waitForTimeout(600);await p.click('.lr .lh');await p.waitForTimeout(400);
    const cut=await p.evaluate(split),cells=await p.$$eval('.lb2 td',a=>a.length);
    const po=await p.evaluate(()=>{const td=[...document.querySelectorAll('.lb2 td')].find(t=>t.textContent.trim()==='potential outcome');return td?Math.round(td.getBoundingClientRect().width):0});
    ok(cells>100&&cut.length===0,lab+'：術語對照表 '+cells+' 格，英文單字沒有被從中間切斷'+(cut.length?'（被切：'+cut.slice(0,5).join('、')+'）':''));
    ok(po>=100,lab+'：「potential outcome」那一欄夠寬（'+po+'px）');
    if(w<600)ok(await p.$eval('.lb2 .tw',e=>e.scrollWidth>e.clientWidth)&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'手機：表格太寬時在框裡左右滑，整頁不會橫向捲動');
    await (await p.$('.lb2 .tw')).screenshot({path:OUT+'8_table_'+(w<600?'phone':'desk')+'.png'});
    ok(errs.length===0,lab+'表格頁沒有錯誤 '+errs.join('|'));await ctx.close();
  }
  await b.close();
  console.log(bad.length?'✗ '+bad.length+' 項沒過':'✓ 全部合格');process.exit(bad.length?1:0);
})();
