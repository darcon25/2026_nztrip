# Zeabur 部署教學

> 用途：把這個網站從「只有前端能動的 Vercel」搬到 Zeabur，讓照片、留言、分帳、自煮分工這些需要後端的功能全部正常運作，資料也不會因為重新部署而消失。
> **現況（2026-07-21）：已經照本文件部署成功，網站正式網址是 https://2026nztrip.zeabur.app/ ，前後端、資料庫、Google 地圖照片都已實測正常。**這份文件同時是「怎麼從零架設」跟「以後怎麼更新部署」的操作手冊。

## ⚠️ 最重要的一件事：這個專案不能用 Zeabur「直接讀 GitHub repo 自動建置」的標準流程

實測踩了三個坑才找到真正能動的做法，詳細除錯過程記在最下面「除錯記錄」，這裡直接講結論：

**Zeabur 只要偵測到專案裡有 Vite（前端框架），不管有沒有 Dockerfile、不管設什麼環境變數，都會把它強制當成「純靜態網站」部署**——它會另外拉一個 `zeabur/caddy-static` 執行期映像來服務，完全略過 `server.ts` 這個後端，`/api/*` 全部的功能都會壞掉，而且**沒有任何官方支援的設定可以關掉這個行為**（`ZBPACK_PLAN_TYPE=nodejs` 環境變數、加 Dockerfile、改輸出資料夾名稱，全部試過都沒用）。

**唯一能動的解法：跳過 Zeabur 自己的建置流程，改成「本機把 Docker image 建好，推到 GitHub 的容器倉庫（ghcr.io），讓 Zeabur 直接抓建好的映像檔來跑」**。這樣 Zeabur 完全不會跑它自己那套「偵測框架」的邏輯，因為它只是把現成的容器抓下來執行。

**這個做法的代價**：以後每次程式碼有改動，不能只靠「git push 到 GitHub」讓 Zeabur 自動部署——**要多一個「本機重新建置 image、推上 ghcr.io、回 Zeabur 點一次更新映像」的手動步驟**（見下方「以後怎麼更新部署」）。這是這個專案架構（Vite + 自訂 Express 後端混合在一起）目前唯一找得到的可行解，除非以後想把前後端拆開分別部署，或整個改寫成別種架構。

## 名詞白話解釋

- **Docker image（映像檔）**：把整個網站（程式碼＋跑起來需要的環境）打包成一個檔案，到哪裡都能用同一份指令跑起來，不用擔心「我電腦上可以跑、伺服器上卻不行」。
- **Container Registry（容器倉庫）**：存放 Docker image 的地方，這裡用 GitHub 免費提供的 `ghcr.io`。
- **Volume（永久儲存空間）**：一塊「不會因為重新部署就被清空」的硬碟空間，資料庫檔案跟大家上傳的照片要放在這裡才不會不見。
- **環境變數（Environment Variables）**：不寫在程式碼裡、部署時另外設定的密碼/設定值（例如 API 金鑰）。

## 從零架設的步驟

### 1. 本機把 Docker image 建好、推到 ghcr.io

在專案目錄（`~/Projects/2026_nztrip` 或 worktree）底下：

```bash
# 登入 ghcr.io（需要 GitHub 帳號有 write:packages 權限，見下方「權限」說明）
gh auth token | docker login ghcr.io -u darcon25 --password-stdin

# 建置：一定要加這兩組參數，缺一不可
docker build --platform linux/amd64 --provenance=false --sbom=false \
  -t ghcr.io/darcon25/2026_nztrip:latest .

# 推上去
docker push ghcr.io/darcon25/2026_nztrip:latest
```

**這兩組參數為什麼缺一不可**（都是實測踩過的坑，見下方除錯記錄）：
- `--platform linux/amd64`：如果在 Apple Silicon（M 系列）Mac 上建置，Docker 預設會建出 ARM64 架構的映像檔，但 Zeabur 的伺服器是 x86_64（amd64）架構，架構不合的話容器完全開不起來，錯誤訊息是 `exec format error`。
- `--provenance=false --sbom=false`：新版 Docker 預設會在映像檔裡多包一份「來源證明」的中繼資料，Zeabur 用的容器執行環境認不得這種格式，拉取映像檔時會直接回 `NotFound`。

**權限**：第一次操作如果 `docker push` 出現 `permission_denied`，代表 GitHub token 沒有 `write:packages` 權限，執行：
```bash
gh auth refresh -h github.com -s write:packages,read:packages
```
會給一組一次性代碼跟一個網址，去 https://github.com/login/device 輸入代碼、按 Authorize 授權（這步必須本人親自操作，沒辦法代勞）。

### 2. 把 GitHub 套件設成公開

