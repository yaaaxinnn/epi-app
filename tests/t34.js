// 1.2：Library ＋ 空白筆記頁（templates/notebook.html）、覆蓋同名 HTML 前另存 .old-日期.html 與 .data.backup、頁面資料比雲端少一半以上先問；沿用 1.1：Review 每日複習開關（暫停時不顯示紅點、打開時到期日順延）、評分會蓋 mtime（跨裝置同步）、Notes 內容空著的 ● 變酒紅色、使用說明改成列點與表格、Library 說明 ☁️／長按 ✕／img 路徑；沿用 1.0：HTML 與圖片同一個拖放區、卡片上都是小標籤（沒有 ↗）、右欄一列兩張、🖼️、搜尋框提示字加回來、Settings 說明更新；沿用 v52：說明區可放圖片（拖曳、選檔、貼上，小說明、點開才看大圖）、HTML 區不再手填路徑、全站拿掉輸入框提示字；沿用 v51：Library 左右兩欄（左主題、右卡片）、卡片概覽、指定閱讀拿掉、HTML 在表單裡上傳；沿用 v49：拿掉 Guide、頁面資料（IndexedDB）同步到 .data.json、兩台裝置還原與衝突
const {JSDOM}=require('jsdom');const fs=require('fs');const fidb=require('fake-indexeddb');
const html=fs.readFileSync('/home/claude/index.html','utf8');
const TPL=fs.readFileSync('/home/claude/epi-app/templates/notebook.html','utf8');
const now=Date.now();
const REPO={'courses/causal/old.html':'<html><head></head><body>舊頁</body></html>'};const SHA={};let shaN=0;
const calls=[];let BlobC=null;const B64={};
const mkFetch=()=>(url,opt)=>{
  opt=opt||{};const u=decodeURIComponent(String(url).split('?')[0]),m=opt.method||'GET';
  const acc=(opt.headers||{}).Accept;calls.push({url:u,method:m,accept:acc});
  if(/\/templates\/notebook\.html$/.test(u))return Promise.resolve({ok:true,status:200,text:()=>Promise.resolve(TPL),json:()=>Promise.resolve({})});
  const path=(u.split('/contents/')[1]||'');
  const R=(ok,status,j,t)=>Promise.resolve({ok,status,json:()=>Promise.resolve(j||{}),text:()=>Promise.resolve(t||'')});
  if(u.includes('/git/trees/'))return R(true,200,{truncated:false,tree:Object.keys(REPO).map(p=>({type:'blob',path:p,sha:SHA[p]||'x',size:REPO[p].length}))
    .concat([{type:'blob',path:'papers/a.html',sha:'pa',size:9},{type:'blob',path:'library/causal/unused.html',sha:'un',size:9}])});
  if(/\/repos\/[^/]+\/[^/]+$/.test(u))return R(true,200,{size:1000});
  if(m==='PUT'){const b=JSON.parse(opt.body);if(REPO[path]!==undefined&&b.sha!==SHA[path])return R(false,409);
    REPO[path]=/\.jpg$/.test(path)?b.content:Buffer.from(b.content,'base64').toString('utf8');SHA[path]='s'+(++shaN);return R(true,201,{content:{sha:SHA[path]}})}
  if(m==='GET'&&path){if(!(path in REPO))return R(false,404);
    if(acc==='application/vnd.github.raw')return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({}),text:()=>Promise.resolve(REPO[path]),blob:()=>Promise.resolve(new BlobC([Buffer.from(REPO[path],'base64')],{type:'image/jpeg'}))});
    return R(true,200,{sha:SHA[path]||'x0',size:REPO[path].length})}
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
 const A=device('a',OLD,new fidb.IDBFactory());await sleep(1200);BlobC=A.Blob;
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
 t('左欄是主題清單，右欄是卡片',()=>!!$('#p-library .dirwrap #ucNav')&&!!$('#p-library .dirbody #unitList')&&!$('#ucBar'));
 t('左欄列出主題與卡片數，最下面是＋ 主題',()=>{const b=$$('#ucNav .dnav');return b.length===2&&b[0].textContent.includes('因果推論')&&b[0].querySelector('.ct').textContent==='1'&&b[1].id==='ucAddBtn'});
 t('預設選第一個主題',()=>$('#ucNav [data-ucf="ucA"]').getAttribute('aria-pressed')==='true');
 click($('#ucAddBtn'));
 t('按＋ 主題打開表單',()=>$('#ucForm').style.display==='');
 click($('#ucAddBtn'));
 t('再按一次收起',()=>$('#ucForm').style.display==='none');
 click($('#ucAddBtn'));type($('#uc-name'),'Methods Seminar');
 t('英文名稱自動帶出代碼',()=>$('#uc-code').value==='methods-seminar');
 type($('#uc-code'),'因果');click($('#saveUC'));
 t('代碼不合法擋下',()=>S.ucourses.length===1&&toastTxt().includes('代碼'));
 type($('#uc-code'),'causal');click($('#saveUC'));
 t('代碼不能重複',()=>S.ucourses.length===1&&toastTxt().includes('因果推論'));
 type($('#uc-code'),'seminar');$('#uc-desc').value='林老師・PhD1 上';click($('#saveUC'));
 const T2=S.ucourses.find(x=>x.code==='seminar');
 t('建立主題 {name,desc,code}',()=>T2&&T2.name==='Methods Seminar'&&T2.desc==='林老師・PhD1 上');
 t('新主題自動選中，右欄顯示說明與 library/代碼/',()=>$('#ucInfo').textContent.includes('林老師・PhD1 上')&&$('#ucInfo').textContent.includes('library/seminar/')&&$('#ucNav [data-ucf="'+T2.id+'"]').getAttribute('aria-pressed')==='true');
 t('沒有卡片的主題顯示提示',()=>$('#unitList .empty').textContent.includes('還沒有卡片'));

 // ── 卡片表單 ──
 click($('#ucNav [data-ucf="ucA"]'));
 t('點左欄主題切換右欄',()=>$('#ucInfo').textContent.includes('因果推論')&&$$('#unitList .item').length===1);
 t('卡片不重複顯示主題說明',()=>!$('#unitList .item').textContent.includes('林老師'));
 t('指定閱讀不顯示（舊資料保留在存檔裡）',()=>!$('#p-library').textContent.includes('指定閱讀')&&!$('#p-library').textContent.includes('必讀')&&S.units[0].reads.length===1);
 t('卡片直接是概覽：日期、標題、📄，不用點開',()=>{const it=$('#u-uOld');return it.textContent.includes('10/19（一）')&&it.textContent.includes('W7 DAG 與 confounding')&&!!it.querySelector('[data-ufopen]')&&!it.querySelector('[data-utog]')});
 click($('#addUnitBtn'));
 t('表單：主題、日期、標題、說明，HTML 與圖片只有一個拖放區，沒有週次和指定閱讀',()=>!!$('#unitForm [data-ud="title"]')&&!!$('#unitForm [data-ud="date"]')&&!!$('#unitForm [data-ud="note"]')&&$$('#unitForm .udrop').length===1&&!!$('#unitForm [data-adrop]')&&!!$('#ua-file')&&!$('#uf-file')&&!$('#ui-file')&&!$('#unitForm [data-ud="week"]')&&!$('#unitForm .urow'));
 t('「備註」改名「說明」',()=>$('#unitForm').textContent.includes('說明（Markdown')&&!$('#unitForm').textContent.includes('備註'));
 t('HTML 區沒有手填路徑的輸入框',()=>!$('#unitForm [data-ud="bind"]')&&!$('#unitForm [data-uppath]'));
 t('只有四個搜尋框有提示字',()=>[...D.querySelectorAll('[placeholder]')].map(x=>x.id).sort().join('|')==='nsearch|qCard|qPaper|qSec');
 t('新卡片預設目前的主題',()=>$('#unitForm [data-ud="cid"]').value==='ucA');
 type($('[data-ud="title"]'),'因果推論預習包');type($('[data-ud="date"]'),'2026-10-20');type($('[data-ud="note"]'),'**非同步**課程，先看步驟 A');
 A.eval(`ufAdd('causal-prep.html','<!doctype html><html><head><title>p</title></head><body>prep</body></html>',100)`);
 A.eval(`ufAdd('slides.html','<html><head></head><body>slides $1 $$</body></html>',80)`);

 const JPG='/9j/4AAQSkZJRgABAQ';
 A.eval(`uiAdd('data:image/jpeg;base64,${JPG}','Figure 3.1')`);A.eval(`uiAdd('data:image/jpeg;base64,${JPG}','')`);
 t('圖片排隊：縮圖＋小說明輸入框',()=>$$('#unitForm .uirow').length===2&&$('#unitForm [data-qcap="0"]').value==='Figure 3.1');
 type($('#unitForm [data-qcap="1"]'),'DAG 截圖');
 t('排隊的 HTML 只顯示檔名與大小、可移除',()=>$$('#unitForm .ufile').length===2&&$('#unitForm .ufile').textContent.includes('causal-prep')&&!!$('#unitForm [data-updel="0"]'));
 click($('#saveUnit'));await sleep(400);
 const U1=S.units.find(u=>u.title==='因果推論預習包');
 t('Save：存卡片並上傳兩個 HTML 綁上去',()=>U1&&U1.date==='2026-10-20'&&U1.files.length===2&&'library/causal/causal-prep.html' in REPO&&'library/causal/slides.html' in REPO&&U1.files.every(f=>/^f/.test(f.fid)));
 t('圖片上傳到 library/代碼/img/、存小說明',()=>U1.imgs.length===2&&U1.imgs.every(g=>/^library\/causal\/img\/u.+-i.+\.jpg$/.test(g.path)&&REPO[g.path]===JPG)&&U1.imgs.map(g=>g.cap).join('|')==='Figure 3.1|DAG 截圖');
 t('卡片上只顯示 🖼 小說明，不直接顯示大圖',()=>$$('#u-'+U1.id+' [data-uimg]').map(b=>b.textContent).join('|')==='🖼️ Figure 3.1|🖼️ DAG 截圖'&&!$('#u-'+U1.id+' img'));
 click($$('#u-'+U1.id+' [data-uimg]')[1]);await sleep(150);
 t('點了放大看，顯示小說明與張數',()=>$('#imgv').classList.contains('on')&&$('#ivCap').textContent.includes('DAG 截圖')&&$('#ivCap').textContent.includes('2 / 2')&&!!$('#ivImg').getAttribute('src'));
 click($('#ivNext'));await sleep(100);
 t('下一張會繞回第一張',()=>$('#ivCap').textContent.includes('Figure 3.1'));
 click($('#imgv'));
 t('點背景關閉',()=>!$('#imgv').classList.contains('on'));
 t('上傳完表單收起',()=>$('#unitForm').style.display==='none');
 t('說明用 Markdown 顯示',()=>$('#u-'+U1.id+' .unote strong').textContent==='非同步');
 click($('#addUnitBtn'));click($('#saveUnit'));
 t('標題必填',()=>toastTxt().includes('標題'));click($('#addUnitBtn'));
 t('＋ 再按一次收起表單',()=>$('#unitForm').style.display==='none');
 t('依日期新到舊',()=>$$('#unitList .uti').map(x=>x.textContent).join('|')==='因果推論預習包|W7 DAG 與 confounding');
 t('HTML 和圖片都是同一排小標籤，沒有 ↗',()=>$$('#u-'+U1.id+' .uimgs .uimg').length===4&&$$('#u-'+U1.id+' .uimg.uhtml[data-ufopen]').length===2&&!$('#u-'+U1.id+' [data-ufnew]')&&!html.includes('data-ufnew'));
 t('右欄一列兩張（手機一列一張）',()=>/#unitList\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(html)&&/@media\(max-width:700px\)\{#unitList\{grid-template-columns:minmax\(0,1fr\)\}\}/.test(html));
 click($('#u-'+U1.id+' [data-uedit]'));
 t('✎ 編輯框列出已綁的 HTML（可長按解除）與上傳區',()=>$$('#unitForm .ufile').length===2&&!!$('#unitForm .ufile [data-hold^="ufile|"]')&&!!$('#unitForm [data-adrop]'));
 t('✎ 編輯框列出圖片：縮圖、可改小說明、可長按移除',()=>$$('#unitForm .uirow').length===2&&!!$('#unitForm [data-hold^="uimg|"]'));
 type($('#unitForm [data-ucap="'+U1.imgs[0].iid+'"]'),'Figure 3.1（ME p.109）');click($('#saveUnit'));await sleep(200);
 t('改小說明存回去',()=>U1.imgs[0].cap==='Figure 3.1（ME p.109）');
 click($('#u-'+U1.id+' [data-uedit]'));
 const pasteEv=new A.Event('paste',{bubbles:true});
 pasteEv.clipboardData={items:[{kind:'file',type:'image/png',getAsFile:()=>new A.File(['x'],'s.png',{type:'image/png'})}]};
 A.eval('window.__shr=libShrink;libShrink=()=>Promise.resolve("data:image/jpeg;base64,'+JPG+'")');
 $('#unitForm [data-ud="note"]').dispatchEvent(pasteEv);await sleep(100);
 t('在說明框貼上圖片會加進圖片區',()=>$$('#unitForm .uirow').length===3);
 click($('#cancelUnit'));
 await A.eval(`doHold('uimg|${U1.id}~'+S.units.find(u=>u.id==='${U1.id}').imgs[1].iid)`);
 t('長按 ✕ 從卡片移除圖片（repo 檔還在）',()=>U1.imgs.length===1&&Object.keys(REPO).filter(p=>p.includes('/img/')).length===2);
 A.eval(`ufBind(S.units.find(u=>u.id==='${U1.id}'),'courses/causal/old.html')`);
 await A.eval(`doHold('ufile|'+S.units.find(u=>u.title==='因果推論預習包').files[2].fid)`);
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
 t('滑鼠停在 📄 上看得到同步時間',()=>/上次同步 \d+\/\d+ \d\d:\d\d/.test($('#u-'+U1.id+' [data-ufopen]').title));
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
 A.eval("libPick('ucA');renderLib()");
 await A.eval("doHold('ucourse|ucA')");
 t('還有卡片的主題不能刪',()=>S.ucourses.some(x=>x.id==='ucA')&&toastTxt().includes('還有 2 張卡片'));
 await A.eval(`doHold('unit|uOld')`);
 t('刪卡片進回收桶',()=>!S.units.some(u=>u.id==='uOld')&&S.trash[0].type==='unit');
 click(D.querySelector(`[data-undel="${S.trash[0].tid}"]`));
 t('從回收桶還原',()=>S.units.some(u=>u.id==='uOld'));

 // ── 清理、HELP ──
 t('沒有指定閱讀與 Textbooks 跳轉的程式',()=>!html.includes('data-tbgo')&&!html.includes('tbGuess'));
 t('orphUsed 含 Library 綁的 HTML',()=>{const u=A.eval('orphUsed()');return u.has('library/causal/causal-prep.html')&&u.has('papers/a.html')});
 await A.eval('orphScan()');
 const op=A.eval('orphans').map(o=>o.path).sort().join('|');
 t('清理列出沒人指向的 HTML 與 Library 圖片（.data.json 不列）',()=>op===['library/causal/slides.html','library/causal/unused.html',U1.imgs.length?Object.keys(REPO).find(p=>p.includes('/img/')&&p!==U1.imgs[0].path):''].sort().join('|')||op);
 const hb=$('#helpBox').innerHTML;
 t('版本標示 1.2',()=>$('#appVer').textContent.includes('Epi_Yaxin 1.2'));
 t('Settings 說明補上 Library',()=>$('#tipGh').textContent.includes('library/')&&$('#tipData').textContent.includes('不含檔案')&&$('#tipClean').textContent.includes('Library'));
 t('使用說明：資料夾圖有 library/、沒有 Guide、Textbooks 改 📕',()=>{const h=$('#helpBox').innerHTML;return h.includes('<code>library/代碼/</code>')&&h.includes('<code>tests/</code>')&&!h.includes('Guide')&&h.includes('<summary>📕 Textbooks</summary>')});
 t('HELP：📚 Library、八個分頁、同步說明、沒有 Guide',()=>hb.includes('<summary>📚 Library</summary>')&&hb.includes('八個分頁在做什麼')&&hb.includes('.data.backup-日期.json')&&!hb.includes('📑 Guide')&&!/<strong>Guide<\/strong>/.test(hb));

 // ── 1.1：Review 開關 ──
 const DAY=864e5,T0=Date.now();
 A.eval(`S.cards.push(
   {id:'rv1',created:${T0-30*DAY},q:'未來卡',a:'x',theme:-1,links:[],level:2,due:${T0-10*DAY+2*DAY},last:${T0-20*DAY},n:2},
   {id:'rv2',created:${T0-30*DAY},q:'到期卡',a:'y',theme:-1,links:[],level:0,due:${T0-11*DAY},last:null,n:0},
   {id:'rv3',created:${T0-3*DAY},q:'暫停中新增',a:'z',theme:-1,links:[],level:0,due:${T0-3*DAY},last:null,n:0},
   {id:'rv4',created:${T0-30*DAY},q:'考古',a:'w',theme:-1,links:[],level:0,due:null,last:null,n:0,past:true});
   renderCards();updateBadge()`);
 const badge=()=>{const b=D.querySelector('.tab[data-p="review"] .badge');return b?+b.textContent:0};
 const sw=$('#revSw');
 t('開關預設打開（role=switch、綠色那種）',()=>sw&&sw.getAttribute('role')==='switch'&&sw.getAttribute('aria-checked')==='true'&&S.revOn!==false);
 const b0=badge();
 t('打開時分頁有紅點、DUE TODAY 顯示',()=>b0>=2&&$('#revDue').style.display===''||('badge '+b0));
 click(sw);
 t('關掉：沒有紅點、收起 DUE TODAY、記下暫停時間',()=>badge()===0&&$('#revDue').style.display==='none'&&S.revOn===false&&S.revOffAt>0&&$('#revState').textContent.includes('已暫停')||[badge(),$('#revDue').style.display,S.revOn].join());
 t('暫停時卡片不能按會／不會、倒數凍結',()=>{A.eval("flipped.add('rv1');renderCards()");const it=D.querySelector('[data-flip="rv1"]');
   return !it.querySelector('[data-grade]')&&it.textContent.includes('⏸')});
 t('暫停時 Exam mode 照樣在',()=>!!D.querySelector('#p-review details.fold #startExam')&&D.querySelector('#p-review details.fold').style.display!=='none');
 t('暫停狀態寫進存檔（會同步）',()=>{A.eval('save()');return true});
 // 假裝暫停了 10 天
 A.eval(`S.revOffAt=${T0-10*DAY}`);
 const bef={rv1:S.cards.find(c=>c.id==='rv1').due,rv2:S.cards.find(c=>c.id==='rv2').due,rv3:S.cards.find(c=>c.id==='rv3').due};
 click(sw);
 const C1=S.cards.find(c=>c.id==='rv1'),C2=S.cards.find(c=>c.id==='rv2'),C3=S.cards.find(c=>c.id==='rv3'),C4=S.cards.find(c=>c.id==='rv4');
 const near=(a,b)=>Math.abs(a-b)<5000;
 t('打開：到期日順延暫停的 10 天',()=>near(C1.due,bef.rv1+10*DAY)&&near(C2.due,bef.rv2+10*DAY)||[C1.due-bef.rv1,C2.due-bef.rv2].join());
 t('暫停中新增的卡只順延自己存在的天數',()=>near(C3.due,bef.rv3+3*DAY)||(C3.due-bef.rv3));
 t('考古卡不動、順延的卡蓋了 mtime',()=>C4.due===null&&C1.mtime>=T0&&C2.mtime>=T0);
 t('打開後：未來卡還沒到期、到期卡仍到期，紅點回來',()=>{const due=A.eval('dueCards()').map(c=>c.id);return !due.includes('rv1')&&due.includes('rv2')&&due.includes('rv3')&&badge()===due.length||due.join()});
 t('revAt 有記、revOffAt 清掉',()=>S.revOn===true&&S.revOffAt===0&&S.revAt>=T0);
 A.eval(`mergeState({revOn:false,revOffAt:${T0},revAt:${T0+60000}})`);
 t('合併：較新的開關狀態蓋過來',()=>S.revOn===false&&S.revOffAt===T0);
 A.eval(`mergeState({revOn:true,revOffAt:0,revAt:${T0-60000}})`);
 t('合併：較舊的開關狀態不理',()=>S.revOn===false);
 A.eval('S.revOn=true;S.revOffAt=0;renderCards();updateBadge()');
 A.eval("const c=S.cards.find(x=>x.id==='rv2');c.mtime=1;gradeCard(c,true)");
 t('評分會蓋 mtime（另一台合併才拿得到）',()=>S.cards.find(c=>c.id==='rv2').mtime>=T0);
 A.eval(`mergeState({cards:[Object.assign({},S.cards.find(c=>c.id==='rv2'),{level:0,mtime:5})]})`);
 t('舊的評分不會蓋掉新的',()=>S.cards.find(c=>c.id==='rv2').level===1);

 // ── 1.1：Notes 空內容的紅點 ──
 const EX=A.eval('EXAM');
 A.eval(`S.notes.push({id:'nE1',created:${T0},mtime:${T0},title:'空的',body:'',cat:S.qcats[0].id,tags:[],links:[]},
   {id:'nE2',created:${T0},mtime:${T0},title:'有內容',body:'寫了',cat:S.qcats[0].id,tags:[],links:[]},
   {id:'nE3',created:${T0},mtime:${T0},title:'考古沒答案',body:'  ',kind:'${EX}',cat:'${EX}',tags:[],links:[]});renderNt()`);
 const dot=id=>{const r=D.querySelector('[data-ntcard="'+id+'"] .ck');return r?r.getAttribute('style'):'none'};
 t('內容空的 ● 是酒紅色',()=>dot('nE1').includes('var(--wine)')||dot('nE1'));
 t('有內容的 ● 是灰色',()=>dot('nE2').includes('var(--faint)')||dot('nE2'));
 t('資格考沒答案也是酒紅色、提示「還沒寫答案」',()=>dot('nE3').includes('var(--wine)')&&D.querySelector('[data-ntcard="nE3"] .ck').title==='還沒寫答案'||dot('nE3'));
 t('--wine 有定義',()=>html.includes('--wine:#8A2E3B'));

 // ── 1.1：使用說明與 Library 說明 ──
 const hb2=$('#helpBox').innerHTML;
 t('說明全用列點與表格（沒有段落）',()=>(hb2.match(/<p[ >]/g)||[]).length===0&&(hb2.match(/<table>/g)||[]).length>=15&&(hb2.match(/<ul>/g)||[]).length>=20||[(hb2.match(/<p[ >]/g)||[]).length,(hb2.match(/<table>/g)||[]).length]);
 t('說明有每日複習開關與酒紅 ●',()=>hb2.includes('每日複習開關')&&hb2.includes('暫停期間不算天數')&&hb2.includes('● 是酒紅色'));
 t('說明拿掉過時內容',()=>!hb2.includes('完全沙箱化')&&!hb2.includes('跟著回收桶存 30 天')&&!hb2.includes('換版本是不同儲存空間')&&!hb2.includes('共通操作')&&!hb2.includes('手動</strong> commit'));
 t('說明有 ② 精讀 HTML 上傳、墓碑 180 天',()=>hb2.includes('② 精讀 HTML')&&hb2.includes('180 天'));
 t('全站沒有不帶 FE0F 的 ☁',()=>!/☁(?!️)/.test(D.documentElement.innerHTML)||'有');
 t('檢視器同步鈕是 ☁️',()=>$('#uvSync').textContent==='☁️');
 t('Library ⓘ：長按 ✕ 移除、圖片在 img/',()=>$('#tipLib').textContent.includes('長按 ✕ 從卡片移除')&&$('#tipLib').innerHTML.includes('<code>library/代碼/img/</code>'));

 // ── 1.2：＋ 空白筆記頁 ──
 A.eval("libPick('ucA');renderLib()");
 click($('#addUnitBtn'));await sleep(50);
 type($('#unitForm [data-ud="title"]'),'HBV 治療指引');
 click($('#unitForm [data-nbnew]'));await sleep(30);
 t('按 ＋ 空白筆記頁：出現名稱欄，預設帶卡片標題、沒有提示字',()=>{const x=$('#unitForm [data-nbname]');return !!x&&x.value==='HBV 治療指引'&&!x.hasAttribute('placeholder')});
 type($('#unitForm [data-nbname]'),'HBV Guideline 2025');
 click($('#unitForm [data-nbok]'));await sleep(200);
 const nb1=A.eval('upFiles').find(f=>f.nb);
 t('加入：排進上傳佇列，檔名用英文、模板填好名稱與新的資料庫',()=>!!nb1&&nb1.file==='hbv-guideline-2025.html'&&/"db":"nb-[a-z0-9]+"/.test(nb1.text)&&nb1.text.includes('"title":"HBV Guideline 2025"')&&nb1.text.includes('<title>HBV Guideline 2025</title>')&&!nb1.text.includes('__NB_DB__')||(nb1&&nb1.file));
 t('佇列裡顯示「新筆記頁 · 檔名」',()=>$('#unitForm').textContent.includes('新筆記頁 · hbv-guideline-2025.html'));
 click($('#unitForm [data-nbnew]'));type($('#unitForm [data-nbname]'),'肝炎筆記');click($('#unitForm [data-nbok]'));await sleep(200);
 click($('#unitForm [data-nbnew]'));type($('#unitForm [data-nbname]'),'肝炎筆記二');click($('#unitForm [data-nbok]'));await sleep(200);
 const nbs=A.eval('upFiles').filter(f=>f.nb).map(f=>f.file).join('|');
 t('中文名稱用 notebook.html，重複時加 -2',()=>nbs==='hbv-guideline-2025.html|notebook.html|notebook-2.html'||nbs);
 const db2=A.eval('upFiles').filter(f=>f.nb).map(f=>(f.text.match(/"db":"([^"]+)"/)||[])[1]);
 t('每一頁的資料庫名稱都不一樣',()=>new Set(db2).size===3);
 click($('#unitForm [data-nbnew]'));click($('#unitForm [data-nbx]'));
 t('取消：名稱欄收起來',()=>!$('#unitForm [data-nbname]')&&!!$('#unitForm [data-nbnew]'));
 click($('#saveUnit'));await sleep(500);
 const NBU=S.units.find(u=>u.title==='HBV 治療指引');
 t('Save：三頁都上傳到 library/causal/ 並綁在卡片上',()=>!!NBU&&NBU.files.length===3&&REPO['library/causal/hbv-guideline-2025.html']&&REPO['library/causal/notebook-2.html']&&REPO['library/causal/hbv-guideline-2025.html'].includes('epi-notebook'));
 t('模板本身沒有被改到（設定是空白的）',()=>TPL.includes('"db":"__NB_DB__"')&&TPL.includes('<script id="nb-seed" type="application/json">null</script>'));

 // ── 1.2：覆蓋同名 HTML 前另存 ──
 REPO['library/causal/over.html']='<html><body>v1</body></html>';SHA['library/causal/over.html']='ov1';
 REPO['library/causal/over.data.json']='{"v":1,"dbs":[{"name":"overDB"}]}';SHA['library/causal/over.data.json']='od1';
 const nOld=()=>Object.keys(REPO).filter(p=>/^library\/causal\/over\.old-\d{8}-\d{6}\.html$/.test(p));
 const nBak=()=>Object.keys(REPO).filter(p=>/^library\/causal\/over\.data\.backup-\d{8}-\d{6}\.json$/.test(p));
 click($('#addUnitBtn'));await sleep(30);type($('#unitForm [data-ud="title"]'),'覆蓋測試');
 A.eval(`ufAdd('over.html','<html><body>v2</body></html>',30)`);click($('#saveUnit'));await sleep(500);
 t('同檔名：舊版另存 .old-日期.html、頁面資料另存 .data.backup-日期.json，新版蓋上去',()=>nOld().length===1&&REPO[nOld()[0]].includes('v1')&&nBak().length===1&&REPO[nBak()[0]].includes('overDB')&&REPO['library/causal/over.html'].includes('v2')||[nOld().length,nBak().length,REPO['library/causal/over.html']].join());
 t('提示說舊版已另存',()=>toastTxt().includes('舊版已另存'));
 click($('#addUnitBtn'));await sleep(30);type($('#unitForm [data-ud="title"]'),'同內容');
 A.eval(`ufAdd('over.html','<html><body>v2</body></html>',30)`);click($('#saveUnit'));await sleep(500);
 t('內容一樣就不另存、也不重傳',()=>nOld().length===1&&nBak().length===1);
 t('.old 檔會出現在清理清單（沒有卡片指向）',()=>!A.eval('orphUsed()').has(nOld()[0]));

 // ── 1.2：頁面資料比雲端少一半以上先問 ──
 const BIG='x'.repeat(9000);
 A.eval(`(function(){const u=S.units.find(x=>x.title==='覆蓋測試');u.files.push({fid:'fbig',path:'library/causal/big.html',name:'big',at:1,dbs:['bigDB']});save()})()`);
 await idbPut(A,'bigDB','kv','doc',{schema:'epi-notebook',body:BIG});
 const bigDump=await A.eval(`idbDump(['bigDB'])`);
 const dpB='library/causal/big.data.json';
 REPO[dpB]=JSON.stringify({v:1,fid:'fbig',path:'library/causal/big.html',updated:1,dbs:bigDump});SHA[dpB]='bg1';
 A.eval(`libRec('fbig',{h:libHash(${JSON.stringify(bigDump)}),sha:'bg1',at:1})`);
 await idbPut(A,'bigDB','kv','doc',{schema:'epi-notebook',body:'small'});
 const cloud0=REPO[dpB];
 const q1=await A.eval(`libPush('fbig',{quiet:true})`);
 t('背景同步（quiet）：資料變少不上傳，回 shrink',()=>q1==='shrink'&&REPO[dpB]===cloud0||q1);
 const bakB=()=>Object.keys(REPO).filter(p=>/^library\/causal\/big\.data\.backup-/.test(p));
 let prB=A.eval(`libPush('fbig')`);await sleep(300);
 t('關閉時：跳出來問，說明少一半以上',()=>$('#libAsk').classList.contains('on')&&$('#libAskMsg').textContent.includes('少一半以上'));
 click($('#libAskCloud'));const r1=await prB;
 const back=await idbGet(A,'bigDB','kv','doc');
 t('選「用雲端的」：還原雲端那份、這台的另存備份、雲端不動',()=>r1==='pulled'&&back&&back.body===BIG&&REPO[dpB]===cloud0&&bakB().length===1&&REPO[bakB()[0]].includes('small')||[r1,back&&back.body.length,bakB().length].join());
 await sleep(1100);
 await idbPut(A,'bigDB','kv','doc',{schema:'epi-notebook',body:'small2'});
 prB=A.eval(`libPush('fbig')`);await sleep(300);click($('#libAskLocal'));const r2=await prB;
 t('選「用這台的」：上傳這台、雲端那份另存備份',()=>r2==='pushed'&&REPO[dpB].includes('small2')&&bakB().length===2&&bakB().some(p=>REPO[p].includes(BIG))||[r2,bakB().length].join());
 await idbPut(A,'bigDB','kv','doc',{schema:'epi-notebook',body:'small3'});
 const r3=await A.eval(`libPush('fbig',{quiet:true})`);
 t('雲端本來就小（< 4 KB）時照常上傳',()=>r3==='pushed'&&REPO[dpB].includes('small3')||r3);

 // ── 1.2：說明 ──
 const hb3=$('#helpBox').innerHTML;
 t('Library ⓘ 有 ＋ 空白筆記頁、舊版另存、少一半先問',()=>$('#tipLib').textContent.includes('＋ 空白筆記頁')&&$('#tipLib').innerHTML.includes('.old-日期.html')&&$('#tipLib').textContent.includes('少一半以上'));
 t('使用說明有 📓 筆記頁、.old-日期.html、少一半以上、templates/README.md',()=>hb3.includes('📓 筆記頁')&&hb3.includes('.old-日期.html')&&hb3.includes('少一半以上')&&hb3.includes('templates/README.md'));
 t('清理說明提到 .old 檔',()=>$('#tipClean').innerHTML.includes('.old-日期.html'));
 t('全分頁可切換',()=>{$$('#tabs button').forEach(b=>click(b));return A.__errs.length===0||A.__errs.join('|')});
 await sleep(400);
 const sv=JSON.parse(A.localStorage.getItem('epi-yaxin'));
 t('寫進 localStorage（dbs 記在卡片上，會跟 notes.json 同步）',()=>sv.units.some(u=>u.files.some(f=>f.dbs.includes('causalPrep'))));
 t('沒有執行期錯誤',()=>(A.__errs.length===0&&B.__errs.length===0)||A.__errs.concat(B.__errs).join('\n'));
 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 const p=R.filter(r=>r[0]==='PASS').length;console.log(`通過 ${p}/${R.length}`);process.exit(p===R.length?0:1);
})();
