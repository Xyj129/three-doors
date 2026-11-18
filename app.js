// ============ 三扇门 · 交互逻辑 ============
(function () {
  "use strict";

  const S = {
    roomIdx: 0,
    inspected: new Set(),
    wrong: 0,
    score: 0,
    solved: [],
    hintShown: false
  };

  const $ = (id) => document.getElementById(id);
  const sceneEl = $("scene");
  const logEl = $("log");
  const actBtn = $("actBtn");
  const modal = $("modal");
  const sheet = $("sheet");
  const dotsEl = $("dots");
  const bgm = $("bgm");
  const musicBtn = $("musicBtn");
  let musicOn = false;
  let musicTouched = false;

  // ---------- 背景音乐 ----------
  function setMusic(on) {
    musicOn = on;
    musicBtn.classList.toggle("playing", on);
    if (on) {
      bgm.volume = 0.55;
      const p = bgm.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      bgm.pause();
    }
  }
  musicBtn.onclick = function () {
    musicTouched = true;
    setMusic(!musicOn);
  };

  // ---------- 工具 ----------
  function daysTogether() {
    const start = new Date(STORY.startDate).getTime();
    return Math.max(0, Math.floor((Date.now() - start) / 86400000)) + 1;
  }

  function openModal(html) {
    sheet.innerHTML = html;
    modal.classList.remove("hidden");
    requestAnimationFrame(() => modal.classList.add("show"));
  }

  function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => modal.classList.add("hidden"), 180);
  }

  function setLog(text) {
    logEl.classList.remove("fade-in");
    void logEl.offsetWidth;
    logEl.textContent = text;
    logEl.classList.add("fade-in");
  }

  // ---------- 进度点 ----------
  function renderDots() {
    let html = "";
    for (let i = 0; i < STORY.rooms.length; i++) {
      let cls = "dot";
      if (i < S.solved.length) cls += " done";
      else if (i === S.roomIdx) cls += " now";
      html += '<span class="' + cls + '"></span>';
    }
    html += '<span class="dot final' + (S.solved.length >= STORY.rooms.length ? " done" : "") + '"></span>';
    dotsEl.innerHTML = html;
  }

  // ---------- 物件图标 ----------
  const ICONS = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    frame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M7 15l3.5-4 3 3 3.5-5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10.5 6h3"/></svg>',
    mirror: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><ellipse cx="12" cy="12" rx="6.5" ry="9"/><path d="M9.5 15.5c2-1.5 2.8-3.6 2.8-6"/></svg>',
    pillow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 8.5c2-3 14-3 16 0 2 2.6 2 7.4 0 10-2 3-14 3-16 0-2-2.6-2-7.4 0-10z"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h10v7a5 5 0 0 1-10 0z"/><path d="M15 10h1.8a2.2 2.2 0 0 1 0 4.4H15"/></svg>',
    window: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 4v16M4 12h16"/></svg>',
    notebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    sticky: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M5 5h14v9l-5 5H5z"/><path d="M14 19v-5h5"/></svg>',
    dot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="6"/></svg>'
  };

  // ---------- 开场 ----------
  function renderIntro() {
    $("brand").textContent = STORY.title;
    dotsEl.innerHTML = "";
    sceneEl.className = "scene intro-scene";
    $("scene").innerHTML =
      '<div class="intro">' +
        '<p class="intro-line">' + STORY.intro.line1 + "</p>" +
        '<p class="intro-line">' + STORY.intro.line2 + "</p>" +
        '<p class="intro-line strong">' + STORY.intro.line3 + "</p>" +
      "</div>";
    setLog(STORY.subtitle);
    actBtn.textContent = STORY.intro.btn;
    actBtn.onclick = () => {
      if (!musicTouched) setMusic(true);
      S.roomIdx = 0;
      S.solved = [];
      S.score = 0;
      S.inspected = new Set();
      S.wrong = 0;
      renderRoom();
    };
  }

  // ---------- 房间 ----------
  function renderRoom() {
    const room = STORY.rooms[S.roomIdx];
    S.inspected = new Set();
    S.wrong = 0;
    S.hintShown = false;

    $("brand").textContent = room.name;
    renderDots();

    sceneEl.className = "scene theme-" + room.theme;
    sceneEl.innerHTML =
      '<div class="wall-deco"></div>' +
      '<div class="baseboard"></div>' +
      '<div class="floor"></div>' +
      '<div class="rug"></div>' +
      '<div class="plant"></div>' +
      '<div class="items" id="items"></div>' +
      '<button class="door" id="door" aria-label="门">' +
        '<span class="door-frame"></span>' +
        '<span class="door-panel"></span>' +
        '<span class="door-knob"></span>' +
        '<span class="door-badge">锁</span>' +
      "</button>";

    const itemsBox = document.getElementById("items");
    room.items.forEach(function (item) {
      const b = document.createElement("button");
      b.className = "item";
      b.style.left = item.x + "%";
      b.style.top = item.y + "%";
      b.innerHTML =
        '<span class="item-icon">' + (ICONS[item.id] || ICONS.dot) + "</span>" +
        '<span class="item-label">' + item.label + "</span>";
      b.onclick = function () {
        if (!S.inspected.has(item.id)) {
          S.inspected.add(item.id);
          b.classList.add("seen");
        }
        setLog(item.text);
        if (item.chats) openChats(item);
        if (S.inspected.size === room.items.length) {
          setLog(item.text + "（房间里的东西都看过了，去开门吧。）");
          document.getElementById("door").classList.add("ready");
        }
      };
      itemsBox.appendChild(b);
    });

    document.getElementById("door").onclick = openLock;

    setLog(room.tip);
    actBtn.textContent = "看看门锁";
    actBtn.onclick = openLock;
  }

  // ---------- 聊天截图 ----------
  function openChats(item) {
    const shots = item.chats.map(function (src, i) {
      return '<img class="shot" src="' + src + '" alt="聊天截图 ' + (i + 1) + '" loading="lazy">';
    }).join("");
    const html =
      '<div class="sheet-head"><div class="sheet-eyebrow">手机</div></div>' +
      '<p class="chat-tip">我们的聊天记录 · 共 ' + item.chats.length + ' 张，往下翻</p>' +
      '<div class="chat-shots">' + shots + '</div>' +
      '<button class="link" id="closeChats">收起来</button>';
    openModal(html);
    document.getElementById("closeChats").onclick = closeModal;
  }

  // ---------- 门锁 ----------
  function openLock() {
    const room = STORY.rooms[S.roomIdx];
    const lock = room.lock;
    if (lock.kind === "code") renderCodeLock(lock);
    else renderChoiceLock(lock);
  }

  function lockHeader(lock) {
    return (
      '<div class="sheet-head">' +
        '<div class="sheet-eyebrow">' + lock.title + "</div>" +
        '<h2 class="sheet-title">' + lock.subtitle + "</h2>" +
      "</div>"
    );
  }

  function renderCodeLock(lock) {
    let digits = "";
    const html =
      lockHeader(lock) +
      '<div class="code-display" id="codeDisplay">' +
        '<span></span><span></span><span></span><span></span>' +
      "</div>" +
      '<p class="feedback" id="feedback"></p>' +
      '<div class="keypad" id="keypad">' +
        [1,2,3,4,5,6,7,8,9].map((n) => '<button class="key" data-k="' + n + '">' + n + "</button>").join("") +
        '<button class="key ghost" data-k="clear">清空</button>' +
        '<button class="key" data-k="0">0</button>' +
        '<button class="key ghost" data-k="back">删除</button>' +
      "</div>" +
      '<button class="link" id="closeLock">先回去看看</button>';
    openModal(html);

    const display = document.getElementById("codeDisplay");
    const feedback = document.getElementById("feedback");

    function paint() {
      const spans = display.querySelectorAll("span");
      for (let i = 0; i < 4; i++) {
        spans[i].textContent = digits[i] || "";
        spans[i].classList.toggle("filled", !!digits[i]);
      }
    }

    function check() {
      if (digits.length !== 4) return;
      if (digits === lock.answer) {
        solvedLock();
      } else {
        S.wrong++;
        feedback.textContent = S.wrong >= 2 ? lock.wrong : "不对哦，再想想。";
        feedback.classList.add("shake");
        if (S.wrong >= 2 && !S.hintShown) {
          S.hintShown = true;
          feedback.textContent += " 提示：" + lock.hint;
        }
        setTimeout(() => feedback.classList.remove("shake"), 400);
        digits = "";
        paint();
      }
    }

    document.getElementById("keypad").onclick = function (e) {
      const btn = e.target.closest(".key");
      if (!btn) return;
      const k = btn.dataset.k;
      if (k === "clear") digits = "";
      else if (k === "back") digits = digits.slice(0, -1);
      else if (digits.length < 4) digits += k;
      paint();
      if (digits.length === 4) setTimeout(check, 180);
    };
    document.getElementById("closeLock").onclick = closeModal;
  }

  function renderChoiceLock(lock) {
    const html =
      lockHeader(lock) +
      '<div class="opts" id="opts">' +
        lock.options.map((t, i) => '<button class="opt" data-i="' + i + '">' + t + "</button>").join("") +
      "</div>" +
      '<p class="feedback" id="feedback"></p>' +
      '<button class="link" id="closeLock">先回去看看</button>';
    openModal(html);

    const feedback = document.getElementById("feedback");
    document.getElementById("opts").onclick = function (e) {
      const btn = e.target.closest(".opt");
      if (!btn) return;
      const i = Number(btn.dataset.i);
      if (i === lock.answer) {
        solvedLock();
      } else {
        S.wrong++;
        btn.classList.add("bad");
        setTimeout(() => btn.classList.remove("bad"), 500);
        feedback.textContent = S.wrong >= 2 ? lock.wrong + " 提示：" + lock.hint : "不对哦，再想想。";
      }
    };
    document.getElementById("closeLock").onclick = closeModal;
  }

  // ---------- 解锁 → 剧情 ----------
  function solvedLock() {
    const room = STORY.rooms[S.roomIdx];
    S.solved.push(S.roomIdx);
    renderDots();
    showAfter(room.after);
  }

  function showAfter(after) {
    const photoHTML = after.photo
      ? '<figure class="polaroid" id="afterPhoto">' +
          '<img src="' + after.photo + '" alt="照片">' +
          '<figcaption>' + (after.caption || "") + '</figcaption>' +
        '</figure>'
      : "";
    const html =
      '<div class="sheet-head">' +
        '<div class="sheet-eyebrow">门开了</div>' +
      "</div>" +
      '<p class="story-text">' + after.text + "</p>" +
      photoHTML +
      '<p class="ask">' + after.ask + "</p>" +
      '<div class="opts" id="afterOpts">' +
        after.options.map((o, i) => '<button class="opt" data-i="' + i + '">' + o.text + "</button>").join("") +
      "</div>";
    openModal(html);

    if (after.photo) {
      document.getElementById("afterPhoto").onclick = function () {
        openLightbox(after.photo);
      };
    }

    document.getElementById("afterOpts").onclick = function (e) {
      const btn = e.target.closest(".opt");
      if (!btn) return;
      const opt = after.options[Number(btn.dataset.i)];
      S.score += opt.warm;
      closeModal();
      setTimeout(nextRoom, 220);
    };
  }

  function openLightbox(src) {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = '<img src="' + src + '" alt="照片">';
    box.onclick = function () { box.remove(); };
    document.body.appendChild(box);
  }

  function nextRoom() {
    S.roomIdx++;
    if (S.roomIdx >= STORY.rooms.length) {
      renderFinaleGift();
    } else {
      renderRoom();
    }
  }

  // ---------- 最终 ----------
  function renderFinaleGift() {
    $("brand").textContent = STORY.finale.eyebrow;
    renderDots();
    sceneEl.className = "scene theme-final";
    sceneEl.innerHTML =
      '<div class="wall-deco"></div>' +
      '<div class="baseboard"></div>' +
      '<div class="floor"></div>' +
      '<div class="rug"></div>' +
      '<button class="gift" id="gift">' +
        '<span class="gift-lid"></span>' +
        '<span class="gift-body"></span>' +
        '<span class="gift-ribbon-v"></span>' +
        '<span class="gift-ribbon-h"></span>' +
      "</button>" +
      '<p class="gift-hint">最后一个盒子，<br>只给你一个人开。</p>';
    setLog("门都开完了。桌子上放着一个盒子。");
    actBtn.textContent = "打开盒子";
    const open = () => renderFinale();
    actBtn.onclick = open;
    document.getElementById("gift").onclick = open;
  }

  function renderFinale() {
    const end = S.score >= 2 ? STORY.endings.warm : STORY.endings.soft;
    const f = STORY.finale;
    $("brand").textContent = "结局";
    renderDots();

    const letterHTML = f.letter.map((p) => "<p>" + p + "</p>").join("");
    const wallHTML = (f.gallery && f.gallery.length)
      ? '<div class="photo-wall">' +
        f.gallery.map(function (src, i) {
          return '<img class="wall-photo" data-i="' + i + '" src="' + src + '" alt="照片 ' + (i + 1) + '">';
        }).join("") +
        '</div>'
      : "";
    const html =
      '<div class="sheet-head">' +
        '<div class="sheet-eyebrow">' + end.title + "</div>" +
      "</div>" +
      '<p class="story-text">' + end.text + "</p>" +
      '<div class="days-card">' +
        '<span class="days-label">' + f.daysLabel + "</span>" +
        '<span class="days-num">' + daysTogether() + "</span>" +
        '<span class="days-unit">天</span>' +
      "</div>" +
      wallHTML +
      '<div class="letter">' + letterHTML + "</div>" +
      '<p class="secret">' + f.secret + "</p>" +
      '<p class="sign">—— ' + f.sign + "</p>" +
      '<button class="primary wide" id="replay">' + f.replay + "</button>";
    openModal(html);

    sheet.querySelectorAll(".wall-photo").forEach(function (img) {
      img.onclick = function () {
        openLightbox(f.gallery[Number(img.dataset.i)]);
      };
    });

    document.getElementById("replay").onclick = function () {
      closeModal();
      setTimeout(renderIntro, 200);
    };
  }

  // ---------- 启动 ----------
  renderIntro();
})();