推上去的 image 預設是「私有」，Zeabur 抓不到（除非額外設定登入資訊，比較麻煩）。改成公開最簡單：

- 打開 https://github.com/darcon25?tab=packages
- 點進 `2026_nztrip` 這個套件
- 右側「Package settings」→ 拉到最下面「Danger Zone」→「Change package visibility」→ 選 Public
- 輸入 `2026_nztrip` 確認（這步系統會要求本人親自打字確認，沒辦法代勞）

這個 image 裡沒有放任何密鑰（`.env.local`、API 金鑰都被 `.dockerignore` 排除），公開沒有安全疑慮。

### 3. 在 Zeabur 建立服務，來源選「Docker 映像檔」

- 登入 https://zeabur.com/ ，建立新專案（或用既有專案）
- 新增服務時，**來源選「Docker 映像檔」**（不要選「GitHub 儲存庫」，原因見最上面）
- 映像位址填 `ghcr.io/darcon25/2026_nztrip`，映像標籤填 `latest`
- 使用者名稱／密碼留空（因為套件是公開的）

如果是要幫既有服務「換來源」（例如原本接的是 GitHub 儲存庫）：進服務的「**設定**」分頁 → 「來源」那一列點下去 → 上方切到「**Docker 映像檔**」分頁 → 填好位址和標籤 → 儲存。

### 4. 設定環境變數

進到 Service 的「**環境變數**」分頁，點「**新增**」（或用「編輯原始環境變數」一次貼多筆），填入：

| 變數名稱 | 填什麼 | 必填？ |
|---|---|---|
| `DATA_DIR` | `/data` | ✅ 必填，要跟步驟 5 掛 Volume 的路徑完全一樣 |
| `GOOGLE_MAPS_API_KEY` | 複製你電腦上 `~/Projects/2026_nztrip/.env.local` 裡 `GOOGLE_MAPS_API_KEY=` 後面那串值，貼過來 | ✅ 必填，沒填的話全站景點/住宿照片都抓不到 |
| `N8N_PHOTO_WEBHOOK_URL` | 你的 n8n webhook 網址（如果有設定旅行相簿自動同步 Google Drive 的話） | 選填 |
| `N8N_PHOTO_WEBHOOK_TOKEN` | 對應的驗證 token（如果 webhook 有設驗證的話） | 選填 |

**不用填**（`.env.example` 裡雖然有列，但程式裡完全沒有用到，是舊範本殘留）：`GEMINI_API_KEY`、`APP_URL`、`VITE_GOOGLE_SHEET_ID`。

`PORT` 不用自己填，Zeabur 會自動注入（預設 8080），程式已經改好會自動讀取。

### 5. 掛 Volume（永久儲存空間）——這步驟最容易漏、也最重要

進到 Service 的「**硬碟**」分頁：
- 點「**＋ 掛載硬碟**」
- 硬碟 ID 隨意（例如 `data`）
- **掛載目錄填 `/data`**——要跟步驟 4 設定的 `DATA_DIR` 一模一樣
- 點「掛載硬碟」確認

**為什麼這步驟這麼重要**：資料庫（分帳紀錄、留言、自煮分工的菜色）跟大家上傳的照片，都是直接寫在容器的硬碟上。沒掛 Volume 的話，每次重新部署（換一顆新容器）資料就會全部消失。掛了之後，`/data` 這個資料夾會接到一塊獨立、永久保留的儲存空間，不管重新部署幾次資料都還在。

### 6. 產生對外網址

進到 Service 的「**網路**」分頁：
- 點「**Generate Domain**」，取一個名字，會拿到 `你取的名字.zeabur.app`

### 7. 確認部署成功

打開網址：
- 首頁看得到
- 往下捲到「景點 × 活動」，隨便一張卡片看得到照片（不是米色圖示佔位圖）
- 在「餐廳輪值」填一筆菜色、或在「費用分攤」記一筆消費，重新整理頁面資料還在

## 以後怎麼更新部署（程式碼有新改動時）

因為來源是「Docker 映像檔」不是「GitHub 儲存庫」，**改完程式碼、`git push` 到 GitHub 之後，Zeabur 不會自動重新部署**，要多做這幾步：

```bash
cd ~/Projects/2026_nztrip  # 或對應的 worktree
gh auth token | docker login ghcr.io -u darcon25 --password-stdin
docker build --platform linux/amd64 --provenance=false --sbom=false \
  -t ghcr.io/darcon25/2026_nztrip:latest .
docker push ghcr.io/darcon25/2026_nztrip:latest
```

推上去之後，回 Zeabur 服務頁面，點「**更新映像**」（服務狀態頁面上如果顯示錯誤會有這顆按鈕；平時要手動觸發可以到「設定」→「來源」重新按一次儲存），確認彈出視窗裡的映像位址、標籤正確後按「更新」。

