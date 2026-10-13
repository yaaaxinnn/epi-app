// v49：Library 分頁（主題／卡片／多個 HTML）、拿掉 Guide、頁面資料（IndexedDB）同步到 .data.json、兩台裝置還原與衝突
const {JSDOM}=require('jsdom');const fs=require('fs');const fidb=require('fake-indexeddb');
const html=fs.readFileSync('/home/claude/index.html','utf8');
const now=Date.now();
const REPO={'courses/causal/old.html':'<html><head></head><body>舊頁</body></html>'};const SHA={};let shaN=0;
const calls=[];
const mkFetch=()=>(url,opt)=>{
  opt=opt||{};const u=decodeURIComponent(String(url).split('?')[0]),m=opt.method||'GET';
  const acc=(opt.headers||{}).Accept;calls.push({url:u,method:m,accept:acc});
  const path=(u.split('/contents/')[1]||'');
  const R=(ok,status,j,t)=>Promise.resolve({ok,status,json:()=>Promise.resolve(j||{}),text:()=>Promise.resolve(t||'')});
  if(u.includes('/git/trees/'))return R(true,200,{truncated:false,tree:Object.keys(REPO).map(p=>({type:'blob',path:p,sha:SHA[p]||'x',size:REPO[p].length}))
    .concat([{type:'blob',path:'papers/a.html',sha:'pa',size:9},{type:'blob',path:'library/causal/unused.html',sha:'un',size:9}])});
  if(/\/repos\/[^/]+\/[^/]+$/.test(u))return R(true,200,{size:1000});
  if(m==='PUT'){const b=JSON.parse(opt.body);if(REPO[path]!==undefined&&b.sha!==SHA[path])return R(false,409);
    REPO[path]=Buffer.from(b.content,'base64').toString('utf8');SHA[path]='s'+(++shaN);return R(true,201,{content:{sha:SHA[path]}})}
  if(m==='GET'&&path){if(!(path in REPO))return R(false,404);
    return acc==='application/vnd.github.raw'?R(true,200,{},REPO[path]):R(true,200,{sha:SHA[path]||'x0',size:REPO[path].length})}
  return R(false,404);
};
const OLD={v:1,papers:[{id:'p1',created:now,title:'P',file:'papers/a.html',tags:[]}],cards:[],qs:[],mt:[],dirs:[],notes:[],imgs:{},classes:[],trash:[],tomb:{},kd:[],prog:[],
  gsrc:[{id:'aasld',org:'AASLD',title:'x'}],grow:[],gtopic:[],
  courses:[{id:'cs1',name:'高等流行病學方法',term:'p1a',type:'required',day:1,from:3,to:4,room:'',credits:3,field:''}],
  ucourses:[{id:'ucA',created:now,mtime:now,name:'因果推論',teacher:'林老師',code:'causal'}],
  units:[{id:'uOld',created:now-1000,mtime:now-1000,cid:'ucA',week:'W7',topic:'DAG 與 confounding',date:'2026-10-19',
    reads:[{book:'Modern Epidemiology 4e (2021)',ch:'12',req:true,tb:'Confounding'}],files:[{path:'courses/causal/old.html',name:'old'}],note:''}]};
function device(name,state,idb){
  const opened=[];
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://yaaaxinnn.github.io/epi-app/',
    beforeParse(w){w.localStorage.setItem('epi-yaxin',JSON.stringify(state));
      w.localStorage.setItem('epi-yaxin-gh',JSON.stringify({owner:'yaaaxinnn',repo:'epi-data',branch:'main',path:'data/notes.json',token:'t',auto:false}));
      w.indexedDB=idb;w.IDBKeyRange=fidb.IDBKeyRange;
      w.fetch=mkFetch();w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=function(){w.__sv=this.id};
      let n=0;w.URL.createObjectURL=b=>{w.__blobs.push(b);return 'blob:https://yaaaxinnn.github.io/'+name+(++n)};w.__blobs=[];w.URL.revokeObjectURL=()=>{};
      w.open=(u)=>{const win={closed:false,location:{href:u},document:{title:'',body:{innerHTML:''}}};opened.push(win);return win};
      w.__errs=[];w.addEventListener('error',e=>w.__errs.push(e.error?e.error.stack.slice(0,300):e.message));}});
  dom.window.__opened=opened;return dom.window;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const idbPut=(W,db,store,key,val,ver)=>new Promise((res,rej)=>{const rq=W.indexedDB.open(db,ver||1);
  rq.onupgradeneeded=()=>{if(!rq.result.objectStoreNames.contains(store))rq.result.createObjectStore(store)};
  rq.onsuccess=()=>{const tx=rq.result.transaction(store,'readwrite');tx.objectStore(store).put(val,key);tx.oncomplete=()=>{rq.result.close();res()};tx.onerror=()=>rej(tx.error)};rq.onerror=()=>rej(rq.error)});
