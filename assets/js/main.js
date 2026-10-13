(function () {
  "use strict";

  const cfg = window.SPEECHEQ_CONFIG;
  if (!cfg) {
    console.error("SPEECHEQ_CONFIG missing");
    return;
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function setHero() {
    document.title = cfg.pageTitle + " — anonymized demo";
    const h1 = $("#page-title");
    if (h1) h1.textContent = cfg.pageTitle;
    const sub = $("#page-subtitle");
    if (sub) sub.textContent = cfg.subtitle;
    const note = $("#page-anon-note");
    if (note) note.textContent = cfg.anonymizationNote;
    const pre = $("#bibtex-content");
    if (pre) pre.textContent = cfg.bibtex.trim();
  }

  let sortKey = "seq";
  let sortDir = "desc";

  function meanScores(m) {
    const s = m.scores;
    return s.reduce((a, b) => a + b, 0) / s.length;
  }

  function mainScaleScores(m) {
    const out = [];
    const subs = m.scores;
    for (let i = 0; i < cfg.eqMainScales.length; i++) {
      const start = i * 3;
      const triplet = subs.slice(start, start + 3);
      const sum = triplet.reduce(function (a, b) { return a + b; }, 0);
      out.push(sum / Math.max(triplet.length, 1));
    }
    return out;
  }

  function median(arr) {
    const xs = arr.slice().sort(function (a, b) { return a - b; });
    const n = xs.length;
    if (n === 0) return 0;
    return n % 2 === 1 ? xs[(n - 1) / 2] : (xs[n / 2 - 1] + xs[n / 2]) / 2;
  }

  function mad(arr) {
    const med = median(arr);
    return median(arr.map(function (x) { return Math.abs(x - med); }));
  }

  function seqNormalize(values) {
    const med = median(values);
    const m = mad(values);
    const denom = 1.4826 * m;
    if (denom === 0) {
      return values.map(function () { return 100; });
    }
    return values.map(function (x) {
      return 100 + 15 * (x - med) / denom;
    });
  }

  function computeMainSeqMatrix(mods) {
    const n = mods.length;
    const k = cfg.eqMainScales.length;
    const perScale = mods.map(function (m) { return mainScaleScores(m); });
    const matrix = [];
    for (let j = 0; j < k; j++) {
      const col = perScale.map(function (row) { return row[j]; });
      const seqCol = seqNormalize(col);
      for (let i = 0; i < n; i++) {
        if (!matrix[i]) matrix[i] = [];
        matrix[i][j] = seqCol[i];
      }
    }
    return { perScale: perScale, mainSeq: matrix };
  }

  const _agg = computeMainSeqMatrix(cfg.models);
  const MAIN_SCALE_SCORES = _agg.perScale;
  const MAIN_SEQ = _agg.mainSeq;

  function normalizedModels(mods) {
    return mods.map(function (m, i) {
      const overall =
        typeof m.overall === "number" ? m.overall : meanScores(m);
      const seq = typeof m.seq === "number" ? m.seq : null;
      return {
        raw: m,
        overall: overall,
        seq: seq,
        mainScores: MAIN_SCALE_SCORES[i],
        mainSeq: MAIN_SEQ[i],
        originalIndex: i,
      };
    });
  }

  function compare(a, b, key) {
    if (key === "rank") {
      return a.originalIndex - b.originalIndex;
    }
    if (key === "id") {
      return String(a.raw.id).localeCompare(String(b.raw.id));
    }
    if (key === "type") {
      return String(a.raw.type).localeCompare(String(b.raw.type));
    }
    if (key === "overall") {
      return a.overall - b.overall;
    }
    if (key === "seq") {
      return (a.seq ?? -Infinity) - (b.seq ?? -Infinity);
    }
    const mainMatch = /^main(\d+)$/.exec(key);
    if (mainMatch) {
      const idx = parseInt(mainMatch[1], 10);
      return a.mainScores[idx] - b.mainScores[idx];
    }
    return 0;
  }

  function sortModels(mods) {
    const wrapped = normalizedModels(mods).map(function (w, i) {
      return Object.assign({}, w, { __idx: i });
    });
    wrapped.sort(function (a, b) {
      const c = compare(a, b, sortKey);
      const dir = sortDir === "asc" ? 1 : -1;
      if (c !== 0) return c * dir;
      if (sortKey !== "seq") {
        const cs = (b.seq ?? -Infinity) - (a.seq ?? -Infinity);
        if (cs !== 0) return cs;
      }
      if (sortKey !== "overall") {
        const co = b.overall - a.overall;
        if (co !== 0) return co;
      }
      return a.__idx - b.__idx;
    });
    wrapped.forEach(function (w, i) {
      w.__rank = i + 1;
    });
    return wrapped;
  }

  function renderLeaderboard() {
    const table = $("#leaderboard-table");
    if (!table) return;
    const theadRow = table.querySelector("thead tr");
    const existingMain = theadRow.querySelectorAll("[data-main]");
    existingMain.forEach(function (th) {
      th.remove();
    });

    cfg.eqMainScales.forEach(function (label, i) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = label;
      th.className = "sortable th-main";
      th.dataset.sort = "main" + i;
      th.dataset.main = "1";
      th.title = label + " (mean of 3 subscales)";
      theadRow.appendChild(th);
    });

    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    const sorted = sortModels(cfg.models.slice());
    sorted.forEach(function (row) {
      const tr = document.createElement("tr");
      tr.dataset.modelId = row.raw.id;

      const tdRank = document.createElement("td");
      tdRank.textContent = String(row.__rank);
      tr.appendChild(tdRank);

      const tdId = document.createElement("td");
      tdId.textContent = row.raw.id;
      tr.appendChild(tdId);

      const tdType = document.createElement("td");
      tdType.textContent = row.raw.type;
      tr.appendChild(tdType);

      const tdSeq = document.createElement("td");
      tdSeq.textContent = row.seq === null ? "—" : row.seq.toFixed(1);
      tdSeq.dataset.num = String(row.seq === null ? -Infinity : row.seq);
      tdSeq.className = "td-seq";
      tr.appendChild(tdSeq);

      const tdOverall = document.createElement("td");
      tdOverall.textContent = row.overall.toFixed(1) + "%";
      tdOverall.dataset.num = String(row.overall);
      tr.appendChild(tdOverall);

      row.mainScores.forEach(function (score) {
        const td = document.createElement("td");
        const x = typeof score === "number" ? score : parseFloat(score);
        td.textContent = (isNaN(x) ? score : x.toFixed(1)) + "%";
        td.dataset.num = String(isNaN(x) ? 0 : x);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    updateSortIndicators(table);
  }

  function updateSortIndicators(table) {
    table.querySelectorAll("th.sortable").forEach(function (th) {
      th.classList.remove("sort-asc", "sort-desc");
      if (th.dataset.sort === sortKey) {
        th.classList.add(sortDir === "asc" ? "sort-asc" : "sort-desc");
      }
    });
  }

  function attachSortHandlers() {
    const table = $("#leaderboard-table");
    if (!table) return;
    table.querySelector("thead").addEventListener("click", function (e) {
      const th = e.target.closest("th.sortable");
      if (!th || !table.contains(th)) return;
      const key = th.dataset.sort;
      if (!key) return;

      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir =
          key === "id" || key === "type" || key === "rank" ? "asc" : "desc";
      }

      renderLeaderboard();
    });
  }

  let radarChart = null;

  const radarVisible = cfg.models.map(function () { return true; });

  function renderRadarToggleBar() {
    const bar = $("#radar-toggle-bar");
    if (!bar) return;
    bar.innerHTML = "";
    cfg.models.forEach(function (m, i) {
      const border = cfg.radarBorder[i % cfg.radarBorder.length];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "radar-toggle";
      btn.dataset.modelIndex = String(i);
      btn.setAttribute("aria-pressed", radarVisible[i] ? "true" : "false");
      if (radarVisible[i]) btn.classList.add("is-on");
      btn.style.setProperty("--chip-color", border);
      btn.innerHTML =
        '<span class="radar-toggle-dot" aria-hidden="true"></span>' +
        '<span class="radar-toggle-label"></span>';
      btn.querySelector(".radar-toggle-label").textContent = m.id;
      btn.addEventListener("click", function () {
        radarVisible[i] = !radarVisible[i];
        btn.classList.toggle("is-on", radarVisible[i]);
        btn.setAttribute("aria-pressed", radarVisible[i] ? "true" : "false");
        applyRadarVisibility();
      });
      bar.appendChild(btn);
    });
  }

  function applyRadarVisibility() {
    if (!radarChart) return;
    cfg.models.forEach(function (_m, i) {
      radarChart.setDatasetVisibility(i, radarVisible[i]);
    });
    radarChart.update();
  }

  const RADAR_MIN = 40;
  const RADAR_MAX = 160;

  function clampForRadar(values) {
    return values.map(function (v) {
      if (v == null || isNaN(v)) return RADAR_MIN;
      if (v > RADAR_MAX) return RADAR_MAX;
      if (v < RADAR_MIN) return RADAR_MIN;
      return v;
    });
  }

  function renderRadar() {
    const canvas = $("#radar-chart");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = cfg.eqAxes;
    const datasets = cfg.models.map(function (m, i) {
      const fill = cfg.radarPalette[i % cfg.radarPalette.length];
      const border = cfg.radarBorder[i % cfg.radarBorder.length];
      const raw = (m.seqScores || m.scores).slice();
      return {
        label: m.id,
        data: clampForRadar(raw),
        rawSeq: raw,
        fill: true,
        backgroundColor: fill,
        borderColor: border,
        borderWidth: 2,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        hidden: !radarVisible[i],
      };
    });

    if (radarChart) {
      radarChart.destroy();
    }

    radarChart = new Chart(canvas.getContext("2d"), {
      type: "radar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                if (!items.length) return "";
                const i = items[0].dataIndex;
                return cfg.axisTitles && cfg.axisTitles[i] ? cfg.axisTitles[i] : labels[i];
              },
              label: function (ctx) {
                const ds = ctx.dataset;
                const raw = ds.rawSeq ? ds.rawSeq[ctx.dataIndex] : null;
                if (raw == null) return ds.label + ": " + ctx.formattedValue;
                const clamped = (raw > RADAR_MAX || raw < RADAR_MIN);
                const note = clamped ? "  (raw " + raw.toFixed(2) + ", clipped)" : "";
                return ds.label + ": SEQ " + raw.toFixed(2) + (clamped ? note : "");
              },
            },
          },
        },
        scales: {
          r: {
            min: RADAR_MIN,
            max: RADAR_MAX,
            ticks: {
              stepSize: 20,
              backdropColor: "transparent",
              callback: function (v) {
                return v;
              },
            },
            pointLabels: {
              font: { size: 10 },
            },
            grid: {
              circular: true,
            },
          },
        },
      },
    });
  }

  function attachBibtexCopy() {
    const btn = $("#copy-bibtex");
    if (!btn) return;
    btn.addEventListener("click", function () {
      const text = cfg.bibtex.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          const prev = btn.textContent;
          btn.textContent = "Copied";
          setTimeout(function () {
            btn.textContent = prev;
          }, 1500);
        });
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          btn.textContent = "Copied";
        } catch (e) {
          btn.textContent = "Copy failed";
        }
        document.body.removeChild(ta);
        setTimeout(function () {
          btn.textContent = "Copy BibTeX";
        }, 1500);
      }
    });
  }

  setHero();
  renderLeaderboard();
  attachSortHandlers();
  renderRadarToggleBar();
  renderRadar();
  attachBibtexCopy();
})();