## 常見問題

| 症狀 | 可能原因 |
|---|---|
| 部署狀態顯示「服務映像拉取失敗」 | 檢查映像位址/標籤有沒有打錯字；套件是不是還是私有（回步驟 2）；有沒有漏加 `--provenance=false --sbom=false` |
| 部署狀態顯示「崩潰重試中」，記錄裡有 `exec format error` | 建置時漏加 `--platform linux/amd64`，在 Apple Silicon Mac 上建出了 ARM64 版本，重新照步驟 1 的完整指令建置 |
| 首頁正常，但照片、留言、分帳、填菜色全部都不能用 | 這代表又被當成靜態網站部署了——通常是不小心把來源切回「GitHub 儲存庫」，回步驟 3 確認來源是「Docker 映像檔」 |
| 首頁正常，但全部照片都是米色佔位圖 | `GOOGLE_MAPS_API_KEY` 沒填對，回步驟 4 檢查有沒有複製完整、有沒有多餘空白 |
| 填的資料重新整理就不見 | Volume 沒掛，或掛載路徑跟 `DATA_DIR` 對不起來，回步驟 4、5 確認兩邊都是 `/data` |
| `docker push` 出現 `permission_denied` | GitHub token 缺 `write:packages` 權限，見步驟 1 的權限說明 |

## 除錯記錄（給接手的人，理解為什麼架構長這樣）

實際除錯過程，依序踩過的坑：

1. **一開始直接用「GitHub 儲存庫」當來源**，Zeabur 自動判斷成純前端 Vite 專案，`/api/*` 全部 404（是網站首頁的 HTML，不是真的 API 回應）。
2. **試過設 `ZBPACK_PLAN_TYPE=nodejs` 環境變數**（Zeabur 建置系統 zbpack 文件裡查到的設定），存檔重新部署後**沒有用**，行為完全沒變。
3. **試過加 `Dockerfile`**，想說有 Dockerfile 總該用 Docker 的方式跑了吧——**建置紀錄證實 Zeabur 確實有執行 Dockerfile 裡的 `npm run build`，但建置完之後，Zeabur 自己另外拉了一個 `docker.io/zeabur/caddy-static` 執行期映像，把 Dockerfile 建出來的 `dist/` 資料夾內容複製進去，完全無視 Dockerfile 裡指定的 `CMD`**（用 Zeabur 的網頁終端機直接連進容器，工作目錄是 `/usr/share/caddy`，裡面放的就是打包好的靜態檔案，`server.ts` 從沒被執行過）。
4. **試過把 Vite 輸出資料夾從預設的 `dist` 改名成 `web-build`**，猜測 Zeabur 是靠掃描 `dist/index.html` 這個特徵路徑判斷「這是靜態網站」——結果建置**直接失敗**，建置紀錄顯示 Zeabur 內部有一段寫死的 `COPY --from=build /src/dist ...`，證實它真的是硬掃 `dist` 這個路徑，改名反而讓它的內部邏輯找不到來源、直接壞掉。
5. **確認沒有任何公開設定能關掉這個行為**，改成本機建置 Docker image、推上 ghcr.io、Zeabur 服務來源改成「Docker 映像檔」直接拉現成映像檔——這樣 Zeabur 完全不會跑它自己的框架偵測邏輯。
6. **第一次推上去的 image 是私有的**，Zeabur 拉取失敗（`ImagePullBackOff`），改成公開後解決。
7. **改成公開後仍然拉取失敗，錯誤是 `rpc error: code = NotFound`**——本機用 `docker pull` 匿名測試完全正常，判斷是 Docker 新版預設加的 provenance/attestation 中繼資料（manifest list 裡多一個非標準的 attestation 項目）跟 Zeabur 的容器執行環境不相容，加 `--provenance=false --sbom=false` 重新建置解決。
8. **image 拉取成功了，但容器開不起來，錯誤是 `exec /usr/local/bin/docker-entrypoint.sh: exec format error`**——本機是 Apple Silicon（ARM64），`docker build` 沒指定平台時預設建出 ARM64 映像檔，Zeabur 伺服器是 x86_64，架構不合。加 `--platform linux/amd64`（本機用 QEMU 模擬編譯）解決，本機用 `docker run --platform linux/amd64` 模擬測試過確認正常後才推上去。

全部解決後，首頁、API 讀寫、資料庫持久化（重開機資料還在）、Google 地圖照片都實測正常。

Zeabur 這幾個功能（環境變數、硬碟、網路分頁的確切位置與按鈕名稱）是 2026 年 7 月當時看到的畫面，**Zeabur 介面偶爾會改版，如果畫面對不上，以你實際看到的畫面為準**。
