# Epi_Yaxin 測試

給 Claude 用的回歸測試（jsdom＋Playwright Chromium）。測試會讀 `/home/claude/index.html`，要在 `/home/claude` 執行。

```bash
cp tests/*.js tests/runall.sh /home/claude/ && cp index.html /home/claude/index.html
cd /home/claude && npm i jsdom playwright fake-indexeddb
./runall.sh            # 每支印出「通過 N/N」或 ✓ 全部合格
```

- `lshot.js` 是 Library 兩台裝置實測，需要另外開 http.server（/home/claude/serve/，放 index.html 與 causal-prep.html；測試圖片會自動產生），見交接文件。
- Chromium 用預裝的，不要跑 `playwright install`。
