/**
 * STEP NAVI の共通スクリプト。
 *
 * ログイン機能を廃止したため、進捗（読了・スコア）はブラウザにそのまま保存する。
 * 以前はログインユーザーごとに localStorage を名前空間分けしていたが、
 * その分岐は不要になったので撤去した。
 *
 * 残している役割は2つ:
 *   1. 旧ログイン時代のユーザー別データを、通常キーへ一度だけ引き戻す（進捗の救済）
 *   2. LINE相談カードを、どのページでもタップできるリンクに変換する
 */
(function () {
  const LINE_URL = 'https://lin.ee/WQzrYGn';

  // 旧実装がユーザーごとに分けて保存していた進捗キー。
  const PROGRESS_KEYS = [
    'stepnavi_read',
    'stepnavi_iv_checklist',
    'stepnavi_kbd_highscore',
    'stepnavi.typing.best_cpm',
    'stepnavi.typing.best_time',
    'stepnavi.typing.played_count',
    'stepnavi.typing.history',
    'stepnavi.fighter.save',
    'stepnavi.excel.mastered',
    'stepnavi.excel.unlocked',
    'stepnavi.excel.total_solved',
  ];

  const MIGRATED_FLAG = 'stepnavi_unscoped_v1';

  /**
   * 旧 'stepnavi_user:<id>:<key>' 形式の保存を、通常キーへ戻す。
   * 複数アカウントぶんある場合は、最初に見つかったものを採用する。
   * 移行後は旧キーとログイン情報を掃除する。
   */
  function migrateFromScopedStorage() {
    try {
      if (localStorage.getItem(MIGRATED_FLAG)) return;

      PROGRESS_KEYS.forEach((key) => {
        if (localStorage.getItem(key) !== null) return; // 既に通常キーがあるなら触らない
        for (let i = 0; i < localStorage.length; i++) {
          const storedKey = localStorage.key(i);
          if (storedKey && storedKey.startsWith('stepnavi_user:') && storedKey.endsWith(':' + key)) {
            localStorage.setItem(key, localStorage.getItem(storedKey));
            break;
          }
        }
      });

      // 旧ログイン関連の残骸を削除する。
      const stale = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storedKey = localStorage.key(i);
        if (!storedKey) continue;
        if (storedKey.startsWith('stepnavi_user:') || storedKey === 'stepnavi_session' || storedKey === 'stepnavi_users') {
          stale.push(storedKey);
        }
      }
      stale.forEach((k) => localStorage.removeItem(k));

      localStorage.setItem(MIGRATED_FLAG, '1');
    } catch (_) {
      // プライベートブラウジング等で localStorage が使えない場合は何もしない。
    }
  }

  /**
   * LINE相談カードが <div> のままのページでは、カード全体をリンクに置き換える。
   */
  function enhanceLineCtas() {
    document.querySelectorAll('section').forEach((section) => {
      if (!section.textContent || !section.textContent.includes('LINE')) return;
      if (!section.querySelector('[class*="#06C755"]')) return;
      if (section.querySelector('a[href*="lin.ee"]')) return;

      const card = Array.from(section.children).find((child) =>
        child.matches('div') && child.textContent.includes('LINE')
      );
      if (!card) return;

      const link = document.createElement('a');
      link.href = LINE_URL;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = card.className;
      link.setAttribute('aria-label', '公式LINEで相談する');
      while (card.firstChild) link.appendChild(card.firstChild);
      card.replaceWith(link);
    });
  }

  migrateFromScopedStorage();

  window.StepNaviLineUrl = LINE_URL;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceLineCtas);
  } else {
    enhanceLineCtas();
  }
})();
