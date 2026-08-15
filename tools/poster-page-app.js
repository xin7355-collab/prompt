/**
 * Runtime for public/poster.html. Inlined by tools/build-poster-page.mjs — kept as
 * its own file so it is editable with syntax highlighting and checkable with
 * `node --check`, rather than living inside a template string.
 */
(function () {
  'use strict';

  var DATA = JSON.parse(document.getElementById('payload').textContent);
  var ENTRIES = DATA.entries;
  var GROUPS = DATA.groups;

  var STORE_KEY = 'spellbox.poster.key';
  var STORE_MODEL = 'spellbox.poster.model';
  var STORE_RATIO = 'spellbox.poster.ratio';
  // 免費層可用的 Gemini 原生圖片模型（有每日上限）。imagen 系列要付費，不設為預設。
  // 預設用 gemini-2.5-flash-image：這是目前 GA 的原生圖片模型，畫質最好、新帳號普遍
  // 可用。舊的 gemini-2.0-flash-preview-image-generation 在部分新帳號已停用、會回 404；
  // 遇到時按設定裡的「偵測可用模型」讓金鑰自己列出真正能用的名稱。
  var DEFAULT_MODEL = 'gemini-2.5-flash-image';
  var PAGE = 48;

  var STORE_FACE = 'spellbox.poster.face';
  var PAGE_UNUSED = 0;

  var $ = function (id) { return document.getElementById(id); };
  var read = function (k, fallback) {
    try { return localStorage.getItem(k) || fallback; } catch (e) { return fallback; }
  };

  // 上傳一次的參考照（例如個人大頭照），data: URI。設定後，任何卡片的「⚡ 生成」
  // 都會帶上這張臉，直接套進那個風格 —— 不用每張卡各別上傳。存進 localStorage 是
  // 為了重開還在。
  var subjectImage = read(STORE_FACE, '') || null;

  // ── Toast ────────────────────────────────────────────────────────
  var toastTimer = null;
  function toast(message, bad) {
    var el = $('toast');
    clearTimeout(toastTimer);
    el.onclick = null;
    if (bad) {
      // Errors used to fade in 5s — long enough to miss, so Google's exact words got
      // lost. Now an error sticks on screen and a tap copies the full text, which is
      // the only way to reliably capture a long API error on a phone.
      el.textContent = message + '　—— 點一下複製';
      el.className = 'show bad';
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      el.onclick = function () {
        var done = function (text) {
          el.textContent = text;
          toastTimer = setTimeout(function () { el.className = ''; el.style.pointerEvents = 'none'; }, 1400);
        };
        try {
          navigator.clipboard.writeText(message)
            .then(function () { done('已複製錯誤訊息 ✓'); })
            .catch(function () { done('複製失敗，請長按文字手動選取'); });
        } catch (e) { done('複製失敗，請長按文字手動選取'); }
      };
      // A long backstop so a truly ignored error still clears eventually.
      toastTimer = setTimeout(function () { el.className = ''; el.style.pointerEvents = 'none'; }, 60000);
    } else {
      el.textContent = message;
      el.className = 'show';
      el.style.pointerEvents = 'none';
      toastTimer = setTimeout(function () { el.className = ''; }, 2400);
    }
  }

  // ── Image storage ────────────────────────────────────────────────
  //
  // Generated images are megabytes of base64 each. localStorage would blow its
  // quota after a handful, so they go to IndexedDB and only the object URL is held
  // in memory. Everything survives a reload, which is the whole point of a wall you
  // come back to.
  var DB_NAME = 'spellbox-poster';
  var STORE = 'shots';
  var dbPromise = null;

  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (typeof indexedDB === 'undefined') { reject(new Error('no indexeddb')); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    dbPromise.catch(function () { dbPromise = null; });
    return dbPromise;
  }

  function tx(mode, run) {
    return db().then(function (database) {
      return new Promise(function (resolve, reject) {
        var req = run(database.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  var shots = {};        // id -> object URL, for rendering
  var shotBlobs = {};    // id -> Blob, for download

  function putShot(id, blob) {
    shotBlobs[id] = blob;
    if (shots[id]) URL.revokeObjectURL(shots[id]);
    shots[id] = URL.createObjectURL(blob);
    return tx('readwrite', function (s) { return s.put(blob, id); }).catch(function () {
      toast('圖已顯示，但存不進瀏覽器資料庫（可能空間已滿），重新整理後會消失', true);
    });
  }

  function loadShots() {
    return tx('readonly', function (s) { return s.getAllKeys(); })
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          return tx('readonly', function (s) { return s.get(key); }).then(function (blob) {
            if (blob) { shotBlobs[key] = blob; shots[key] = URL.createObjectURL(blob); }
          });
        }));
      })
      .catch(function () { /* First visit, or IndexedDB unavailable. */ });
  }

  // ── Prompt composition ───────────────────────────────────────────
  //
  // Mirrors the app: a finished prompt goes out as-is and a typed subject is
  // appended as an override, while a style clause needs the subject in front.
  function compose(entry) {
    var subject = $('subject').value.trim();
    if (entry.f) return subject ? entry.p + ' Subject: ' + subject + '.' : entry.p;
    if (!subject) return 'Create any subject that best demonstrates this style. ' + entry.p;
    return subject + '. ' + entry.p;
  }

  // ── Generation ───────────────────────────────────────────────────
  function base64ToBlob(base64, mime) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime || 'image/png' });
  }

  /** data: URI -> { mimeType, data } for an inline API part. */
  function splitDataUri(uri) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(uri || '');
    return m ? { mimeType: m[1], data: m[2] } : null;
  }

  /** "51s" / "1m3s" / "1.5s" -> whole seconds (0 if unparseable). */
  function delaySeconds(raw) {
    var s = 0, m;
    if ((m = /(\d+)m/.exec(raw))) s += parseInt(m[1], 10) * 60;
    if ((m = /([\d.]+)s/.exec(raw))) s += Math.round(parseFloat(m[1]));
    return s;
  }

  /** seconds -> a human 中文 span like "51 秒" or "1 分 3 秒" ('' if 0). */
  function humanDelay(raw) {
    var s = delaySeconds(raw);
    if (!s) return '';
    if (s < 60) return s + ' 秒';
    var mins = Math.floor(s / 60), secs = s % 60;
    return secs ? mins + ' 分 ' + secs + ' 秒' : mins + ' 分鐘';
  }

  /**
   * Reads a 429 (RESOURCE_EXHAUSTED) into { message, seconds, perDay, perMin } — which
   * limit was hit and when it lifts — taking the numbers from Google's own error
   * details (RetryInfo.retryDelay, QuotaFailure.violations[].quotaId), not a guess.
   * A daily free quota resets at Pacific midnight; a per-minute limit lifts in seconds.
   * `seconds` drives the automatic retry so the user never has to time it by hand.
   */
  function quotaInfo(data) {
    var details = (data.error && data.error.details) || [];
    var raw = '', quotaId = '';
    for (var i = 0; i < details.length; i++) {
      var d = details[i] || {};
      if (d.retryDelay) raw = d.retryDelay;
      var v = d.violations && d.violations[0];
      if (v && (v.quotaId || v.quotaMetric)) quotaId = v.quotaId || v.quotaMetric;
    }
    var perDay = /per\s*day|PerDay/i.test(quotaId);
    var perMin = /per\s*minute|PerMinute/i.test(quotaId);
    var human = humanDelay(raw);

    var message;
    if (perDay) {
      message = '今天的免費額度用完了。免費層每天會重置一次——重置點是「太平洋時間午夜」，' +
        '換算台灣大約是下午 3～4 點（依日光節約時間會差一小時）。' +
        '想立刻解除，可到 Google Cloud 幫這把金鑰綁信用卡改用付費層；否則等重置後就能再生成。';
    } else if (perMin) {
      message = '每分鐘的免費次數到了' + (human ? '，約 ' + human + '後恢復' : '') + '，稍等再按一次「⚡ 生成」。';
    } else {
      message = '已達 Google 免費用量上限' + (human ? '，Google 建議約 ' + human + '後再試' : '，等一下再試') + '。';
    }
    return { message: message, seconds: delaySeconds(raw), perDay: perDay, perMin: perMin };
  }

  function generate(entry) {
    var key = read(STORE_KEY, '');
    var model = read(STORE_MODEL, DEFAULT_MODEL);
    var ratio = read(STORE_RATIO, '3:4');

    // Two model families, two protocols. Imagen (paid) answers :predict with
    // instances/parameters; the Gemini native image models (free tier, with limits)
    // answer :generateContent with an inline-image part. The model name decides which,
    // so switching model in settings is all it takes — no separate toggle.
    var isImagen = model.indexOf('imagen') === 0;
    var method = isImagen ? 'predict' : 'generateContent';

    var body;
    if (isImagen) {
      // Imagen predict is text-only; a reference photo can't ride along.
      body = { instances: { prompt: compose(entry) }, parameters: { sampleCount: 1, aspectRatio: ratio } };
    } else {
      var parts = [];
      var ref = splitDataUri(subjectImage);
      var text = compose(entry);
      if (ref) {
        // Upload-once, apply-to-any-style: the reference photo leads, and the prompt
        // is rewritten to keep that person's face while adopting the style.
        parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
        text =
          'Using the person in the provided photo — keep their face and identity — ' +
          'restyle them as: ' + text;
      }
      parts.push({ text: text });
      body = {
        contents: [{ role: 'user', parts: parts }],
        // Both modalities on purpose: gemini-2.0-flash-preview-image-generation
        // rejects an IMAGE-only request ("combination of response modalities is not
        // supported"), and the 2.5 model is happy with both. We keep only the image
        // part from the reply regardless.
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: ratio } },
      };
    }

    // The key is left off the URL when blank on purpose: inside Google AI Studio's
    // canvas the environment injects credentials, and that is the one place this
    // works without a key of your own.
    var url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) + ':' + method +
      (key ? '?key=' + encodeURIComponent(key) : '');

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (response) {
        return response.json().then(function (data) { return { response: response, data: data }; });
      })
      .then(function (result) {
        var data = result.data;
        if (!result.response.ok) {
          var detail = (data.error && data.error.message) || ('HTTP ' + result.response.status);
          if (!key && (result.response.status === 401 || result.response.status === 403)) {
            throw new Error('需要 API 金鑰。按右上角「⚙ 設定」貼上你的 Google 金鑰。（原始訊息：' + detail + '）');
          }
          // 429 first: a quota message can mention "billing" ("enable billing to raise
          // quota"), which must not be mistaken for a hard paid-tier block below. Carry
          // the retry seconds so the caller can wait it out automatically.
          if (result.response.status === 429) {
            var q = quotaInfo(data);
            var rateErr = new Error(q.message);
            rateErr.retryAfter = q.seconds;
            rateErr.perDay = q.perDay;
            throw rateErr;
          }
          if (/billed|billing|paid tier/i.test(detail)) {
            if (isImagen) {
              throw new Error(
                'imagen 系列要綁信用卡才能用。改用免費的就好：按「⚙ 設定」→「偵測可用模型」→ ' +
                '挑一個 gemini 開頭的 → 儲存 → 再生成。'
              );
            }
            // A gemini model that still returns a billing error means Google has put
            // image output behind the paid tier for THIS account. Don't blame imagen —
            // show Google's own words so we can see the real reason.
            throw new Error(
              '模型「' + model + '」在你的帳號被 Google 歸到「付費層」，免費金鑰被擋下。' +
              'Google 原話：「' + detail + '」。可到「⚙ 設定」→「偵測可用模型」換另一個免費模型試；' +
              '若每個都要付費，代表你帳號的免費層目前沒開放圖片生成。'
            );
          }
          if (result.response.status === 404) {
            throw new Error(
              '你的金鑰用不了模型「' + model + '」（這個名稱在你的帳號或地區沒開放）。' +
              '到「⚙ 設定」按「偵測可用模型」，讓系統列出這把金鑰真正能用的圖片模型，再選一個。'
            );
          }
          throw new Error(detail);
        }

        // Imagen 回在 predictions[]，Gemini 回在 candidates[].content.parts[].inlineData。
        var prediction = data.predictions && data.predictions[0];
        if (prediction && prediction.bytesBase64Encoded) {
          return base64ToBlob(prediction.bytesBase64Encoded, 'image/png');
        }
        var parts = (data.candidates && data.candidates[0] && data.candidates[0].content &&
                     data.candidates[0].content.parts) || [];
        for (var i = 0; i < parts.length; i++) {
          var inline = parts[i].inlineData || parts[i].inline_data;
          if (inline && inline.data) {
            return base64ToBlob(inline.data, inline.mimeType || inline.mime_type);
          }
        }
        var reason = (prediction && prediction.raiFilteredReason) ||
                     (data.promptFeedback && data.promptFeedback.blockReason) ||
                     (data.candidates && data.candidates[0] && data.candidates[0].finishReason);
        throw new Error(reason
          ? '沒有生成出圖片，Google 給的原因是 ' + reason
          : '沒有生成出圖片，可能被安全過濾擋掉了。換一則或改寫試試。');
      });
  }

  // ── Cards ────────────────────────────────────────────────────────
  var state = { group: 'all', query: '', onlyShot: false, shown: 0, list: [] };
  var busy = {};

  function paintShot(card, entry) {
    var shot = card.querySelector('.shot');
    shot.innerHTML = '';

    if (busy[entry.i]) {
      var overlay = document.createElement('div');
      overlay.className = 'overlay';
      overlay.innerHTML = '<div class="spin"></div><div class="label">Generating…</div>';
      shot.appendChild(overlay);
      return;
    }

    if (shots[entry.i]) {
      var img = document.createElement('img');
      img.src = shots[entry.i];
      img.alt = entry.t;
      img.loading = 'lazy';
      img.addEventListener('click', function () { openLightbox(entry); });
      shot.appendChild(img);
      var badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = '點圖看原圖';
      shot.appendChild(badge);
      return;
    }

    var placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML =
      '<span class="mark"></span><span class="hint">No image yet · click draw</span>';
    placeholder.querySelector('.mark').textContent = entry.t.slice(0, 1);
    shot.appendChild(placeholder);
  }

  function buildCard(entry) {
    var card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = entry.i;

    var shot = document.createElement('div');
    shot.className = 'shot';
    card.appendChild(shot);

    var body = document.createElement('div');
    body.className = 'body';

    var group = document.createElement('div');
    group.className = 'group';
    group.textContent = entry.g;
    body.appendChild(group);

    var name = document.createElement('div');
    name.className = 'name';
    name.textContent = entry.t;
    body.appendChild(name);

    if (entry.s) {
      var sub = document.createElement('div');
      sub.className = 'sub';
      sub.textContent = '(' + entry.s + ')';
      body.appendChild(sub);
    }
    if (entry.d) {
      var desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = entry.d;
      body.appendChild(desc);
    }

    var prompt = document.createElement('div');
    prompt.className = 'prompt';
    prompt.textContent = entry.p;
    prompt.title = '點一下展開／收合';
    prompt.addEventListener('click', function () { prompt.classList.toggle('open'); });
    body.appendChild(prompt);

    var actions = document.createElement('div');
    actions.className = 'actions';

    var copy = document.createElement('button');
    copy.className = 'btn';
    copy.textContent = '複製';
    copy.addEventListener('click', function () {
      var text = compose(entry);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { toast('提示詞已複製'); },
          function () { toast('複製失敗', true); }
        );
      }
    });

    // Free path: the Gemini consumer web app generates images for free (the API's
    // free tier does not — every image model is 免費方案「無法使用」). This copies the
    // prompt and opens Gemini so you paste and generate there at no cost.
    var gem = document.createElement('button');
    gem.className = 'btn';
    gem.textContent = '↗ Gemini';
    gem.title = '免費：複製提示詞並開啟 Gemini 網頁，貼上就生圖';
    gem.addEventListener('click', function () {
      var text = 'Generate an image from this exact description:\n\n' + compose(entry);
      // Open synchronously inside the gesture so iOS Safari doesn't block the tab.
      window.open('https://gemini.google.com/app', '_blank', 'noopener');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { toast('提示詞已複製！到剛開的 Gemini 分頁長按→貼上，就免費生圖'); },
          function () { toast('已開 Gemini，但複製失敗——回來按「複製」再貼過去', true); }
        );
      } else {
        toast('已開 Gemini，回來按「複製」把提示詞貼過去');
      }
    });

    var draw = document.createElement('button');
    draw.className = 'btn primary';
    draw.textContent = '⚡ 生成';
    draw.title = 'API 金鑰生成（需付費層，免費層無法生圖）';
    draw.addEventListener('click', function () { runDraw(entry); });

    actions.appendChild(copy);
    actions.appendChild(gem);
    actions.appendChild(draw);
    body.appendChild(actions);
    card.appendChild(body);

    paintShot(card, entry);
    return card;
  }

  function cardFor(id) { return $('grid').querySelector('[data-id="' + CSS.escape(id) + '"]'); }

  function refreshCard(entry) {
    var card = cardFor(entry.i);
    if (!card) return;
    paintShot(card, entry);
    var draw = card.querySelector('.btn.primary');
    draw.disabled = !!busy[entry.i];
    draw.textContent = busy[entry.i] ? '生成中' : '⚡ 生成';
  }

  // Free-tier image models rate-limit hard, and every manual re-press during the
  // cooldown makes Google's back-off worse. So on a per-minute 429 the app waits the
  // cooldown out itself and retries — the user presses once. A few tries; if they all
  // hit the limit, the free quota is effectively zero and we say so plainly.
  var MAX_AUTO_RETRY = 4;

  function setOverlayLabel(entry, text) {
    var card = cardFor(entry.i);
    if (!card) return;
    var label = card.querySelector('.overlay .label');
    if (label) label.textContent = text;
  }

  function finishDraw(entry) {
    delete busy[entry.i];
    refreshCard(entry);
    updateCount();
  }

  function attemptDraw(entry, attempt) {
    generate(entry)
      .then(function (blob) { return putShot(entry.i, blob); })
      .then(function () { toast('「' + entry.t + '」畫好了'); finishDraw(entry); })
      .catch(function (error) {
        // Only per-minute limits are worth waiting out; a daily cap or a real error
        // won't clear in seconds.
        var canWait = error && error.retryAfter && !error.perDay;
        if (canWait && attempt < MAX_AUTO_RETRY) {
          // +2s buffer so we clear the window; cap so one wait can't run away.
          countdownRetry(entry, Math.min(error.retryAfter + 2, 45), attempt);
          return;
        }
        if (canWait) {
          toast(
            '自動重試 ' + MAX_AUTO_RETRY + ' 次都被「每分鐘上限」擋住，代表這把免費金鑰對這顆圖片模型的額度極少或為 0。' +
            '免費要出圖：用卡片「複製」把提示詞貼到 gemini.google.com 自己生，或跟我說要改用「後端代持」（借你登入的 Gemini 網頁帳號自動生）。',
            true
          );
        } else {
          toast(error.message || String(error), true);
        }
        finishDraw(entry);
      });
  }

  function countdownRetry(entry, secs, attempt) {
    var remaining = secs;
    setOverlayLabel(entry, '額度回血中，' + remaining + ' 秒後自動重試…');
    var timer = setInterval(function () {
      remaining -= 1;
      if (remaining > 0) {
        setOverlayLabel(entry, '額度回血中，' + remaining + ' 秒後自動重試…');
        return;
      }
      clearInterval(timer);
      setOverlayLabel(entry, '重試中…');
      attemptDraw(entry, attempt + 1);
    }, 1000);
  }

  function runDraw(entry) {
    if (busy[entry.i]) return;
    busy[entry.i] = true;
    refreshCard(entry);
    attemptDraw(entry, 0);
  }

  // ── Filtering and paging ─────────────────────────────────────────
  function applyFilter() {
    var q = state.query.trim().toLowerCase();
    state.list = ENTRIES.filter(function (entry) {
      if (state.group !== 'all' && entry.g !== state.group) return false;
      if (state.onlyShot && !shots[entry.i]) return false;
      if (!q) return true;
      return (entry.t + ' ' + entry.s + ' ' + entry.d + ' ' + entry.g + ' ' + entry.p)
        .toLowerCase().indexOf(q) !== -1;
    });
    state.shown = 0;
    $('grid').innerHTML = '';
    showMore();
    updateCount();
  }

  function showMore() {
    var grid = $('grid');
    var slice = state.list.slice(state.shown, state.shown + PAGE);
    var fragment = document.createDocumentFragment();
    slice.forEach(function (entry) { fragment.appendChild(buildCard(entry)); });
    grid.appendChild(fragment);
    state.shown += slice.length;

    $('end').textContent = state.shown >= state.list.length
      ? (state.list.length ? '— 已經是全部 ' + state.list.length + ' 則 —' : '沒有符合的項目')
      : '往下捲載入更多…';
  }

  function updateCount() {
    var withShot = Object.keys(shots).length;
    $('count').textContent =
      ENTRIES.length + ' 則 · 已生成 ' + withShot + ' 張' +
      (state.list.length !== ENTRIES.length ? ' · 目前顯示 ' + state.list.length : '');
  }

  // ── Lightbox ─────────────────────────────────────────────────────
  var viewing = null;
  function openLightbox(entry) {
    viewing = entry;
    $('lightboxImg').src = shots[entry.i];
    $('lightbox').classList.add('show');
  }
  function closeLightbox() {
    $('lightbox').classList.remove('show');
    viewing = null;
  }

  $('closeLightbox').addEventListener('click', closeLightbox);
  $('lightbox').addEventListener('click', function (event) {
    if (event.target === $('lightbox')) closeLightbox();
  });
  $('downloadBtn').addEventListener('click', function () {
    if (!viewing || !shotBlobs[viewing.i]) return;
    var url = URL.createObjectURL(shotBlobs[viewing.i]);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'spellbox-' + viewing.i + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });
  $('regenBtn').addEventListener('click', function () {
    if (!viewing) return;
    var entry = viewing;
    closeLightbox();
    runDraw(entry);
  });

  // ── Settings ─────────────────────────────────────────────────────

  // A saved model may not be one of the built-in <option>s — e.g. a name that
  // 「偵測可用模型」found for this key. Add it so the select shows it as selected
  // rather than silently falling back to the first option.
  function ensureOption(select, value) {
    if (!value) return;
    var has = Array.prototype.some.call(select.options, function (o) { return o.value === value; });
    if (has) return;
    var opt = document.createElement('option');
    opt.value = value;
    opt.textContent = (value.indexOf('imagen') === 0 ? '付費 · ' : '免費 · ') + value;
    select.insertBefore(opt, select.firstChild);
  }

  $('openSettings').addEventListener('click', function () {
    $('keyInput').value = read(STORE_KEY, '');
    var model = read(STORE_MODEL, DEFAULT_MODEL);
    ensureOption($('modelInput'), model);
    $('modelInput').value = model;
    $('ratioInput').value = read(STORE_RATIO, '3:4');
    $('settings').classList.add('show');
  });

  // 「偵測可用模型」：拿目前這把金鑰去問 Google 有哪些模型，挑出會出圖的，直接填進
  // 下拉選單。這樣就不用對著一個帳號其實用不了的名稱一直猜——不同帳號、不同地區能用
  // 的圖片模型不一樣，讓金鑰自己說了算。
  function detectModels() {
    var key = $('keyInput').value.trim() || read(STORE_KEY, '');
    if (!key) { toast('請先在上面貼上 Google API 金鑰，再偵測', true); return; }
    var btn = $('detectModels');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = '偵測中…';
    fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=' +
          encodeURIComponent(key))
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; });
      })
      .then(function (res) {
        if (!res.ok) {
          throw new Error((res.data.error && res.data.error.message) || ('HTTP ' + res.status));
        }
        var models = res.data.models || [];
        var image = models.filter(function (m) {
          var name = (m.name || '').replace(/^models\//, '');
          var methods = m.supportedGenerationMethods || [];
          var canGen = methods.indexOf('generateContent') !== -1 || methods.indexOf('predict') !== -1;
          // 名稱含 image / imagen 的才是真的會出圖的那批。
          return canGen && /image|imagen/i.test(name);
        }).map(function (m) { return (m.name || '').replace(/^models\//, ''); });

        if (!image.length) {
          toast('這把金鑰目前沒有可用的圖片模型（可能地區未開放，或此金鑰無權限）', true);
          return;
        }

        var select = $('modelInput');
        select.innerHTML = '';
        image.forEach(function (name) {
          var opt = document.createElement('option');
          opt.value = name;
          opt.textContent = (name.indexOf('imagen') === 0 ? '付費 · ' : '免費 · ') + name;
          select.appendChild(opt);
        });
        // 預設挑第一個免費（gemini）的；沒有免費的才退而用第一個。
        var free = image.filter(function (n) { return n.indexOf('imagen') !== 0; });
        select.value = free[0] || image[0];
        toast('找到 ' + image.length + ' 個可用圖片模型，已自動填入，記得按「儲存」');
      })
      .catch(function (e) { toast('偵測失敗：' + (e.message || String(e)), true); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  }
  $('detectModels').addEventListener('click', detectModels);

  var closeSettings = function () { $('settings').classList.remove('show'); };
  $('closeSettings').addEventListener('click', closeSettings);
  $('settings').addEventListener('click', function (event) {
    if (event.target === $('settings')) closeSettings();
  });
  $('saveSettings').addEventListener('click', function () {
    try {
      var chosen = $('modelInput').value.trim() || DEFAULT_MODEL;
      localStorage.setItem(STORE_KEY, $('keyInput').value.trim());
      localStorage.setItem(STORE_MODEL, chosen);
      localStorage.setItem(STORE_RATIO, $('ratioInput').value);
      // Name the saved model so it's obvious which one the next 生成 will use.
      toast('已儲存，模型：' + chosen);
    } catch (e) {
      toast('存不進瀏覽器設定', true);
    }
    closeSettings();
  });
  $('clearImages').addEventListener('click', function () {
    if (!window.confirm('要刪掉所有已生成的圖嗎？這個動作無法復原。')) return;
    tx('readwrite', function (s) { return s.clear(); })
      .catch(function () {})
      .then(function () {
        Object.keys(shots).forEach(function (id) { URL.revokeObjectURL(shots[id]); });
        shots = {};
        shotBlobs = {};
        closeSettings();
        applyFilter();
        toast('已清空');
      });
  });

  // ── Chips and inputs ─────────────────────────────────────────────
  function buildChips() {
    var chips = $('chips');
    var counts = {};
    ENTRIES.forEach(function (entry) { counts[entry.g] = (counts[entry.g] || 0) + 1; });

    var make = function (label, value, n) {
      var chip = document.createElement('button');
      chip.className = 'chip' + (value === state.group ? ' on' : '');
      chip.innerHTML = '<span></span><span class="n"></span>';
      chip.firstChild.textContent = label;
      chip.lastChild.textContent = n;
      chip.addEventListener('click', function () {
        state.group = value;
        Array.prototype.forEach.call(chips.children, function (c) { c.classList.remove('on'); });
        chip.classList.add('on');
        applyFilter();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return chip;
    };

    chips.appendChild(make('全部', 'all', ENTRIES.length));
    GROUPS.forEach(function (group) { chips.appendChild(make(group, group, counts[group] || 0)); });
  }

  // ── Reference photo (upload once, apply to any style) ────────────
  function renderFace() {
    var preview = $('facePreview');
    var clear = $('faceClear');
    var hint = $('faceHint');
    if (subjectImage) {
      preview.src = subjectImage;
      preview.style.display = 'block';
      clear.style.display = 'inline-flex';
      hint.textContent = '已套用你的照片 · 按任一張「⚡ 生成」就會把你的臉放進那個風格';
    } else {
      preview.removeAttribute('src');
      preview.style.display = 'none';
      clear.style.display = 'none';
      hint.textContent = '上傳一張照片（例如大頭照），之後點任何風格都直接套用，不用每張重傳';
    }
  }

  function setFace(dataUri) {
    subjectImage = dataUri || null;
    try {
      if (dataUri) localStorage.setItem(STORE_FACE, dataUri);
      else localStorage.removeItem(STORE_FACE);
    } catch (e) {
      // Face too big for localStorage; keep it in memory for this session at least.
    }
    renderFace();
  }

  // Downscale the upload so it fits localStorage and travels light to the API.
  function loadFaceFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('請選圖片檔', true); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 768;
        var scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.round(img.naturalWidth * scale);
        var h = Math.round(img.naturalHeight * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setFace(canvas.toDataURL('image/jpeg', 0.9));
        toast('照片已套用');
      };
      img.onerror = function () { toast('讀不到這張圖，換一張', true); };
      img.src = String(reader.result);
    };
    reader.onerror = function () { toast('讀取失敗', true); };
    reader.readAsDataURL(file);
  }

  $('faceInput').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) loadFaceFile(e.target.files[0]);
    e.target.value = '';
  });
  $('faceClear').addEventListener('click', function () { setFace(null); toast('已移除照片'); });

  var debounce = null;
  $('search').addEventListener('input', function (event) {
    clearTimeout(debounce);
    var value = event.target.value;
    debounce = setTimeout(function () { state.query = value; applyFilter(); }, 180);
  });
  $('onlyShot').addEventListener('click', function () {
    state.onlyShot = !state.onlyShot;
    $('onlyShot').classList.toggle('on', state.onlyShot);
    applyFilter();
  });

  // Infinite scroll: 634 cards mounted at once is a slow first paint for no reason.
  window.addEventListener('scroll', function () {
    if (state.shown >= state.list.length) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 900) showMore();
  }, { passive: true });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closeLightbox(); closeSettings(); }
  });

  // ── Boot ─────────────────────────────────────────────────────────
  buildChips();
  renderFace();
  loadShots().then(function () {
    applyFilter();
    var restored = Object.keys(shots).length;
    if (restored) toast('已載回 ' + restored + ' 張之前生成的圖');
  });
})();