/* -------------------------------------------------------------------------
 * Examples carousel
 * Header (subscale title + N/15 counter) above a single scenario card,
 * with dot indicators, prev/next arrows, and Left/Right arrow keys.
 * Data comes from window.SPEECHEQ_EXAMPLES (see scripts/build_examples.py).
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";

  const examples = window.SPEECHEQ_EXAMPLES;
  if (!Array.isArray(examples) || examples.length === 0) return;

  const root = document.getElementById("examples-carousel");
  const eyebrowEl = document.getElementById("examples-eyebrow");
  const scaleEl = document.getElementById("examples-scale");
  const counterEl = document.getElementById("examples-counter");
  const stage = document.getElementById("examples-stage");
  const dotsEl = document.getElementById("examples-dots");
  const prevBtns = root ? Array.prototype.slice.call(root.querySelectorAll(".examples-arrow-prev")) : [];
  const nextBtns = root ? Array.prototype.slice.call(root.querySelectorAll(".examples-arrow-next")) : [];
  if (!root || !scaleEl || !counterEl || !stage || !dotsEl || prevBtns.length === 0 || nextBtns.length === 0) return;

  let activeIndex = 0;

  function el(tag, opts) {
    const e = document.createElement(tag);
    if (!opts) return e;
    if (opts.cls) e.className = opts.cls;
    if (opts.text != null) e.textContent = opts.text;
    if (opts.html != null) e.innerHTML = opts.html;
    if (opts.attrs) {
      for (const k in opts.attrs) e.setAttribute(k, opts.attrs[k]);
    }
    return e;
  }

  function buildDots() {
    dotsEl.innerHTML = "";
    examples.forEach(function (ex, i) {
      const d = el("button", {
        cls: "ex-dot",
        attrs: {
          type: "button",
          role: "tab",
          "aria-label":
            "Example " + (i + 1) + " of " + examples.length + ": " + ex.subScale,
          "data-index": String(i),
        },
      });
      d.addEventListener("click", function () {
        setActive(i);
      });
      dotsEl.appendChild(d);
    });
  }

  function speakerCard(speaker, kind) {
    const card = el("div", { cls: "speaker-card" });
    card.appendChild(el("h4", { text: speaker.name }));

    const metaBits = [];
    if (kind === "catalyst") metaBits.push("Catalyst");
    else metaBits.push("Test subject");
    if (speaker.gender) metaBits.push(speaker.gender);
    if (speaker.voice) {
      const meta = el("p", { cls: "speaker-meta" });
      meta.textContent = metaBits.join(" · ") + " · voice ";
      const code = el("code", { text: speaker.voice });
      meta.appendChild(code);
      card.appendChild(meta);
    } else {
      card.appendChild(el("p", { cls: "speaker-meta", text: metaBits.join(" · ") }));
    }

    if (kind === "catalyst") {
      const box = el("div", { cls: "persona-box" });
      box.appendChild(el("strong", { text: "Persona" }));
      box.appendChild(el("p", { text: speaker.persona || "" }));
      card.appendChild(box);
    } else {
      if (speaker.personaHigh) {
        const hi = el("div", { cls: "persona-box persona-high" });
        hi.appendChild(el("strong", { text: "High EQ persona" }));
        hi.appendChild(el("p", { text: speaker.personaHigh }));
        card.appendChild(hi);
      }
      if (speaker.personaLow) {
        const lo = el("div", { cls: "persona-box persona-low" });
        lo.appendChild(el("strong", { text: "Low EQ persona" }));
        lo.appendChild(el("p", { text: speaker.personaLow }));
        card.appendChild(lo);
      }
    }
    return card;
  }

  function audioRow(src, kind) {
    const row = el("div", { cls: "audio-row " + (kind === "high" ? "audio-row-high" : kind === "low" ? "audio-row-low" : "audio-row-single") });
    if (kind === "high") row.appendChild(el("span", { cls: "eq-badge eq-high", text: "High EQ" }));
    else if (kind === "low") row.appendChild(el("span", { cls: "eq-badge eq-low", text: "Low EQ" }));
    const audio = el("audio", { attrs: { controls: "", preload: "metadata" } });
    const source = el("source", { attrs: { src: src, type: "audio/mpeg" } });
    audio.appendChild(source);
    audio.appendChild(document.createTextNode("Your browser does not support audio playback."));
    row.appendChild(audio);
    return row;
  }

  function convItem(turn, ex) {
    const li = el("li", { cls: "conv-item" + (turn.critical ? " conv-item-critical" : "") });
    const meta = el("div", { cls: "conv-meta" });
    meta.appendChild(el("span", { cls: "sentence-number", text: "S" + turn.sn }));
    const sp = ex.speakers[turn.speaker] || {};
    meta.appendChild(el("span", {
      cls: "speaker-badge " + (turn.speaker === "speaker1" ? "speaker-1" : "speaker-2"),
      text: sp.name || "",
    }));
    if (turn.critical) {
      meta.appendChild(el("span", { cls: "critical-badge", text: "EQ test sentence" }));
    }
    li.appendChild(meta);
    li.appendChild(el("p", { cls: "conv-text", text: turn.text }));

    if (turn.audio.length === 1) {
      li.appendChild(audioRow(turn.audio[0], "single"));
    } else {
      const pair = el("div", { cls: "audio-pair" });
      pair.appendChild(audioRow(turn.audio[0], "high"));
      pair.appendChild(audioRow(turn.audio[1], "low"));
      li.appendChild(pair);
    }
    return li;
  }

  function buildScenarioCard(ex) {
    const card = el("article", { cls: "scenario-card" });

    const header = el("header", { cls: "scenario-header" });
    header.appendChild(el("h3", { cls: "scenario-title", text: ex.title }));
    card.appendChild(header);

    const info = el("div", { cls: "scenario-info" });
    if (ex.context) {
      const ctx = el("div", { cls: "info-item" });
      ctx.appendChild(el("strong", { text: "Context" }));
      ctx.appendChild(el("p", { text: ex.context }));
      info.appendChild(ctx);
    }
    if (ex.description) {
      const desc = el("div", { cls: "info-item" });
      desc.appendChild(el("strong", { text: "Description" }));
      desc.appendChild(el("p", { text: ex.description }));
      info.appendChild(desc);
    }
    card.appendChild(info);

    const speakers = el("div", { cls: "speakers-grid" });
    speakers.appendChild(speakerCard(ex.speakers.speaker1, "catalyst"));
    speakers.appendChild(speakerCard(ex.speakers.speaker2, "subject"));
    card.appendChild(speakers);

    const list = el("ol", { cls: "conversation-list" });
    ex.conversation.forEach(function (turn) {
      list.appendChild(convItem(turn, ex));
    });
    card.appendChild(list);

    return card;
  }

  function pauseAllAudio() {
    stage.querySelectorAll("audio").forEach(function (a) {
      try { a.pause(); } catch (e) { /* ignore */ }
    });
  }

  function renderActive() {
    pauseAllAudio();
    const ex = examples[activeIndex];
    stage.innerHTML = "";
    stage.appendChild(buildScenarioCard(ex));

    if (eyebrowEl) eyebrowEl.textContent = ex.mainScale;
    scaleEl.innerHTML = "";
    scaleEl.appendChild(document.createTextNode(ex.subScale));
    counterEl.innerHTML = "";
    const cur = el("strong", { text: String(activeIndex + 1).padStart(2, "0") });
    counterEl.appendChild(cur);
    counterEl.appendChild(document.createTextNode(" / " + String(examples.length).padStart(2, "0")));

    Array.prototype.forEach.call(dotsEl.querySelectorAll(".ex-dot"), function (d) {
      const i = Number(d.dataset.index);
      const on = i === activeIndex;
      d.classList.toggle("is-active", on);
      d.setAttribute("aria-selected", on ? "true" : "false");
    });

    prevBtns.forEach(function (b) { b.disabled = activeIndex === 0; });
    nextBtns.forEach(function (b) { b.disabled = activeIndex === examples.length - 1; });
  }

  function setActive(i) {
    if (i < 0) i = 0;
    if (i > examples.length - 1) i = examples.length - 1;
    if (i === activeIndex) return;
    activeIndex = i;
    renderActive();
  }

  prevBtns.forEach(function (b) {
    b.addEventListener("click", function () { setActive(activeIndex - 1); });
  });
  nextBtns.forEach(function (b) {
    b.addEventListener("click", function () { setActive(activeIndex + 1); });
  });

  root.tabIndex = 0;
  root.addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "AUDIO")) return;
    if (e.key === "ArrowLeft") {
      setActive(activeIndex - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setActive(activeIndex + 1);
      e.preventDefault();
    }
  });

  buildDots();
  renderActive();
})();
