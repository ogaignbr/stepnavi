/**
 * STEP NAVI 認証関連の設定
 *
 * SHEETS_ENDPOINT に Google Apps Script の Webhook URL を設定すると、
 * 新規登録時にスプレッドシートへユーザー情報が自動送信されます。
 *
 * セットアップ手順は auth/SHEETS_SETUP.md を参照。
 *
 * 空文字のままなら送信はスキップされ、LocalStorage 保存のみ実行されます。
 */
window.STEPNAVI_CONFIG = {
  SHEETS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbwzYELMmJGF9pGBfs68rDJJXyOkDAmYtuR2SUvQKferJHXFWzbY3tTKOUj2UH2A4i19/exec'
};
