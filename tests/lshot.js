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
      REPO[path]=Buffer.from(j.content,'base64').toString('utf8');SHA[path]='s'+(++n);
      return r.fulfill({status:201,contentType:'application/json',body:JSON.stringify({content:{sha:SHA[path]}})})}
    if(path&&q.method()==='GET'){if(!(path in REPO))return r.fulfill({status:404,body:'{}'});
      if((q.headers()['accept']||'').includes('raw'))return r.fulfill({status:200,contentType:'text/plain; charset=utf-8',body:REPO[path]});
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
  for(const [label,w] of [['desk',1100],['phone',390]]){
    for(const k of Object.keys(REPO))delete REPO[k];
    // ===== 裝置 A =====
    const A=await ctxFor(b,w),pa=await A.newPage();const ea=[];pa.on('pageerror',e=>ea.push(e.message));
    await pa.goto('http://localhost:8766/index.html');await pa.waitForTimeout(600);
    await pa.evaluate(GHJS);
    await pa.click('.tab[data-p="library"]');
    await pa.click('#ucAddBtn');await pa.fill('#uc-name','高等流行病學方法');await pa.fill('#uc-desc','林老師・PhD1 上');await pa.fill('#uc-code','causal');await pa.click('#saveUC');
    await pa.click('#addUnitBtn');
    await pa.fill('[data-ud="title"]','因果推論預習包');await pa.fill('[data-ud="date"]','2026-10-20');
    await pa.fill('[data-ur="0|book"]','Modern Epidemiology 4e (2021)');await pa.fill('[data-ur="0|ch"]','3');
    await pa.click('[data-uradd]');await pa.fill('[data-ur="1|book"]','What If (Hernán & Robins)');await pa.fill('[data-ur="1|ch"]','6');await pa.selectOption('[data-ur="1|req"]','0');
    await (await pa.$('#unitForm')).screenshot({path:OUT+label+'_1_form.png'});
    const rowH=await pa.evaluate(()=>{const r=document.querySelector('#unitForm .urow');const kids=[...r.children].map(c=>{const b=c.getBoundingClientRect();return (b.top+b.bottom)/2});return Math.max(...kids)-Math.min(...kids)});
    if(rowH>4)bad.push(label+' 指定閱讀沒有在同一列 '+rowH);
    await pa.click('#saveUnit');
    const uid=await pa.evaluate(()=>S.units[0].id);
    await pa.click(`#u-${uid} [data-upopen]`);
    await pa.setInputFiles('#uf-file','/home/claude/serve/causal-prep.html');await pa.waitForTimeout(300);
    await pa.click(`#u-${uid} [data-upgo]`);await pa.waitForTimeout(500);
    const fid=await pa.evaluate(()=>S.units[0].files[0].fid);
    if(!REPO['library/causal/causal-prep.html'])bad.push(label+' HTML 沒上傳');
    await pa.click(`#u-${uid} [data-utog]`);await pa.waitForTimeout(150);
    await pa.screenshot({path:OUT+label+'_2_list.png'});
    // 打開、在頁面裡新增一則問答
    await pa.click(`#u-${uid} [data-ufopen="${fid}"]`);await pa.waitForTimeout(1200);
    let fr=pa.frame({url:/^blob:/});
    await addEntry(fr,'A 裝置的問題：collider 是什麼？','A 的答案');
    const dbs=await pa.evaluate(id=>S.units[0].files.find(f=>f.fid===id).dbs,fid);
    log(label,'偵測到的資料庫',JSON.stringify(dbs));
    if(JSON.stringify(dbs)!=='["causalPrep"]')bad.push(label+' 沒偵測到 causalPrep');
    await pa.screenshot({path:OUT+label+'_3_viewer.png'});
    await pa.click('#uvClose');await pa.waitForTimeout(1500);
    const dp='library/causal/causal-prep.data.json';
    log(label,'關閉後 data.json',REPO[dp]?('有，含 A 的答案：'+REPO[dp].includes('A 的答案')):'沒有');
    if(!REPO[dp]||!REPO[dp].includes('A 裝置的問題'))bad.push(label+' 關閉後沒上傳');
    // 開新分頁、右上角 ✕
    const [tab]=await Promise.all([A.waitForEvent('page'),pa.click(`#u-${uid} [data-ufnew="${fid}"]`)]);
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
    await pa.click(`#u-${uid} [data-utog]`);await pa.waitForTimeout(150);
    await (await pa.$(`#u-${uid}`)).screenshot({path:OUT+label+'_5_card.png'});
    const stateA=await pa.evaluate(()=>localStorage.getItem('epi-yaxin'));
    // ===== 裝置 B（另一個瀏覽器、空的 IndexedDB）=====
    const B=await ctxFor(b,w);await B.addInitScript(s=>{if(!localStorage.getItem('epi-yaxin'))localStorage.setItem('epi-yaxin',s)},stateA);
    const pb=await B.newPage();const eb=[];pb.on('pageerror',e=>eb.push(e.message));
    await pb.goto('http://localhost:8766/index.html');await pb.waitForTimeout(600);
    await pb.evaluate(GHJS);await pb.evaluate(()=>{document.querySelector('.tab[data-p="library"]').click()});
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
