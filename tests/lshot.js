// v49 Library 實機：兩個瀏覽器環境＝兩台裝置，真的 IndexedDB、真的 causal-prep.html
const {chromium}=require('playwright');const fs=require('fs');
const OUT=process.env.OUT||'/tmp/claude-0/-home-claude/d1fb5984-118a-5eb3-864f-3695fb43e27f/scratchpad/shots49/';
fs.mkdirSync(OUT,{recursive:true});
const REPO={},SHA={};let n=0;const bad=[];const log=(...a)=>console.log(...a);
async function ctxFor(b,w){
  const ctx=await b.newContext({viewport:{width:w,height:860},deviceScaleFactor:2});
  await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:'http://localhost:8766'});
  await ctx.route('https://api.github.com/**',async r=>{
    const q=r.request(),u=decodeURIComponent(q.url().split('?')[0]),path=u.split('/contents/')[1]||'';
    if(q.method()==='PUT'){const j=JSON.parse(q.postData());if(REPO[path]!==undefined&&j.sha!==SHA[path])return r.fulfill({status:409,body:'{}'});
      REPO[path]=/\.jpg$/.test(path)?j.content:Buffer.from(j.content,'base64').toString('utf8');SHA[path]='s'+(++n);
      return r.fulfill({status:201,contentType:'application/json',body:JSON.stringify({content:{sha:SHA[path]}})})}
    if(path&&q.method()==='GET'){if(!(path in REPO))return r.fulfill({status:404,body:'{}'});
      if((q.headers()['accept']||'').includes('raw')){if(/\.jpg$/.test(path))return r.fulfill({status:200,contentType:'image/jpeg',body:Buffer.from(REPO[path],'base64')});
        return r.fulfill({status:200,contentType:'text/plain; charset=utf-8',body:REPO[path]})}
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sha:SHA[path],size:REPO[path].length})})}
    return r.fulfill({status:404,body:'{}'});
  });
  await ctx.route(/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  return ctx;
}
const GHJS=()=>{GH={owner:'yaaaxinnn',repo:'epi-data',branch:'main',path:'data/notes.json',token:'t',auto:false}};
async function addEntry(fr,q,a){
  await fr.click('#nav a[href="#n1"]');await fr.waitForTimeout(250);
  await fr.click('.list .btn.primary');await fr.waitForTimeout(150);
  await fr.fill('.editor .fq',q);await fr.fill('.editor .fa',a);
  await fr.click('.editor .factions .btn.primary');await fr.waitForTimeout(300);
}
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  if(!fs.existsSync('/home/claude/serve/fig1.png')){const p=await b.newPage({viewport:{width:900,height:600}});
    await p.setContent('<body style="margin:0;background:#fff;font:40px sans-serif"><svg width=900 height=600><circle cx=200 cy=300 r=120 fill=#4B5BA6 /><text x=380 y=310>Figure 3.1 DAG</text></svg></body>');
    await p.screenshot({path:'/home/claude/serve/fig1.png'});await p.setViewportSize({width:500,height:800});await p.screenshot({path:'/home/claude/serve/fig2.png'});await p.close()}
  for(const [label,w] of [['desk',1100],['phone',390]]){
    for(const k of Object.keys(REPO))delete REPO[k];
    // ===== 裝置 A =====
    const A=await ctxFor(b,w),pa=await A.newPage();const ea=[];pa.on('pageerror',e=>ea.push(e.message));
    await pa.goto('http://localhost:8766/index.html');await pa.waitForTimeout(600);
    await pa.evaluate(GHJS);
    await pa.click('.tab[data-p="library"]');
    await pa.click('#ucAddBtn');await pa.fill('#uc-name','高等流行病學方法');await pa.fill('#uc-desc','方啓泰/林先和/李文宗');await pa.fill('#uc-code','epm7110');await pa.click('#saveUC');
    await pa.click('#ucAddBtn');await pa.fill('#uc-name','Methods Seminar');await pa.fill('#uc-code','seminar');await pa.click('#saveUC');
    await pa.click('#ucNav [data-ucf]');
    await pa.click('#addUnitBtn');
    await pa.fill('[data-ud="title"]','Week 6. 干擾作用預習');await pa.fill('[data-ud="date"]','2026-10-14');
    await pa.fill('[data-ud="note"]','先做 **步驟 A**，再看 ME Ch12');
    await pa.setInputFiles('#ua-file',['/home/claude/serve/causal-prep.html','/home/claude/serve/fig1.png','/home/claude/serve/fig2.png']);await pa.waitForTimeout(1000);
    if(await pa.$$eval('#unitForm .udrop',x=>x.length)!==1)bad.push(label+' 拖放區不只一個');
    await pa.fill('[data-qcap="0"]','Figure 3.1 六張 DAG');
    await (await pa.$('#unitForm')).screenshot({path:OUT+label+'_1_form.png'});
    await pa.click('#saveUnit');await pa.waitForTimeout(800);
    const uid=await pa.evaluate(()=>S.units.find(u=>u.title.startsWith('Week 6')).id);
    const fid=await pa.evaluate(id=>S.units.find(u=>u.id===id).files[0].fid,uid);
    if(!REPO['library/epm7110/causal-prep.html'])bad.push(label+' HTML 沒上傳');
    await pa.screenshot({path:OUT+label+'_2_list.png'});
    const imgs=await pa.evaluate(id=>S.units.find(u=>u.id===id).imgs.map(g=>g.path+'|'+g.cap),uid);
    log(label,'圖片',JSON.stringify(imgs));
    if(imgs.length!==2||!imgs.every(p=>/library\/epm7110\/img\/.+\.jpg/.test(p))||!REPO[imgs[0].split('|')[0]])bad.push(label+' 圖片沒上傳');
    if(await pa.$(`#u-${uid} img`))bad.push(label+' 卡片上直接出現大圖');
    await pa.click(`#u-${uid} [data-uimg]`);await pa.waitForTimeout(800);
    const iv=await pa.evaluate(()=>{const i=document.getElementById('ivImg');return {on:document.getElementById('imgv').classList.contains('on'),w:i.naturalWidth,cap:document.getElementById('ivCap').textContent}});
    log(label,'放大看',JSON.stringify(iv));
    if(!iv.on||!iv.w||!iv.cap.includes('Figure 3.1'))bad.push(label+' 放大看圖失敗');
    await pa.screenshot({path:OUT+label+'_2b_image.png'});
    await pa.keyboard.press('Escape');await pa.waitForTimeout(200);
    const ph=await pa.evaluate(()=>[...document.querySelectorAll('[placeholder]')].map(x=>x.id).sort().join('|'));if(ph!=='nsearch|qCard|qPaper|qSec')bad.push(label+' 搜尋框以外還有提示字 '+ph);
    // 打開、在頁面裡新增一則問答
    await pa.click(`#u-${uid} [data-ufopen="${fid}"]`);await pa.waitForTimeout(1200);
    let fr=pa.frame({url:/^blob:/});
    await addEntry(fr,'A 裝置的問題：collider 是什麼？','A 的答案');
    const dbs=await pa.evaluate(id=>S.units[0].files.find(f=>f.fid===id).dbs,fid);
    log(label,'偵測到的資料庫',JSON.stringify(dbs));
    if(JSON.stringify(dbs)!=='["causalPrep"]')bad.push(label+' 沒偵測到 causalPrep');
    await pa.screenshot({path:OUT+label+'_3_viewer.png'});
    await pa.click('#uvClose');await pa.waitForTimeout(1500);
    const dp='library/epm7110/causal-prep.data.json';
    log(label,'關閉後 data.json',REPO[dp]?('有，含 A 的答案：'+REPO[dp].includes('A 的答案')):'沒有');
    if(!REPO[dp]||!REPO[dp].includes('A 裝置的問題'))bad.push(label+' 關閉後沒上傳');
    // 開新分頁、右上角 ✕
    await pa.click(`#u-${uid} [data-ufopen="${fid}"]`);await pa.waitForTimeout(1000);
    const [tab]=await Promise.all([A.waitForEvent('page'),pa.click('#uvNew')]);
    await pa.click('#uvClose');
    await tab.waitForLoadState();await tab.waitForTimeout(1200);
    const xb=await tab.evaluate(()=>{const b=document.getElementById('__epiX');if(!b)return null;const r=b.getBoundingClientRect();return {top:Math.round(r.top),right:Math.round(innerWidth-r.right),w:Math.round(r.width)}});
    log(label,'新分頁 ✕',JSON.stringify(xb));
    if(!xb||xb.top>14||xb.right>14)bad.push(label+' 新分頁沒有右上角 ✕');
    const seenA=await tab.evaluate(()=>{location.hash='#n1';return new Promise(r=>setTimeout(()=>r(document.body.innerText.includes('A 裝置的問題')),400))});
    if(!seenA)bad.push(label+' 新分頁看不到剛剛的問答');
    await addEntry(tab,'新分頁加的第二題','第二題答案');
    await tab.screenshot({path:OUT+label+'_4_newtab.png'});
    const closed=tab.waitForEvent('close',{timeout:8000}).then(()=>true).catch(()=>false);
    await tab.click('#__epiX');
    const didClose=await closed;await pa.waitForTimeout(800);
    log(label,'按 ✕ 分頁有關？',didClose,'data.json 有第二題？',REPO[dp].includes('第二題答案'));
    if(!didClose)bad.push(label+' ✕ 沒關掉分頁');
    if(!REPO[dp].includes('第二題答案'))bad.push(label+' ✕ 沒先同步');
    await pa.waitForTimeout(300);await (await pa.$(`#u-${uid}`)).screenshot({path:OUT+label+'_5_card.png'});
    const stateA=await pa.evaluate(()=>localStorage.getItem('epi-yaxin'));
    // ===== 裝置 B（另一個瀏覽器、空的 IndexedDB）=====
    const B=await ctxFor(b,w);await B.addInitScript(s=>{if(!localStorage.getItem('epi-yaxin'))localStorage.setItem('epi-yaxin',s)},stateA);
    const pb=await B.newPage();const eb=[];pb.on('pageerror',e=>eb.push(e.message));
    await pb.goto('http://localhost:8766/index.html');await pb.waitForTimeout(600);
    await pb.evaluate(GHJS);await pb.evaluate(()=>{document.querySelector('.tab[data-p="library"]').click()});
    await pb.evaluate(cid=>{libPick(cid);renderLib()},await pa.evaluate(id=>S.units.find(u=>u.id===id).cid,uid));
    await pb.click(`#u-${uid} [data-ufopen="${fid}"]`);await pb.waitForTimeout(1400);
    const fb=pb.frame({url:/^blob:/});
    await fb.click('#nav a[href="#n1"]');await fb.waitForTimeout(300);
    const txt=await fb.evaluate(()=>document.querySelector('#main').innerText);
    const okB=txt.includes('A 裝置的問題')&&txt.includes('新分頁加的第二題');
    log(label,'裝置 B 打開後看得到兩題？',okB);
    if(!okB)bad.push(label+' 裝置 B 沒有還原');
    await pb.screenshot({path:OUT+label+'_6_deviceB.png'});
    // B 改、A 也改 → A 打開時問要用哪份
    await addEntry(fb,'B 加的題目','B 答案');await pb.click('#uvClose');await pb.waitForTimeout(1500);
    await pa.evaluate(()=>new Promise(r=>{const q=indexedDB.open('causalPrep');q.onsuccess=()=>{const db=q.result,tx=db.transaction('kv','readwrite'),st=tx.objectStore('kv');
      const g=st.get('state');g.onsuccess=()=>{const s=g.result;s.todo=s.todo||{};s.todo.t1=Date.now();st.put(s,'state')};tx.oncomplete=()=>{db.close();r()}}}));
    await pa.click(`#u-${uid} [data-ufopen="${fid}"]`);await pa.waitForTimeout(1200);
    const ask=await pa.evaluate(()=>document.getElementById('libAsk').classList.contains('on'));
    await pa.screenshot({path:OUT+label+'_7_conflict.png'});
    log(label,'兩邊都改過 → 跳出選擇？',ask);
    if(!ask)bad.push(label+' 衝突沒跳出選擇');
    else{await pa.click('#libAskCloud');await pa.waitForTimeout(1500);
      fr=pa.frame({url:/^blob:/});await fr.click('#nav a[href="#n1"]');await fr.waitForTimeout(300);
      const t2=await fr.evaluate(()=>document.querySelector('#main').innerText);
      const bk=Object.keys(REPO).filter(k=>k.includes('.data.backup-'));
      log(label,'選雲端後 A 看得到 B 的題目？',t2.includes('B 加的題目'),'備份檔',bk.length);
      if(!t2.includes('B 加的題目')||bk.length!==1)bad.push(label+' 選雲端後結果不對');
      await pa.click('#uvClose');await pa.waitForTimeout(800)}
    for(const p of ['library']){const ov=await pa.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(ov>0)bad.push(`${label} 水平溢出 ${ov}px`)}
    if(ea.length||eb.length)bad.push(label+' JS 錯誤：'+ea.concat(eb).join(' / '));
    await A.close();await B.close();
  }
  await b.close();
  console.log(bad.length?'✗ '+bad.join('\n'):'✓ 全部合格');process.exit(bad.length?1:0);
})();