const idbGet=(W,db,store,key)=>new Promise((res)=>{const rq=W.indexedDB.open(db);
  rq.onupgradeneeded=()=>{rq.transaction.abort()};
  rq.onsuccess=()=>{if(!rq.result.objectStoreNames.contains(store)){rq.result.close();res(undefined);return}
    const q=rq.result.transaction(store).objectStore(store).get(key);q.onsuccess=()=>{rq.result.close();res(q.result)}};rq.onerror=()=>res(undefined)});
const blobText=b=>new Promise(r=>{const fr=new b.constructor===undefined?null:null;try{b.text().then(r)}catch(e){r('')}});

(async()=>{
 await sleep(10);
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const A=device('a',OLD,new fidb.IDBFactory());await sleep(1200);
 const S=A.eval('S'),D=A.document,$=s=>D.querySelector(s),$$=s=>[...D.querySelectorAll(s)];
 const click=el=>el.dispatchEvent(new A.MouseEvent('click',{bubbles:true}));
 const type=(el,v)=>{el.value=v;el.dispatchEvent(new A.Event('input',{bubbles:true}))};
 const change=(el,v)=>{el.value=v;el.dispatchEvent(new A.Event('change',{bubbles:true}))};
 const toastTxt=()=>D.getElementById('toast').textContent;
 const ix=en=>A.eval(`C.findIndex(c=>c.en==='${en}')`);

 // ── 分頁與 Guide ──
 t('分頁順序：Library 在 Notes 後，沒有 Guide',()=>$$('.tab').map(x=>x.textContent.trim()).join('|')==='Reading|Meeting|Notes|Library|Calendar|Textbooks|Review|Settings');
 t('Guide 分頁與程式都拿掉',()=>!$('#p-guide')&&!html.includes('renderGuide')&&!html.includes('summary>📑 Guide'));
 t('舊的指引資料原樣保留在存檔裡（沒刪資料）',()=>S.gsrc.length===1&&S.gsrc[0].id==='aasld');
 t('panel p-library、標題 📚 LIBRARY、主色',()=>!!$('#p-library')&&$('#p-library .blockhead .bt').textContent==='📚 LIBRARY'&&html.includes('#p-library{--ac:#4B5BA6'));
 t('ⓘ 說明是列點',()=>$$('#tipLib li').length>=6&&!$('#tipLib').classList.contains('on'));
 t('Notes 沒有和 Library 互連的欄位',()=>!$('#nt-unit')&&!html.includes('data-unitgo')&&!html.includes('data-ntgo'));

 // ── v48 資料轉換 ──
 const U0=S.units[0];
 t('週次併進標題、刪掉 week／topic',()=>U0.title==='W7 DAG 與 confounding'&&!('week' in U0)&&!('topic' in U0));
 t('課程的 teacher 轉成主題說明',()=>S.ucourses[0].desc==='林老師'&&!('teacher' in S.ucourses[0]));
 t('每個 HTML 有 fid 與 dbs',()=>/^f/.test(U0.files[0].fid)&&Array.isArray(U0.files[0].dbs));

 // ── 主題 ──
 click($('.tab[data-p="library"]'));
 click($('#ucAddBtn'));type($('#uc-name'),'Methods Seminar');
 t('英文名稱自動帶出代碼',()=>$('#uc-code').value==='methods-seminar');
 type($('#uc-code'),'因果');click($('#saveUC'));
 t('代碼不合法擋下',()=>S.ucourses.length===1&&toastTxt().includes('代碼'));
 type($('#uc-code'),'causal');click($('#saveUC'));
 t('代碼不能重複',()=>S.ucourses.length===1&&toastTxt().includes('因果推論'));
 type($('#uc-code'),'seminar');$('#uc-desc').value='林老師・PhD1 上';click($('#saveUC'));
 const T2=S.ucourses.find(x=>x.code==='seminar');
 t('建立主題 {name,desc,code}',()=>T2&&T2.name==='Methods Seminar'&&T2.desc==='林老師・PhD1 上');
 t('選中主題時顯示說明與 library/代碼/',()=>$('#ucInfo').textContent.includes('林老師・PhD1 上')&&$('#ucInfo').textContent.includes('library/seminar/'));

 // ── 卡片表單 ──
 A.eval("ucSel='ucA';renderLib()");
 click($('#addUnitBtn'));
 t('表單沒有週次欄',()=>!$('#unitForm [data-ud="week"]')&&!!$('#unitForm [data-ud="title"]')&&!!$('#unitForm [data-ud="date"]'));
 t('指定閱讀一列五格（書名、章節、必選讀、主題、✕）',()=>{const r=$('#unitForm .urow');return r&&r.children.length===5&&getComputedStyleOk(r)});
 function getComputedStyleOk(){return /grid-template-columns:minmax\(0,1\.6fr\) 42px 60px minmax\(0,1\.2fr\) 18px/.test(html)}
 type($('[data-ud="title"]'),'因果推論預習包');type($('[data-ud="date"]'),'2026-10-20');
 type($('[data-ur="0|book"]'),'Modern Epidemiology 4e (2021)');type($('[data-ur="0|ch"]'),'3');
 t('ME Ch3 自動對 Causation & Causal Inference',()=>$('select[data-ur="0|tb"]').value==='Causation & Causal Inference');
 click($('[data-uradd]'));type($('[data-ur="1|book"]'),'What If (Hernán & Robins)');type($('[data-ur="1|ch"]'),'6');change($('select[data-ur="1|req"]'),'0');
 t('What If Ch6 → Causal Diagrams',()=>$('select[data-ur="1|tb"]').value==='Causal Diagrams');
 click($('#saveUnit'));
 const U1=S.units.find(u=>u.title==='因果推論預習包');
 t('卡片存入 title／date／reads',()=>U1&&U1.date==='2026-10-20'&&U1.reads.length===2&&U1.reads[1].req===false&&U1.reads[1].tb==='Causal Diagrams');
 click($('#addUnitBtn'));click($('#saveUnit'));
 t('標題必填',()=>toastTxt().includes('標題'));click($('#cancelUnit'));
 t('依日期新到舊',()=>$$('#unitList .uti').map(x=>x.textContent).join('|')==='因果推論預習包|W7 DAG 與 confounding');

 // ── 上傳多個 HTML ──
 click($('#u-'+U1.id+' [data-upopen]'));
 A.eval(`ufAdd('causal-prep.html','<!doctype html><html><head><title>p</title></head><body>prep</body></html>',100)`);
 A.eval(`ufAdd('slides.html','<html><head></head><body>slides $1 $$</body></html>',80)`);
 t('預設路徑 library/代碼/檔名',()=>$('[data-uppath="0"]').value==='library/causal/causal-prep.html');
 await A.eval(`ufPush('${U1.id}')`);
 t('上傳兩個並綁到同一張卡',()=>U1.files.length===2&&'library/causal/causal-prep.html' in REPO&&'library/causal/slides.html' in REPO&&U1.files.every(f=>/^f/.test(f.fid)));
 click($('#u-'+U1.id+' [data-utog]'));
 t('收合時就有 📄 按鈕（每個 HTML 一顆，加 ↗）',()=>$$('#u-'+U1.id+' [data-ufopen]').length===2&&$$('#u-'+U1.id+' [data-ufnew]').length===2&&!$('#u-'+U1.id+' .usec'));
 const F1=U1.files[0],F2=U1.files[1];

 // ── 檢視 ──
 A.__blobs.length=0;
 await A.eval(`uvOpen('${F1.fid}',false)`);
 const fr=$('#uvFrame');
 t('全螢幕 blob、不加 sandbox、可複製',()=>$('#uv').classList.contains('on')&&fr.getAttribute('src').startsWith('blob:')&&!fr.hasAttribute('sandbox')&&fr.getAttribute('allow')==='clipboard-write');
 const b1=await A.__blobs[A.__blobs.length-1].text();
 t('先插入偵測程式（記錄資料庫），內嵌檢視沒有 ✕ 浮鈕',()=>b1.indexOf('libSeen')>0&&b1.indexOf('libSeen')<b1.indexOf('<title>')&&!b1.includes('__epiX'));
 t('有頂列 ☁ 同步、↗、✕',()=>!!$('#uvSync')&&!!$('#uvNew')&&!!$('#uvClose'));
 click($('#uvNew'));
 const b2=await A.__blobs[A.__blobs.length-1].text();
 t('檢視器的 ↗：新分頁版本有右上角 ✕（按了先同步再關）',()=>A.__opened.length===1&&b2.includes('__epiX')&&b2.includes('libPushNow')&&b2.includes('window.close()'));
 A.__blobs.length=0;
 await A.eval(`uvOpen('${F2.fid}',false)`);
 const b3=await A.__blobs[A.__blobs.length-1].text();
 t('HTML 裡的 $ 不會被插入動作弄壞',()=>b3.includes('slides $1 $$'));
 await A.eval('uvCloseNow()');

 // ── 頁面資料同步（裝置 A） ──
 await A.eval(`uvOpen('${F1.fid}',false)`);
 A.eval(`libSeen('${F1.fid}','causalPrep')`);
 t('頁面打開資料庫時記到 dbs',()=>F1.dbs.join()==='causalPrep');
 await idbPut(A,'causalPrep','kv','state',{version:1,entries:{n1:[{id:'e1',q:'Q1',a:'答案一'}]},todo:{t1:123},when:new Date('2026-10-13T08:00:00Z')});
 const putsBefore=calls.filter(c=>c.method==='PUT').length;
 await A.eval('uvCloseNow()');
 const dp='library/causal/causal-prep.data.json';
 t('關閉時上傳到 HTML 旁的 .data.json',()=>dp in REPO&&JSON.parse(REPO[dp]).dbs[0].name==='causalPrep'&&calls.filter(c=>c.method==='PUT').length===putsBefore+1);
 const rec=()=>JSON.parse(A.localStorage.getItem('epi-yaxin-libsync')||'{}')[F1.fid];
 t('這台記下同步紀錄（不放進 notes.json）',()=>rec()&&rec().sha===SHA[dp]&&!JSON.stringify(A.eval('exportable()')).includes('libsync'));
 const v1=await A.eval(`libPush('${F1.fid}')`);
 t('沒變動回 same',()=>v1==='same');
 await A.eval("idbDump(['nope'])");const dbs=await A.indexedDB.databases();
 t('idbDump 不建空資料庫',()=>!dbs.some(d=>d.name==='nope'));
 await idbPut(A,'causalPrep','kv','state',{version:1,entries:{n1:[{id:'e1',q:'Q1',a:'答案一（改）'}]},todo:{t1:123}});
 const v2=await A.eval(`libPush('${F1.fid}',{quiet:true})`);
 t('有變動就上傳（每分鐘的背景同步走這條）',()=>v2==='pushed'&&JSON.stringify(JSON.parse(REPO[dp]).dbs).includes('答案一（改）'));
 click($('#u-'+U1.id+' [data-utog]'));
 t('展開卡片顯示每個 HTML 的同步時間',()=>/☁ \d+\/\d+ \d\d:\d\d/.test($('#u-'+U1.id+' .ufile .us').textContent));
 await sleep(400);

 // ── 裝置 B：還原 ──
 const stateB=JSON.parse(A.localStorage.getItem('epi-yaxin'));
 const B=device('b',stateB,new fidb.IDBFactory());await sleep(1200);
 const DB_=B.document;
 const before=await idbGet(B,'causalPrep','kv','state');
 await B.eval(`uvOpen('${F1.fid}',false)`);
 const after=await idbGet(B,'causalPrep','kv','state');
 t('B 打開頁面前先從雲端還原',()=>before===undefined&&after&&after.entries.n1[0].a==='答案一（改）'&&after.todo.t1===123);
 const st=await idbGet(A,'causalPrep','kv','state');
 await idbPut(A,'causalPrep','kv','d',new Date('2026-01-02T03:04:05Z'));await A.eval(`libPush('${F1.fid}',{quiet:true})`);
 await B.eval('uvCloseNow()');await B.eval(`uvOpen('${F1.fid}',false)`);
 const dd=await idbGet(B,'causalPrep','kv','d');
 t('Date 還原成 Date',()=>dd instanceof B.Date||Object.prototype.toString.call(dd)==='[object Date]');
 await B.eval('uvCloseNow()');

 // ── 衝突 ──
 await idbPut(B,'causalPrep','kv','state',{version:1,entries:{n1:[{id:'e1',q:'Q1',a:'B 改的'}]},todo:{}});
 const vb=await B.eval(`libPush('${F1.fid}')`);
 t('B 改完上傳',()=>vb==='pushed'&&REPO[dp].includes('B 改的'));
 await idbPut(A,'causalPrep','kv','state',{version:1,entries:{n1:[{id:'e1',q:'Q1',a:'A 也改了'}]},todo:{}});
 const vq=await A.eval(`libPush('${F1.fid}',{quiet:true})`);
 t('背景同步遇到衝突不覆蓋、不跳窗',()=>vq==='conflict'&&!A.document.getElementById('libAsk').classList.contains('on')&&REPO[dp].includes('B 改的'));
 const pr=A.eval(`libPull(S.units.flatMap(u=>u.files).find(f=>f.fid==='${F1.fid}'))`);
 await sleep(200);
 t('打開時遇到衝突跳出選擇',()=>A.document.getElementById('libAsk').classList.contains('on')&&A.document.getElementById('libAskMsg').textContent.includes('都改過'));
 click(A.document.getElementById('libAskLocal'));const vr=await pr;
 const bk=Object.keys(REPO).filter(p=>/causal-prep\.data\.backup-\d{8}-\d{6}\.json$/.test(p));
 t('選「用這台的」：雲端換成 A 的，B 的另存備份',()=>vr==='pushed'&&REPO[dp].includes('A 也改了')&&bk.length===1&&REPO[bk[0]].includes('B 改的'));
 await idbPut(B,'causalPrep','kv','state',{version:1,entries:{n1:[{id:'e1',q:'Q1',a:'B 再改'}]},todo:{}});
 const pb=B.eval(`libPull(S.units.flatMap(u=>u.files).find(f=>f.fid==='${F1.fid}'))`);await sleep(200);
 click(B.document.getElementById('libAskCloud'));const vb2=await pb;
 const bkB=Object.keys(REPO).filter(p=>/backup/.test(p)&&REPO[p].includes('B 再改'));
 const nowB=await idbGet(B,'causalPrep','kv','state');
 t('選「用雲端的」：這台換成雲端，這台的另存備份',()=>vb2==='pulled'&&nowB.entries.n1[0].a==='A 也改了'&&bkB.length===1);

 // ── 解除綁定、刪除 ──
 await A.eval(`doHold('ufile|${F2.fid}')`);
 t('✕ 長按只解除綁定',()=>U1.files.length===1&&'library/causal/slides.html' in REPO&&toastTxt().includes('還在'));
 A.eval("ucSel='ucA';renderLib()");
 await A.eval("doHold('ucourse|ucA')");
 t('還有卡片的主題不能刪',()=>S.ucourses.some(x=>x.id==='ucA')&&toastTxt().includes('還有 2 張卡片'));
 await A.eval(`doHold('unit|uOld')`);
 t('刪卡片進回收桶',()=>!S.units.some(u=>u.id==='uOld')&&S.trash[0].type==='unit');
 click(D.querySelector(`[data-undel="${S.trash[0].tid}"]`));
 t('從回收桶還原',()=>S.units.some(u=>u.id==='uOld'));

 // ── Textbooks、清理、HELP ──
 A.eval(`openU.add('${U1.id}');renderLib()`);
 click($(`#u-${U1.id} [data-tbgo="${ix('Causal Diagrams')}"]`));
 t('點主題 pill 跳到 Textbooks 並展開',()=>$('.tab[data-p="textbooks"]').getAttribute('aria-selected')==='true'&&A.eval(`th(${ix('Causal Diagrams')}).open`)===true&&A.__sv==='th-'+ix('Causal Diagrams'));
 t('orphUsed 含 Library 綁的 HTML',()=>{const u=A.eval('orphUsed()');return u.has('library/causal/causal-prep.html')&&u.has('courses/causal/old.html')&&u.has('papers/a.html')});
 await A.eval('orphScan()');
 const op=A.eval('orphans').map(o=>o.path).sort().join('|');
 t('清理只列沒人指向的 HTML（.data.json 不列）',()=>op==='library/causal/slides.html|library/causal/unused.html'||op);
 const hb=$('#helpBox').innerHTML;
 t('HELP：📚 Library、八個分頁、同步說明、沒有 Guide',()=>hb.includes('<summary>📚 Library</summary>')&&hb.includes('八個分頁在做什麼')&&hb.includes('.data.backup-日期.json')&&!hb.includes('📑 Guide')&&!/<strong>Guide<\/strong>/.test(hb));
 t('全分頁可切換',()=>{$$('#tabs button').forEach(b=>click(b));return A.__errs.length===0||A.__errs.join('|')});
 await sleep(400);
 const sv=JSON.parse(A.localStorage.getItem('epi-yaxin'));
 t('寫進 localStorage（dbs 記在卡片上，會跟 notes.json 同步）',()=>sv.units.some(u=>u.files.some(f=>f.dbs.includes('causalPrep'))));
 t('沒有執行期錯誤',()=>(A.__errs.length===0&&B.__errs.length===0)||A.__errs.concat(B.__errs).join('\n'));
 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 const p=R.filter(r=>r[0]==='PASS').length;console.log(`通過 ${p}/${R.length}`);process.exit(p===R.length?0:1);
})();
