// v47：Notes 的「資格考」分類 → 出處／Textbooks 主題 → 寫好答案自動送 Review 考古卡（不進排程，Exam mode 只跑考古題）
const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const now=Date.now();
const OLD={v:1,papers:[],mt:[],dirs:[],imgs:{},courses:[],classes:[],trash:[],tomb:{},kd:[],prog:[],
  qcats:[{id:'mine',name:'Mine',col:'#7A5AA8',soft:'#EDE6F7'},{id:'study',name:'Study',col:'#2E5FB0',soft:'#DEE9F7'},{id:'kold',name:'資格考',col:'#1F6B6B',soft:'#E2EFEE'}],
  qs:[{id:'q1',created:now,kind:'mine',q:'一般問題',a:'',done:false,links:[],tags:[]}],
  notes:[{id:'old1',created:now-9000,mtime:now-9000,title:'舊版記的考古題',body:'',kind:'kold',links:[],tags:[]},
         {id:'n0',created:now-8000,mtime:now-8000,title:'一般筆記',body:'內容',kind:'study',links:[],tags:[]}],
  cards:[{id:'c0',created:now-1,q:'一般卡',a:'a',theme:5,links:[],level:0,due:now-1,last:null,n:0}]};
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){w.localStorage.setItem('epi-yaxin',JSON.stringify(OLD));
    w.fetch=()=>Promise.reject(new Error('x'));w.scrollTo=()=>{};
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const $=s=>D.querySelector(s),$$=s=>[...D.querySelectorAll(s)];
 const click=el=>el.dispatchEvent(new W.MouseEvent('click',{bubbles:true}));
 const type=(el,v)=>{el.value=v;el.dispatchEvent(new W.Event('input',{bubbles:true}))};
 const change=(el,v)=>{el.value=v;el.dispatchEvent(new W.Event('change',{bubbles:true}))};
 const N=id=>S.notes.find(x=>x.id===id),toastTxt=()=>D.getElementById('toast').textContent;
 const CONF=W.eval("C.findIndex(c=>c.en==='Confounding')");

 // ── 分類 ──
 t('內建分類「資格考」存在（id exam）',()=>S.qcats.some(x=>x.id==='exam'&&x.name==='資格考'));
 t('舊版自建的「資格考」：筆記移到內建分類、舊分類刪掉',()=>N('old1').kind==='exam'&&!S.qcats.some(x=>x.id==='kold'));
 t('只有一個叫資格考的分類',()=>S.qcats.filter(x=>x.name==='資格考').length===1);
 t('資格考不能刪（列在 DEFAULT_QCATS）',()=>W.eval("DEFAULT_QCATS.some(x=>x.id==='exam')"));
 t('Notes 新增下拉有資格考',()=>[...$('#nt-kind').options].some(o=>o.value==='exam'));
 t('Questions 新增下拉沒有資格考',()=>![...$('#q-kind').options].some(o=>o.value==='exam'));
 click($('[data-qedit="q1"]'));
 t('Questions 卡片內下拉也沒有資格考',()=>![...$('[data-qk="q1"]').options].some(o=>o.value==='exam'));
 t('QUESTIONS 標題列仍只有 ＋',()=>{const h=$$('#p-courses .blockhead')[0];return !h.querySelector('.seg')&&!!h.querySelector('#addQBtn')});
 t('標籤列沒有考古題篩選鈕',()=>!$('#ntagbar [data-npast]')&&!src.includes('data-npast'));
 t('Textbooks 沒有「考古 N」',()=>!src.includes('data-pastgo'));

 // ── 新增表單 ──
 click($('#addNtBtn'));
 t('一般分類：不顯示出處與主題，欄名是標題／內容',()=>$('#ntExamBox').style.display==='none'&&$('#ntTitleLb').textContent==='標題'&&$('#ntBodyLb').textContent==='內容／備忘');
 change($('#nt-kind'),'exam');
 t('選資格考：跳出出處與 Textbooks 主題',()=>$('#ntExamBox').style.display===''&&!!$('#nt-psrc')&&!!$('#nt-tb'));
 t('欄名改成題目／答案',()=>$('#ntTitleLb').textContent==='題目'&&$('#ntBodyLb').textContent==='答案');
 t('主題下拉照書的章節順序、第一項未指定',()=>{const o=[...$('#nt-tb').options];return o[0].value===''&&o.length===W.eval('C.length')+1&&o[1].value===W.eval('C[bookOrder()[0]].en')});
 t('ⓘ 說明預設收起',()=>!$('#tipExam').classList.contains('on'));
 click($('#ntExamBox [data-tip="tipExam"]'));
 t('點 ⓘ 展開說明',()=>$('#tipExam').classList.contains('on'));
 change($('#nt-kind'),'mine');
 t('改回一般分類就收起',()=>$('#ntExamBox').style.display==='none'&&$('#ntTitleLb').textContent==='標題');
 change($('#nt-kind'),'exam');

 // 沒答案：不送卡
 const nc0=S.cards.length;
 $('#nt-title').value='老師說考過：什麼是 collider？';$('#nt-psrc').value='高流方法 W8 陳老師 10/20';$('#nt-tb').value='Selection Bias';
 click($('#addNt'));
 const a=S.notes[S.notes.length-1];
 t('存入 kind／psrc／tb',()=>a.kind==='exam'&&a.psrc==='高流方法 W8 陳老師 10/20'&&a.tb==='Selection Bias');
 t('沒寫答案不會送到 Review',()=>S.cards.length===nc0&&!a.cid);
 t('表單清空',()=>$('#nt-psrc').value===''&&$('#nt-tb').value===''&&$('#nt-title').value==='');

 // 有答案：自動送卡
 click($('#addNtBtn'));change($('#nt-kind'),'exam');
 $('#nt-title').value='confounding 的三個條件';$('#nt-body').value='1. 與暴露有關\n2. 與結果有關\n3. 不在因果路徑上';
 $('#nt-psrc').value='高流方法 W6';$('#nt-tb').value='Confounding';
 click($('#addNt'));
 const b=S.notes[S.notes.length-1],cb=()=>S.cards.find(x=>x.id===b.cid);
 t('有答案：自動產生考古卡',()=>!!cb()&&S.cards.length===nc0+1);
 t('考古卡內容：題目→正面、答案→背面、主題、past、nid',()=>{const c=cb();return c.q==='confounding 的三個條件'&&c.a.startsWith('1. 與暴露')&&c.theme===CONF&&c.past===true&&c.nid===b.id});
 t('提示已送到 Review',()=>toastTxt().includes('考古卡'));
 t('一般分類有內容也不會自動送',()=>{click($('#addNtBtn'));change($('#nt-kind'),'study');$('#nt-title').value='x';$('#nt-body').value='y';click($('#addNt'));return S.cards.length===nc0+1});

 // ── 不進排程 ──
 W.eval('renderCards()');
 t('考古卡不算在 DUE TODAY',()=>$('#dueCount').textContent==='1'&&W.eval('dueCards()').every(c=>!c.past));
 t('Review 分頁徽章只算一般卡',()=>$('.tab[data-p="review"] .badge').textContent==='1');
 const it=()=>$$('#cardList .item').find(x=>x.textContent.includes('confounding 的三個條件'));
 t('考古卡顯示 🎓 考古、不顯示到期與等級',()=>it().textContent.includes('🎓 考古')&&!it().textContent.includes('今天要複習')&&!it().textContent.includes('Lv'));
 click(it());
 t('翻面後沒有會／不會按鈕',()=>it().querySelector('.ans')&&!it().querySelector('[data-grade]'));
 t('Due first 排序時考古卡排最後',()=>{W.eval("cardSort='due';renderCards()");const L=$$('#cardList .item');return L[L.length-1].textContent.includes('confounding 的三個條件')});

 // ── 筆記顯示 ──
 W.eval(`openNt.add('${b.id}');renderNt()`);
 const card=()=>$(`#ntList .item[data-ntcard="${b.id}"]`);
 t('筆記上顯示 🎓 考古卡、主題、出處',()=>{const m=card().querySelector('.qpast');return m&&m.textContent.includes('🎓 考古卡')&&m.textContent.includes('Confounding')&&m.textContent.includes('高流方法 W6')});

 // ── 編輯：改答案同步 ──
 click(card().querySelector('[data-ntedit]'));
 t('編輯框：題目／答案欄名、出處、主題',()=>{const e=card().querySelector('.editbox');return e.textContent.includes('題目')&&e.textContent.includes('答案')&&!!e.querySelector(`[data-ntf="${b.id}|psrc"]`)&&!!e.querySelector(`[data-nttb="${b.id}"]`)});
 t('資格考筆記不顯示 ↑ Card',()=>!card().querySelector('[data-ntc]'));
 type(card().querySelector(`[data-ntf="${b.id}|body"]`),'新答案：三條件');
 change(card().querySelector(`[data-nttb="${b.id}"]`),'Cohort Studies');
 t('改主題寫入筆記',()=>b.tb==='Cohort Studies');
 t('還沒按完成，卡片不變',()=>cb().a.startsWith('1. 與暴露'));
 click(card().querySelector(`[data-ntsave="${b.id}"]`));
 t('按完成：同一張卡同步更新（不新增）',()=>cb().a==='新答案：三條件'&&cb().theme===W.eval("C.findIndex(c=>c.en==='Cohort Studies')")&&S.cards.filter(c=>c.past).length===1);
 t('提示同步更新',()=>toastTxt().includes('同步'));
 // ✓ 也會同步
 click(card().querySelector('[data-ntedit]'));
 type(card().querySelector(`[data-ntf="${b.id}|title"]`),'confounding 三條件（改）');
 click(card().querySelector('[data-ntedit]'));
 t('按 ✓ 也會同步',()=>cb().q==='confounding 三條件（改）');
 // 舊筆記改成有答案 → 送卡
 W.eval(`openNt.add('${a.id}');editNt.add('${a.id}');renderNt()`);
 type($(`[data-ntf="${a.id}|body"]`),'collider 答案');
 click($(`[data-ntsave="${a.id}"]`));
 t('原本沒答案的，補上答案按完成就送卡',()=>!!a.cid&&S.cards.some(c=>c.id===a.cid&&c.past&&c.theme===W.eval("C.findIndex(c=>c.en==='Selection Bias')")));
 // 一般筆記改成資格考
 W.eval(`openNt.add('n0');editNt.add('n0');renderNt()`);
 change($('[data-ntk="n0"]'),'exam');
 t('一般筆記改分類成資格考：出現出處與主題',()=>!!$('[data-nttb="n0"]'));
 click($('[data-ntsave="n0"]'));
 t('按完成就送卡',()=>!!N('n0').cid&&S.cards.filter(c=>c.past).length===3);

 // ── 刪卡後不重建 ──
 const delId=a.cid;
 await W.eval('doHold')('card|'+delId);
 W.eval(`editNt.add('${a.id}');renderNt()`);
 type($(`[data-ntf="${a.id}|body"]`),'collider 答案 v2');
 click($(`[data-ntsave="${a.id}"]`));
 t('考古卡刪掉後不會自動重建',()=>!S.cards.some(c=>c.nid===a.id));

 // ── Exam mode ──
 W.eval('renderCards()');
 const run=()=>W.eval('queue').map(x=>x.id);
 t('Exam mode 有「只跑考古題」與數量',()=>$('#examPast')&&$('#examPastN').textContent==='2');
 t('主題列顯示一般數 · 考古數',()=>{const l=$$('#examThemes label').find(x=>x.textContent.includes('Cohort Studies'));return l&&l.querySelector('.ct').textContent==='0 · 考古 1'});
 click($('#startExam'));
 t('什麼都沒選：提示',()=>toastTxt().includes('只跑考古題'));
 $('#examPast').checked=true;click($('#startExam'));
 t('只勾考古題：跑全部考古卡',()=>{const r=run();return r.length===2&&r.every(id=>S.cards.find(c=>c.id===id).past)&&W.eval('examMode')===true});
 t('考試畫面顯示 🎓 考古',()=>$('#ovTheme').textContent.startsWith('🎓 考古'));
 const before=JSON.stringify(S.cards.map(c=>[c.id,c.level,c.due,c.n]));
 click($('#ovShow'));click($('#ovGood'));
 t('Exam 作答不改任何卡的排程',()=>JSON.stringify(S.cards.map(c=>[c.id,c.level,c.due,c.n]))===before);
 click($('#ovClose'));W.eval('renderCards()');
 $('#examPast').checked=true;$$('#examThemes input').find(x=>+x.value===W.eval("C.findIndex(c=>c.en==='Cohort Studies')")).checked=true;click($('#startExam'));
 t('考古＋主題：只跑該主題的考古卡',()=>{const r=run();return r.length===1&&r[0]===b.cid});
 click($('#ovClose'));W.eval('renderCards()');
 $('#examPast').checked=false;$$('#examThemes input').find(x=>+x.value===5).checked=true;click($('#startExam'));
 t('沒勾考古：只跑選定主題的一般卡',()=>{const r=run();return r.length===1&&r[0]==='c0'});
 click($('#ovClose'));
 click($('#startReview'));
 t('Start review 只跑到期的一般卡',()=>{const r=run();return r.length===1&&r[0]==='c0'});
 click($('#ovClose'));

 // ── 搜尋 ──
 W.eval("setSearch('陳老師')");
 t('Notes 搜尋比對出處',()=>W.eval('S.notes.filter(ntHit).length')===1);
 W.eval("setSearch('世代追蹤')");
 t('Notes 搜尋比對主題中文名',()=>W.eval('S.notes.filter(ntHit).length')===1);
 W.eval("setSearch('')");
 t('卡片搜尋可用「考古」',()=>{W.eval("qCard='考古';renderCards()");const n=$$('#cardList .item').length;W.eval("qCard='';renderCards()");return n===2});

 // ── 同步合併 ──
 const inc=JSON.parse(JSON.stringify(S));inc.qcats=inc.qcats.filter(x=>x.id!=='exam');
 W.eval('mergeState')(inc);
 t('合併來自舊裝置（沒有資格考分類）不會弄丟內建分類',()=>S.qcats.filter(x=>x.id==='exam').length===1);

 // ── HELP ──
 t('HELP 有資格考說明',()=>src.includes('<h4>資格考（考古題）</h4>'));
 t('HELP Review 有考古卡說明',()=>src.includes('🎓 考古卡</strong>由 Notes'));
 t('HELP 修正為退兩級',()=>src.includes('答「不會」退兩級')&&!src.includes('答「不會」歸零'));

 await sleep(400);
 const sv=JSON.parse(W.localStorage.getItem('epi-yaxin'));
 t('寫進 localStorage',()=>sv.notes.some(n=>n.kind==='exam'&&n.cid)&&sv.cards.some(c=>c.past)&&sv.qcats.some(x=>x.id==='exam'));
 t('沒有執行期錯誤',()=>errs.length===0||errs.join('\n'));
 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 const p=R.filter(r=>r[0]==='PASS').length;console.log(`通過 ${p}/${R.length}`);process.exit(p===R.length?0:1);
},1200);
