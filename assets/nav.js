/**
 * STEP NAVI ナビゲーション（サイドバー＋ボトムナビ）を1ファイルで生成する。
 *
 * 以前は同じメニューHTMLが全57ページにベタ書きされていて、
 * 1本足すだけで57ファイルの手作業が発生していた。
 * ここに集約したので、メニューを変えるときは下の SECTIONS / TABS だけを直せばよい。
 *
 * - リンクはサイト直下からの相対パスで書く（例: 'guides/index.html'）
 * - サブディレクトリ用の '../' は、このファイル自身の src から自動で判定する
 * - 現在地のハイライトも自動（サイドバー=.active / ボトムナビ=.text-slate-900）
 */
(function () {
  // このscriptタグの src が 'assets/nav.js' なら直下、'../assets/nav.js' なら1階層下。
  var self = document.currentScript;
  var PREFIX = (self ? self.getAttribute('src') || '' : '').replace(/assets\/nav\.js.*$/, '');

  /* ===== メニュー定義：ここだけ直せば全ページに反映される ===== */

  // 求職者の行動順（仕事を決める→書類→面接→スキル→相談）でグループ分けする。
  // 個別記事はカテゴリのハブ側に置き、ここには入れない（サイトマップ化させない）。
  var SECTIONS = [
    {
      label: 'メイン',
      cls: 'main',
      items: [
        { href: 'index.html', icon: 'home', text: 'ホーム' },
      ],
    },
    {
      label: '準備する',
      cls: 'interview',
      items: [
        { href: 'careers/index.html', icon: 'library', text: '職種図鑑' },
        { href: 'future/index.html', icon: 'compass', text: 'AI時代のキャリア' },
        { href: 'guides/resume.html', icon: 'file-text', text: '履歴書の書き方' },
        { href: 'guides/index.html', icon: 'target', text: '面接対策' },
        { href: 'manners/index.html', icon: 'briefcase', text: 'ビジネスマナー' },
      ],
    },
    {
      label: '鍛える',
      cls: 'apps',
      items: [
        { href: 'apps/index.html', icon: 'gamepad-2', text: 'アプリで練習' },
        { href: 'certification/index.html', icon: 'award', text: '資格取得ガイド' },
        { href: 'ai/index.html', icon: 'sparkles', text: 'AI活用入門' },
      ],
    },
    {
      label: '相談する',
      cls: 'support',
      items: [
        { href: 'links/index.html', icon: 'message-circle', text: '各種公式LINE' },
      ],
    },
  ];

  // ボトムナビ（4タブ）。match はそのタブを点灯させるディレクトリ/ページのキー。
  var TABS = [
    { href: 'index.html', icon: 'home', text: 'ホーム', match: ['index.html'] },
    { href: 'content/index.html', icon: 'clipboard-list', text: '準備する', match: ['content', 'careers', 'future', 'guides', 'manners'] },
    { href: 'apps/index.html', icon: 'gamepad-2', text: '鍛える', match: ['apps', 'certification', 'ai'] },
    { href: 'links/index.html', icon: 'message-circle', text: '相談する', match: ['links'] },
  ];

  /* ===== 現在地の判定 ===== */

  // 'careers/office.html' のような、サイト直下から見たキーに正規化する。
  var parts = location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
  var file = (parts.length && /\.html?$/i.test(parts[parts.length - 1])) ? parts.pop() : 'index.html';
  var dir = PREFIX ? (parts[parts.length - 1] || '') : '';
  var CURRENT = dir ? dir + '/' + file : file;
  var CURRENT_DIR = dir;

  function canonical(href) {
    return href.replace(/^(\.\.\/)+/, '').split('#')[0];
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ===== 組み立て ===== */

  function buildSidebar() {
    var html = '<div class="sidebar-logo">' +
      '<button id="menu-close" type="button" class="logo-icon" aria-label="メニューを閉じる">' +
      '<i data-lucide="menu" class="w-[16px] h-[16px] text-white"></i>' +
      '</button><span>STEP NAVI</span></div>';

    SECTIONS.forEach(function (sec) {
      html += '<div class="sidebar-section sidebar-section--' + sec.cls + '">' + esc(sec.label) + '</div>';
      sec.items.forEach(function (item) {
        if (item.external) {
          html += '<a href="' + esc(item.href) + '" target="_blank" rel="noopener">' +
            '<i data-lucide="' + esc(item.icon) + '"></i>' + esc(item.text) + '</a>';
          return;
        }
        var active = canonical(item.href) === CURRENT ? ' class="active"' : '';
        html += '<a href="' + esc(PREFIX + item.href) + '"' + active + '>' +
          '<i data-lucide="' + esc(item.icon) + '"></i>' + esc(item.text) + '</a>';
      });
    });

    var backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    backdrop.className = 'sidebar-backdrop';

    var aside = document.createElement('aside');
    aside.id = 'desktop-sidebar';
    aside.className = 'desktop-sidebar';
    aside.innerHTML = html;

    document.body.insertBefore(aside, document.body.firstChild);
    document.body.insertBefore(backdrop, aside);
    return { aside: aside, backdrop: backdrop };
  }

  function buildBottomNav() {
    var inner = '';
    TABS.forEach(function (tab) {
      var on = tab.match.some(function (m) {
        return m.indexOf('/') >= 0 ? m === CURRENT : (m === CURRENT_DIR || m === CURRENT);
      });
      // desktop.css が .text-slate-900 をブランドカラーに変換するため、その規約に合わせる。
      var tone = on ? 'text-slate-900' : 'text-slate-300';
      var weight = on ? 'font-bold' : 'font-medium';
      inner += '<a href="' + esc(PREFIX + tab.href) + '" class="flex flex-col items-center gap-0.5 ' + tone + '">' +
        '<i data-lucide="' + esc(tab.icon) + '" class="w-[19px] h-[19px]"></i>' +
        '<span class="text-[9px] ' + weight + '">' + esc(tab.text) + '</span></a>';
    });

    var nav = document.createElement('nav');
    nav.className = 'bottom-nav fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-100';
    nav.innerHTML = '<div class="flex items-center justify-around h-14">' + inner + '</div>';
    document.body.appendChild(nav);
  }

  function wireDrawer(aside, backdrop) {
    var toggle = document.getElementById('menu-toggle');
    var closeBtn = document.getElementById('menu-close');
    var open = function () {
      aside.classList.add('open');
      backdrop.classList.add('open');
      if (toggle) toggle.setAttribute('aria-label', 'メニューを閉じる');
    };
    var close = function () {
      aside.classList.remove('open');
      backdrop.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-label', 'メニューを開く');
    };
    if (toggle) toggle.addEventListener('click', function () {
      aside.classList.contains('open') ? close() : open();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    aside.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  }

  function render() {
    if (document.getElementById('desktop-sidebar')) return; // 二重挿入の保険
    var parts = buildSidebar();
    buildBottomNav();
    wireDrawer(parts.aside, parts.backdrop);
    // ページ側の lucide.createIcons() は既に実行済みなので、挿入した分をここで描画する。
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
