# スプレッドシート連携セットアップ手順

新規登録フォームの内容を Google スプレッドシートに自動収集するための手順。

所要時間：10分。技術知識は不要。手順通りにコピペで完了します。

---

## 1. スプレッドシートを作成

1. https://sheets.google.com/ にアクセス
2. 「空白のスプレッドシート」をクリック
3. ファイル名を **STEP NAVI 登録リスト** などに変更
4. 1行目に以下のヘッダーを入力（A1〜G1）：

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| ユーザーID | 登録日時 | ニックネーム | メールアドレス | 希望職種 | 興味のある分野 | 登録URL |

---

## 2. Apps Script を設定

1. スプレッドシートのメニューから **拡張機能 → Apps Script** を選択
2. 開いたエディタの中身をすべて削除
3. 以下のコードを貼り付け：

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      data.userId || '',
      data.registeredAt || new Date().toISOString(),
      data.nickname || '',
      data.email || '',
      data.jobType || '',
      data.interests || '',
      data.sourceUrl || 'https://ogaignbr.github.io/stepnavi/'
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. 保存（Ctrl+S）→ プロジェクト名は適当に「stepnavi-webhook」など

---

## 3. ウェブアプリとしてデプロイ

1. Apps Script エディタ右上の **デプロイ → 新しいデプロイ** をクリック
2. 種類の選択（歯車アイコン）→ **ウェブアプリ** を選択
3. 設定：
   - 説明：任意
   - 次のユーザーとして実行：**自分**
   - アクセスできるユーザー：**全員**
4. **デプロイ** をクリック
5. 初回は権限承認を求められるので、Google アカウントを選んで「許可」
6. デプロイ完了画面に表示される **ウェブアプリの URL** をコピー
   - 例：`https://script.google.com/macros/s/AKfycbx......./exec`

---

## 4. STEP NAVI 側に URL を設定

1. リポジトリ内 `stepnavi/auth/config.js` を開く
2. `SHEETS_ENDPOINT: ''` の `''` の中に、先ほどコピーした URL を貼り付け
3. 保存 → コミット → push

例：
```javascript
window.STEPNAVI_CONFIG = {
  SHEETS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec'
};
```

---

## 5. 動作確認

1. https://ogaignbr.github.io/stepnavi/ にアクセス
2. 新規登録フォームに架空の情報を入力して送信
3. スプレッドシートを確認 → 新しい行が追加されていれば成功

---

## トラブルシューティング

### スプレッドシートに追加されない
- Apps Script のデプロイ設定で「アクセスできるユーザー：全員」になっているか確認
- ブラウザの開発者ツール（F12）→ コンソールでエラーがないか確認
- `auth/config.js` の SHEETS_ENDPOINT が正しい URL になっているか確認

### コードを変更したのに反映されない
- Apps Script の **デプロイ → デプロイを管理 → 編集（鉛筆アイコン）→ バージョン：新バージョン** で再デプロイ
- URL が変わる場合があるので、新しい URL を config.js に再設定

### セキュリティについて
- このしくみは「LocalStorageに保存される簡易認証」なので、本格的なログイン認証ではありません
- パスワードはローカル端末にのみ保存され、スプレッドシートには送信されません
- 個人情報を取り扱う場合は、利用規約・プライバシーポリシーを適切に整備してください

---

## 既存データの確認

過去にローカル登録された分は、ブラウザに残っている場合があります。スプレッドシート連携を始める前に登録されたデータは、スプレッドシートには反映されません（ローカル限定）。
