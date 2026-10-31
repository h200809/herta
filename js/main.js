/* =========================================================
   黑塔空间站 · 交互脚本
   原生 JS，无任何依赖
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------- 启动画面 ---------------- */
  var boot = $('#boot');
  var bootClosed = false;
  function closeBoot() {
    if (!boot || bootClosed) return;
    bootClosed = true;
    boot.classList.add('done');
  }
  window.setTimeout(closeBoot, reduceMotion ? 0 : 1500);
  if (boot) {
    boot.addEventListener('click', closeBoot);
    boot.addEventListener('touchstart', closeBoot, { passive: true });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeBoot();
  });

  /* ---------------- 通用提示条 ---------------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(message, tag) {
    if (!toastEl) return;
    toastEl.innerHTML = '';
    if (tag) {
      var badge = document.createElement('span');
      badge.className = 'toast-tag';
      badge.textContent = tag;
      toastEl.appendChild(badge);
    }
    var text = document.createElement('span');
    text.textContent = message;
    toastEl.appendChild(text);

    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('show');
    }, 3800);
  }

  /* ---------------- 导航 / 滚动进度 / 章节高亮 ---------------- */
  var nav = $('#nav');
  var progress = $('#scrollProgress');
  var toTop = $('#toTop');
  var navLinks = $$('.nav-links a');
  var railLinks = $$('.side-rail a');
  var sections = ['top', 'herta', 'zones', 'universe', 'puppets', 'archive'].map(function (id) {
    return { id: id, el: document.getElementById(id) };
  }).filter(function (s) { return s.el; });

  var sectionOffsets = [];
  function measureSections() {
    sectionOffsets = sections.map(function (s) { return s.el.offsetTop; });
  }
  measureSections();
  window.addEventListener('load', measureSections);
  window.addEventListener('resize', measureSections);

  function updateScrollFrame() {
    var y = window.scrollY || window.pageYOffset;

    if (nav) nav.classList.toggle('scrolled', y > 30);

    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0;
    if (progress) progress.style.width = (pct * 100).toFixed(2) + '%';

    if (toTop) toTop.classList.toggle('show', y > 720);

    var activeId = 'top';
    for (var i = 0; i < sections.length; i++) {
      if (sectionOffsets[i] - 140 <= y) activeId = sections[i].id;
    }
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + activeId);
    });
    railLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-section') === activeId);
    });
  }

  var scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () {
      updateScrollFrame();
      scrollTicking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  updateScrollFrame();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- 移动端菜单 ---------------- */
  var burger = $('#burger');
  var mobileMenu = $('#mobileMenu');
  function setMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  }
  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(!mobileMenu.classList.contains('open'));
    });
  }
  if (mobileMenu) {
    $$('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      setMenu(false);
      burger.focus();
    }
  });

  /* ---------------- 滚动入场 ---------------- */
  var revealItems = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- 数字滚动 ---------------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var pad = parseInt(el.getAttribute('data-pad'), 10) || 0;
    var duration = 1500;
    var start = null;

    function render(value) {
      var text = String(Math.round(value));
      if (pad) text = text.padStart(pad, '0');
      el.textContent = text;
    }

    if (reduceMotion) { render(target); return; }

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      render(target * eased);
      if (p < 1) window.requestAnimationFrame(step);
      else render(target);
    }
    window.requestAnimationFrame(step);
  }

  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------------- 星空画布 ---------------- */
  var canvas = $('#stars');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = 1;
    var cw = 0;
    var ch = 0;
    var stars = [];
    var rafId = null;
    var starScroll = 0;

    function buildStars() {
      var count = Math.min(190, Math.max(70, Math.round((cw * ch) / 11000)));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * cw,
          y: Math.random() * ch,
          r: Math.random() * 1.25 + 0.25,
          a: Math.random() * 0.55 + 0.12,
          speed: Math.random() * 0.05 + 0.01,
          phase: Math.random() * Math.PI * 2,
          tint: Math.random() > 0.72 ? 201 : 255
        });
      }
    }

    function resizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      if (reduceMotion) drawStars(0);
    }

    function drawStars(t) {
      ctx.clearRect(0, 0, cw, ch);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = reduceMotion ? 1 : 0.62 + 0.38 * Math.sin(t * 0.0011 + s.phase);
        var y = s.y - starScroll * s.speed;
        y = ((y % ch) + ch) % ch;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + s.tint + ',' + (s.tint === 255 ? 255 : 190) + ',' + (s.tint === 255 ? 255 : 255) + ',' + (s.a * twinkle).toFixed(3) + ')';
        ctx.fill();
      }
    }

    function loop(t) {
      drawStars(t);
      rafId = window.requestAnimationFrame(loop);
    }

    function startStars() {
      if (reduceMotion) { drawStars(0); return; }
      if (rafId === null) rafId = window.requestAnimationFrame(loop);
    }
    function stopStars() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    resizeCanvas();
    startStars();

    var canvasResizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(canvasResizeTimer);
      canvasResizeTimer = window.setTimeout(function () {
        resizeCanvas();
        if (reduceMotion) drawStars(0);
      }, 180);
    });

    window.addEventListener('scroll', function () {
      starScroll = window.scrollY || window.pageYOffset;
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopStars();
      else startStars();
    });
  }

  /* ---------------- 鼠标光晕 ---------------- */
  var cursor = $('#cursor');
  if (cursor && finePointer && !reduceMotion) {
    var cursorShown = false;
    document.addEventListener('pointermove', function (e) {
      if (!cursorShown) {
        cursor.classList.add('on');
        cursorShown = true;
      }
      cursor.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
    });
    document.addEventListener('pointerleave', function () {
      cursor.classList.remove('on');
      cursorShown = false;
    });
  }

  /* ---------------- 舱段切换 ---------------- */
  var zones = $$('.zone');
  var mapNodes = $$('.map-node');
  var zoneList = $('#zoneList');

  function activateZone(key, fromMap) {
    zones.forEach(function (zone) {
      var on = zone.getAttribute('data-zone') === key;
      zone.classList.toggle('is-active', on);
      var head = $('.zone-head', zone);
      if (head) head.setAttribute('aria-expanded', String(on));
    });
    mapNodes.forEach(function (node) {
      node.classList.toggle('is-active', node.getAttribute('data-zone') === key);
    });

    if (fromMap && zoneList && window.innerWidth < 981) {
      zoneList.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  zones.forEach(function (zone) {
    var head = $('.zone-head', zone);
    if (head) {
      head.addEventListener('click', function () {
        activateZone(zone.getAttribute('data-zone'), false);
      });
    }
  });

  mapNodes.forEach(function (node) {
    var go = function () { activateZone(node.getAttribute('data-zone'), true); };
    node.addEventListener('click', go);
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        go();
      }
    });
  });

  /* ---------------- 模拟宇宙 · 祝福抽取 ---------------- */
  var blessings = [
    { path: '存护', name: '不动的城墙', desc: '获得护盾时，为全队附加等同于 12% 最大生命值的护盾，持续 2 回合。', stars: 3 },
    { path: '记忆', name: '被折叠的昨天', desc: '冻结敌方目标时，立即回复 1 个战技点，每回合最多触发 2 次。', stars: 3 },
    { path: '巡猎', name: '箭先于名字抵达', desc: '暴击率提升 8%，暴击伤害提升 16%。对生命值低于 50% 的敌人额外提升 8% 暴击率。', stars: 3 },
    { path: '丰饶', name: '春天没有尽头', desc: '每回合开始时回复 6% 最大生命值；治疗量溢出时，转化为等量护盾。', stars: 2 },
    { path: '智识', name: '答案在问题之前', desc: '终结技造成的伤害提升 20%；施放终结技后，下一次攻击额外造成 1 次附加伤害。', stars: 3 },
    { path: '同谐', name: '合唱的第零小节', desc: '全队速度提升 10%；每次获得增益效果时，全体友方回复 4 点能量。', stars: 2 },
    { path: '虚无', name: '沉默也会回声', desc: '敌方每承受 1 种持续伤害，受到的伤害提升 6%，最多叠加 3 层。', stars: 2 },
    { path: '毁灭', name: '把星星拆开', desc: '攻击力提升 12%，受到伤害提升 4%；生命值低于 50% 时，攻击力额外提升 12%。', stars: 3 },
    { path: '欢愉', name: '无意义的庆典', desc: '追加攻击造成的伤害提升 18%；触发追加攻击时，有 50% 概率回复 1 个战技点。', stars: 2 },
    { path: '繁育', name: '第无数次分裂', desc: '召唤物造成的伤害提升 20%；召唤物行动后，全体友方获得 1 层「增殖」。', stars: 2 },
    { path: '贪饕', name: '吞下整条银河', desc: '击破敌方弱点时，回复等同于 8% 最大生命值的生命，并提升 10% 击破特攻。', stars: 3 },
    { path: '终末', name: '所有结局同时发生', desc: '战斗开始时，随机获得 1 个其他命途的祝福；该祝福在战斗结束后消失。', stars: 3 }
  ];

  var blessingCard = $('#blessingCard');
  var blessingPath = $('#blessingPath');
  var blessingName = $('#blessingName');
  var blessingDesc = $('#blessingDesc');
  var blessingRarity = $('#blessingRarity');
  var blessingId = $('#blessingId');
  var simCountEl = $('#simCount');
  var drawBtn = $('#drawBlessing');
  var lastBlessing = 4;
  var simCount = 0;

  function randomBlessing() {
    var index = Math.floor(Math.random() * blessings.length);
    if (index === lastBlessing) index = (index + 1 + Math.floor(Math.random() * (blessings.length - 1))) % blessings.length;
    lastBlessing = index;
    return blessings[index];
  }

  function renderBlessing(item) {
    if (blessingPath) blessingPath.textContent = item.path;
    if (blessingName) blessingName.textContent = item.name;
    if (blessingDesc) blessingDesc.textContent = item.desc;
    if (blessingRarity) blessingRarity.textContent = '★'.repeat(item.stars) + '☆'.repeat(3 - item.stars);
    if (blessingId) blessingId.textContent = '#' + String(Math.floor(Math.random() * 9000) + 1000);
  }

  if (drawBtn && blessingCard) {
    drawBtn.addEventListener('click', function () {
      if (blessingCard.classList.contains('is-drawing')) return;
      blessingCard.classList.remove('is-in');
      blessingCard.classList.add('is-drawing');

      window.setTimeout(function () {
        renderBlessing(randomBlessing());
        simCount += 1;
        if (simCountEl) simCountEl.textContent = String(simCount);
        blessingCard.classList.remove('is-drawing');
        blessingCard.classList.add('is-in');
        window.setTimeout(function () {
          blessingCard.classList.remove('is-in');
        }, 700);
      }, reduceMotion ? 0 : 400);
    });
  }

  /* ---------------- 人偶网络 ---------------- */
  var puppetTapsEl = $('#puppetTaps');
  var puppetTaps = 0;
  var puppets = $$('.puppet');

  puppets.forEach(function (puppet) {
    puppet.addEventListener('click', function () {
      puppetTaps += 1;
      if (puppetTapsEl) puppetTapsEl.textContent = String(puppetTaps).padStart(3, '0');

      puppet.classList.remove('pop');
      void puppet.offsetWidth;
      puppet.classList.add('pop');

      toast(puppet.getAttribute('data-quote') || '……', puppet.getAttribute('data-name') || '人偶');
    });
  });

  /* ---------------- 人偶立绘点击 ---------------- */
  var portrait = $('#portrait');
  var portraitLines = [
    '看够了没有？',
    '我不是展品。',
    '你的表情很有趣。记录一下。',
    '无聊。下一个。',
    '别碰帽子。',
    '人偶也会累的。大概。'
  ];
  if (portrait) {
    portrait.addEventListener('click', function () {
      var line = portraitLines[Math.floor(Math.random() * portraitLines.length)];
      toast(line, '人偶');
    });
  }

  /* ---------------- 访客终端 ---------------- */
  var terminal = $('#terminal');
  var termBody = $('#termBody');
  var termOut = $('#termOut');
  var termForm = $('#termForm');
  var termInput = $('#termInput');
  var visitorId = 'V-2026-' + String(Math.floor(1000 + Math.random() * 9000));
  var history = [];
  var historyIndex = 0;
  var introStarted = false;

  function print(text, cls) {
    if (!termOut) return;
    var line = document.createElement('div');
    line.className = 'term-line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    termOut.appendChild(line);
    if (termBody) termBody.scrollTop = termBody.scrollHeight;
  }

  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    var lines = [
      ['[BOOT] HERTA SPACE STATION — VISITOR TERMINAL v4.2.1', 'dim'],
      ['[ OK ] 主控舱段链路已建立', 'ok'],
      ['[WARN] 未登记访客 · 权限等级 D', 'warn'],
      ['[INFO] 输入 help 查看可用指令', 'info']
    ];
    lines.forEach(function (item, i) {
      if (reduceMotion) {
        print(item[0], item[1]);
      } else {
        window.setTimeout(function () { print(item[0], item[1]); }, 180 + i * 260);
      }
    });
  }

  if (terminal && 'IntersectionObserver' in window) {
    var termObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          startIntro();
          termObserver.disconnect();
        }
      });
    }, { threshold: 0.35 });
    termObserver.observe(terminal);
  } else {
    startIntro();
  }

  if (termBody) {
    termBody.addEventListener('click', function (e) {
      if (e.target.closest('input, a, button')) return;
      if (window.getSelection && String(window.getSelection()) !== '') return;
      if (termInput) termInput.focus();
    });
  }

  function formatTime() {
    var d = new Date();
    function pad(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  var zoneInfo = [
    ['01', '主控舱段 COMMAND', '危险等级 01 / 访客可进入'],
    ['02', '收容舱段 STORAGE', '危险等级 03 / 需 B 级权限'],
    ['03', '支援舱段 SUPPORT', '危险等级 01 / 访客可进入'],
    ['04', '禁闭舱段 SECLUSION', '危险等级 05 / 禁止进入']
  ];

  var commands = {
    help: function () {
      return [
        ['可用指令 / COMMANDS', 'accent'],
        ['help        显示本说明', ''],
        ['herta       调阅「黑塔」档案', ''],
        ['zones       列出现有舱段', ''],
        ['puppet      随机呼叫一台人偶', ''],
        ['sim         运行一次模拟宇宙', ''],
        ['whoami      查看访客权限', ''],
        ['time        查看空间站标准时', ''],
        ['ls          列出档案目录', ''],
        ['clear       清空终端', ''],
        ['', 'gap'],
        ['部分指令支持中文：黑塔 / 舱段 / 人偶 / 模拟 / 时间', 'dim']
      ];
    },
    herta: function () {
      return [
        ['[ARCHIVE] 黑塔 / HERTA', 'accent'],
        ['身份      人偶（远程操控）', ''],
        ['所属      空间站「黑塔」', ''],
        ['命途      智识 · 属性 冰', ''],
        ['编号      天才俱乐部 #83', ''],
        ['评价      空间站里最不好惹的「小女孩」', ''],
        ['', 'gap'],
        ['备注：不要让她觉得无聊。', 'warn']
      ];
    },
    zones: function () {
      var rows = [['[SECTORS] 舱段索引', 'accent']];
      zoneInfo.forEach(function (z) {
        rows.push([z[0] + '  ' + z[1] + '  ·  ' + z[2], '']);
      });
      rows.push(['', 'gap']);
      rows.push(['提示：在「舱段」区域可以查看完整平面图。', 'dim']);
      return rows;
    },
    puppet: function () {
      var p = puppets[Math.floor(Math.random() * puppets.length)];
      return [
        ['[PUPPET] 呼叫 ' + (p.getAttribute('data-name') || '人偶') + ' …', 'dim'],
        ['「' + (p.getAttribute('data-quote') || '……') + '」', 'accent'],
        ['', 'gap'],
        ['连接已断开。她好像不太想理你。', 'dim']
      ];
    },
    sim: function () {
      var b = randomBlessing();
      simCount += 1;
      if (simCountEl) simCountEl.textContent = String(simCount);
      return [
        ['[SIM] 正在构建模拟宇宙 …', 'dim'],
        ['命途：' + b.path + '　' + '★'.repeat(b.stars) + '☆'.repeat(3 - b.stars), 'info'],
        ['祝福：' + b.name, 'accent'],
        [b.desc, ''],
        ['', 'gap'],
        ['第 ' + simCount + ' 次模拟结束。结果已记录。', 'dim']
      ];
    },
    whoami: function () {
      return [
        ['[VISITOR] ' + visitorId, 'accent'],
        ['权限等级    D', ''],
        ['可访问区域  主控舱段 · 支援舱段', ''],
        ['禁止进入    禁闭舱段', ''],
        ['', 'gap'],
        ['备注：你是今天的第 1 位访客。她大概会记得。', 'dim']
      ];
    },
    time: function () {
      return [
        ['空间站标准时（本地同步）', 'dim'],
        [formatTime(), 'accent'],
        ['轨道周期    03:12:44', ''],
        ['状态        运行中 / 全员在岗', '']
      ];
    },
    ls: function () {
      return [
        ['herta.txt    zones.log    puppets.db', 'info'],
        ['universe.sim visit.log     README', 'info'],
        ['', 'gap'],
        ['试试 cat herta.txt', 'dim']
      ];
    },
    cat: function (arg) {
      if (!arg) return [['cat: 缺少文件名。试试 cat herta.txt', 'warn']];
      if (arg === 'herta.txt') {
        return [
          ['「别误会，我不是在等你。」', 'accent'],
          ['「是这座空间站，刚好需要一个访客。」', 'accent']
        ];
      }
      if (arg === 'readme') {
        return [['这是一个非官方同人页面。她本人尚未对此发表意见。', '']];
      }
      return [['cat: ' + arg + ': 没有那个文件。', 'warn']];
    },
    sudo: function () {
      return [['sudo: 权限不足。你以为你是谁？', 'warn']];
    },
    exit: function () {
      return [['exit: 未登记的访客无法离开空间站。', 'warn'], ['……开玩笑的。点右上角就行。', 'dim']];
    },
    clear: function () {
      if (termOut) termOut.innerHTML = '';
      return [];
    }
  };

  var aliases = {
    '黑塔': 'herta',
    '舱段': 'zones',
    '人偶': 'puppet',
    '模拟': 'sim',
    '帮助': 'help',
    '时间': 'time',
    '我是谁': 'whoami',
    '清理': 'clear',
    '退出': 'exit'
  };

  function handleCommand(raw) {
    var parts = raw.trim().split(/\s+/);
    var key = (parts[0] || '').toLowerCase();
    var arg = parts.slice(1).join(' ').toLowerCase();
    if (aliases[key]) key = aliases[key];

    var fn = commands[key];
    if (!fn) {
      print('指令未收录：' + raw, 'warn');
      print('输入 help 查看可用指令。', 'dim');
      return;
    }
    var lines = fn(arg) || [];
    lines.forEach(function (line) { print(line[0], line[1]); });
  }

  if (termForm && termInput) {
    termForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = termInput.value.trim();
      if (!value) return;
      startIntro();
      print('visitor@hss:~$ ' + value, 'term-cmd');
      history.push(value);
      historyIndex = history.length;
      termInput.value = '';
      handleCommand(value);
    });

    termInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') {
        if (!history.length) return;
        e.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        termInput.value = history[historyIndex] || '';
        window.setTimeout(function () { termInput.setSelectionRange(termInput.value.length, termInput.value.length); }, 0);
      } else if (e.key === 'ArrowDown') {
        if (!history.length) return;
        e.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        termInput.value = history[historyIndex] || '';
      }
    });
  }

  /* ---------------- 页内锚点（移动端菜单关闭后滚动） ---------------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (mobileMenu && mobileMenu.classList.contains('open')) setMenu(false);
      var top = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - 90;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

})();
