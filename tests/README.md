# Epi_Yaxin 測試

給 Claude 用的回歸測試（jsdom＋Playwright Chromium）。測試會讀 `/home/claude/index.html`，要在 `/home/claude` 執行。

```bash
cp tests/*.js tests/runall.sh /home/claude/ && cp index.html /home/claude/index.html
cd /home/claude && npm i jsdom playwright fake-indexeddb
./runall.sh            # 每支印出「通過 N/N」或 ✓ 全部合格
```

- `lshot.js` 是 Library 兩台裝置實測，需要另外開 http.server（/home/claude/serve/，放 index.html 與 causal-prep.html；測試圖片會自動產生），見交接文件。
- `rshot.js` 是 1.1 的 Chromium 截圖檢查（Review 開關、Notes 酒紅 ●、使用說明表格不超寬），單獨跑 `node rshot.js`。
- `nshot.js` 是 1.2 的筆記頁實機（兩台裝置）：app 裡「＋ 空白筆記頁」→ 頁面裡加卡片 → 同步 → 另一台還原 → 重新上傳同檔名不掉資料。和 lshot 一樣開 http.server（/home/claude/serve/ 要有 index.html 與 templates/notebook.html），CDN 的 marked／dompurify／katex 從 node_modules 供應（`npm i marked@12.0.2 dompurify@3.1.6 katex@0.16.9`）。
- 最新一支版本測試是 `t34.js`（1.2），會讀 repo 的 `templates/notebook.html`。
- Chromium 用預裝的，不要跑 `playwright install`。
