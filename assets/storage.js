/**
 * STEP NAVI のブラウザ保存をユーザー別に分離する。
 *
 * 静的HTMLのまま運用できるよう、既存ページが使っている localStorage の
 * 進捗系キーだけをログイン中ユーザーの名前空間へ自動的に振り分ける。
 */
(function () {
  const LINE_URL = 'https://lin.ee/WQzrYGn';
  const SESSION_KEY = 'stepnavi_session';
  const USERS_KEY = 'stepnavi_users';
  const SCOPED_KEYS = new Set([
    'stepnavi_read',
    'stepnavi_iv_checklist',
    'stepnavi_kbd_highscore',
    'stepnavi.typing.best_cpm',
    'stepnavi.typing.best_time',
    'stepnavi.typing.played_count',
    'stepnavi.typing.history',
    'stepnavi.excel.mastered',
    'stepnavi.excel.unlocked',
    'stepnavi.excel.total_solved',
  ]);

  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
  };

  function readJson(key, fallback) {
    try {
      const value = native.getItem.call(localStorage, key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    native.setItem.call(localStorage, key, JSON.stringify(value));
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function makeUserId(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return 'guest';
    try {
      return 'u_' + btoa(unescape(encodeURIComponent(normalized)))
        .replace(/=+$/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    } catch (_) {
      return 'u_' + normalized.replace(/[^a-z0-9]+/g, '_');
    }
  }

  function getUsers() {
    return readJson(USERS_KEY, []);
  }

  function saveUsers(users) {
    writeJson(USERS_KEY, users);
  }

  function ensureUserId(user) {
    if (!user) return null;
    if (!user.userId) user.userId = makeUserId(user.email);
    return user.userId;
  }

  function getSession() {
    const session = readJson(SESSION_KEY, null);
    if (session && !session.userId) {
      session.userId = makeUserId(session.email);
      writeJson(SESSION_KEY, session);
    }
    return session;
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    const user = users.find((u) => normalizeEmail(u.email) === normalizeEmail(session.email));
    if (user && !user.userId) {
      ensureUserId(user);
      saveUsers(users);
    }
    return user || session;
  }

  function scopedKey(key, userLike) {
    const userId = ensureUserId(userLike) || makeUserId(userLike && userLike.email);
    return `stepnavi_user:${userId}:${key}`;
  }

  function isScopedKey(key) {
    return SCOPED_KEYS.has(key);
  }

  function migrateLegacyUserData(userLike) {
    if (!userLike) return;
    SCOPED_KEYS.forEach((key) => {
      const targetKey = scopedKey(key, userLike);
      const current = native.getItem.call(localStorage, targetKey);
      const legacy = native.getItem.call(localStorage, key);
      if (current === null && legacy !== null) {
        native.setItem.call(localStorage, targetKey, legacy);
      }
      if (legacy !== null) {
        native.removeItem.call(localStorage, key);
      }
    });
  }

  function createSession(user, loginAt) {
    ensureUserId(user);
    const session = {
      userId: user.userId,
      email: user.email,
      nickname: user.nickname,
      loginAt: loginAt || new Date().toISOString(),
    };
    writeJson(SESSION_KEY, session);
    migrateLegacyUserData(user);
    return session;
  }

  const api = {
    LINE_URL,
    USERS_KEY,
    SESSION_KEY,
    makeUserId,
    getUsers,
    saveUsers,
    ensureUserId,
    getSession,
    getCurrentUser,
    scopedKey,
    migrateLegacyUserData,
    createSession,
    getJSON(key, fallback) {
      return readJson(scopedKey(key, getCurrentUser()), fallback);
    },
    setJSON(key, value) {
      writeJson(scopedKey(key, getCurrentUser()), value);
    },
  };

  window.StepNaviStorage = api;
  window.StepNaviLineUrl = LINE_URL;

  Storage.prototype.getItem = function (key) {
    if (this === localStorage && isScopedKey(key)) {
      return native.getItem.call(this, scopedKey(key, getCurrentUser()));
    }
    return native.getItem.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    if (this === localStorage && isScopedKey(key)) {
      return native.setItem.call(this, scopedKey(key, getCurrentUser()), value);
    }
    return native.setItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (this === localStorage && isScopedKey(key)) {
      return native.removeItem.call(this, scopedKey(key, getCurrentUser()));
    }
    return native.removeItem.call(this, key);
  };

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceLineCtas);
  } else {
    enhanceLineCtas();
  }
})();
