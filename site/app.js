(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("content").textContent);
  var view = document.getElementById("view");

  /* ── helpers ─────────────────────────────────────────────────────────── */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function arr(v) { return v == null ? [] : Array.isArray(v) ? v : [v]; }
  function tone(t) { return t && t !== "default" ? " t-" + t : ""; }
  function slugify(s, i) {
    var k = String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
    return k || "s-" + i;
  }
  function has(x) { return x && x.length; }

  /* ── catalogue ───────────────────────────────────────────────────────── */

  var CATALOG = []
    .concat(DATA.hld.map(function (c) {
      return { path: "#/hld/" + c.slug, kind: "HLD", title: c.title, sub: c.subtitle, tags: c.tags };
    }))
    .concat(DATA.lld.map(function (c) {
      return { path: "#/lld/" + c.slug, kind: "LLD", title: c.title, sub: c.subtitle, tags: c.tags };
    }))
    .concat(DATA.examples.map(function (e) {
      return { path: "#/examples/" + e.slug, kind: e.source, title: e.title, sub: e.summary, tags: e.tags };
    }));

  var PATH_MAP = {};
  CATALOG.forEach(function (c) { PATH_MAP[c.path.slice(1)] = c; });

  function lookup(appPath) { return PATH_MAP[appPath] || null; }

  /* ── diagram renderers ───────────────────────────────────────────────── */

  function node(n) {
    return '<div class="node' + tone(n.tone) + '">' +
      '<div class="l">' + esc(n.label) + "</div>" +
      (n.sub ? '<div class="s">' + esc(n.sub) + "</div>" : "") +
      "</div>";
  }

  var ARROW_X = '<svg class="arrow" width="17" height="9" viewBox="0 0 17 9" aria-hidden="true">' +
    '<path d="M0 4.5h14M11 1l3.5 3.5L11 8" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

  function figure(inner, caption, cls) {
    return '<figure class="dg' + (cls ? " " + cls : "") + '">' + inner +
      (caption ? "<figcaption>" + esc(caption) + "</figcaption>" : "") + "</figure>";
  }

  function flowDiagram(d) {
    var rows = d.rows.map(function (row) {
      return '<div class="flowrow">' + row.map(function (n, j) {
        return (j > 0 ? ARROW_X : "") + node(n);
      }).join("") + "</div>";
    }).join("");
    return figure('<div class="scroller"><div class="flow">' + rows + "</div></div>", d.caption);
  }

  function systemDiagram(d) {
    var cols = d.columns.map(function (col, i) {
      return '<div class="syscol"><div class="h"><span>' + esc(col.title) + "</span>" +
        (i < d.columns.length - 1 ? '<span aria-hidden="true" style="color:var(--faint)">→</span>' : "") +
        '</div><div class="items">' + col.nodes.map(node).join("") + "</div></div>";
    }).join("");
    return figure('<div class="sys">' + cols + "</div>", d.caption);
  }

  function layersDiagram(d) {
    var rows = d.layers.map(function (l) {
      return '<div class="layer"><div class="h">' + esc(l.title) + '</div><div class="chips">' +
        l.items.map(function (i) { return '<span class="chip">' + esc(i) + "</span>"; }).join("") +
        "</div></div>";
    }).join("");
    return figure('<div class="layers">' + rows + "</div>", d.caption);
  }

  function bitsDiagram(d) {
    var total = d.fields.reduce(function (s, f) { return s + f.bits; }, 0);
    var cells = d.fields.map(function (f) {
      return '<div class="bit" style="flex:' + f.bits + '">' +
        '<div class="b">' + f.bits + "b</div>" +
        '<div class="n">' + esc(f.label) + "</div>" +
        (f.note ? '<div class="x">' + esc(f.note) + "</div>" : "") + "</div>";
    }).join("");
    return figure('<div class="scroller"><div class="bits">' + cells + "</div></div>",
      d.caption || total + "-bit layout");
  }

  function sequenceDiagram(d) {
    var idx = {};
    d.actors.forEach(function (a, i) { idx[a.id] = i; });
    var cols = "repeat(" + d.actors.length + ", minmax(104px, 1fr))";

    var head = '<div class="seqhead" style="grid-template-columns:' + cols + '">' +
      d.actors.map(function (a) {
        return '<div class="actor"><div class="l">' + esc(a.label) + "</div>" +
          (a.sub ? '<div class="s">' + esc(a.sub) + "</div>" : "") + "</div>";
      }).join("") + "</div>";

    var lines = '<div class="lifelines" style="grid-template-columns:' + cols + '" aria-hidden="true">' +
      d.actors.map(function () { return "<span></span>"; }).join("") + "</div>";

    var msgs = d.messages.map(function (m, i) {
      var from = idx[m.from] || 0, to = idx[m.to] == null ? from : idx[m.to];
      var self = m.kind === "self" || from === to;
      var start = Math.min(from, to), end = Math.max(from, to);
      var right = to >= from;
      var dashed = m.kind === "return" || m.kind === "async";
      var cls = "msg" + (m.kind === "return" ? " ret" : "");
      var style = "grid-row:" + (i + 1) + ";grid-column:" + (start + 1) + " / " + (end + 2);

      var body;
      if (self) {
        body = '<div class="line"><svg width="32" height="13" viewBox="0 0 32 13" aria-hidden="true">' +
          '<path d="M2 3h25a3.5 3.5 0 0 1 0 7H10" fill="none" stroke="currentColor" stroke-width="1.2"' +
          (dashed ? ' stroke-dasharray="3 3"' : "") + "/>" +
          '<path d="M13 6.5l-4 3.5V3z" fill="currentColor"/></svg>' +
          '<span style="margin-left:6px;font-size:10px;color:var(--faint)">self</span></div>';
      } else {
        body = '<div class="line">' +
          (right ? "" : '<span class="cap" aria-hidden="true">◀</span>') +
          '<span class="rule' + (dashed ? " dash" : "") + '"></span>' +
          (right ? '<span class="cap" aria-hidden="true">▶</span>' : "") +
          "</div>";
      }

      return '<div class="' + cls + '" style="' + style + '">' +
        '<div class="top"><span class="i">' + (i + 1) + '</span><span class="l">' + esc(m.label) + "</span></div>" +
        body +
        (m.note ? '<div class="note">' + esc(m.note) + "</div>" : "") +
        "</div>";
    }).join("");

    var inner = '<div class="scroller"><div class="seq">' + head +
      '<div class="seqbody">' + lines +
      '<div class="msgs" style="grid-template-columns:' + cols + '">' + msgs + "</div>" +
      "</div></div></div>";
    return figure(inner, d.caption);
  }

  function erDiagram(d) {
    var ents = d.entities.map(function (e) {
      return '<div class="entity"><div class="h"><div class="n">' + esc(e.name) + "</div>" +
        (e.note ? '<div class="x">' + esc(e.note) + "</div>" : "") + "</div><ul>" +
        e.fields.map(function (f) {
          return "<li>" + (f.key
            ? '<span class="key ' + f.key + '"><b>' + esc(f.key) + "</b></span>"
            : '<span class="key"></span>') +
            '<span class="f">' + esc(f.name) + '</span><span class="ty">' + esc(f.type) + "</span></li>";
        }).join("") + "</ul></div>";
    }).join("");

    var rels = has(d.relations) ? '<div class="rels">' + d.relations.map(function (r) {
      return '<div class="rel"><span class="m">' + esc(r.from) + '</span>' +
        '<span class="g" aria-hidden="true">──▶</span><span class="m">' + esc(r.to) + "</span>" +
        (r.cardinality ? '<span class="card">' + esc(r.cardinality) + "</span>" : "") +
        "<span>" + esc(r.label) + "</span></div>";
    }).join("") + "</div>" : "";

    return figure('<div class="entities">' + ents + "</div>" + rels, d.caption);
  }

  function compareDiagram(d) {
    var opts = d.options.map(function (o) {
      var items = o.good.map(function (g) {
        return '<li class="g"><span class="m">+</span><span>' + esc(g) + "</span></li>";
      }).concat(o.bad.map(function (b) {
        return '<li class="b"><span class="m">−</span><span>' + esc(b) + "</span></li>";
      })).join("");
      return '<div class="opt' + tone(o.tone) + '"><div class="t">' + esc(o.title) + "</div>" +
        (o.sub ? '<div class="s">' + esc(o.sub) + "</div>" : "") +
        "<ul>" + items + "</ul>" +
        (o.verdict ? '<div class="v"><span>Pick when</span> ' + esc(o.verdict) + "</div>" : "") +
        "</div>";
    }).join("");
    return figure('<div class="cmp">' + opts + "</div>", d.caption);
  }

  var STEREO = { interface: "«interface»", abstract: "«abstract»", enum: "«enum»", record: "«record»", class: "" };
  var EDGE = { implements: "┈┈▷", extends: "───▷", has: "───◆", uses: "───▶" };

  function umlDiagram(d) {
    var boxes = d.boxes.map(function (b) {
      var st = b.stereotype && STEREO[b.stereotype];
      return '<div class="box' + tone(b.tone) + '"><div class="h">' +
        (st ? '<div class="st">' + esc(st) + "</div>" : "") +
        '<div class="n">' + esc(b.name) + "</div></div><ul>" +
        b.members.map(function (m) {
          return '<li class="' + (m.kind === "field" ? "field" : "") + '">' +
            '<span class="v">' + esc(m.vis || "+") + "</span> " + esc(m.name) +
            (m.note ? ' <span class="x">— ' + esc(m.note) + "</span>" : "") + "</li>";
        }).join("") + "</ul></div>";
    }).join("");

    var edges = has(d.edges) ? '<div class="rels">' + d.edges.map(function (e) {
      return '<div class="rel"><span class="m">' + esc(e.from) + "</span>" +
        '<span class="g" aria-hidden="true">' + esc(EDGE[e.kind || "uses"]) + "</span>" +
        '<span class="m">' + esc(e.to) + "</span><span>" + esc(e.label || e.kind || "uses") + "</span></div>";
    }).join("") + "</div>" : "";

    return figure('<div class="boxes">' + boxes + "</div>" + edges, d.caption);
  }

  function diagram(d) {
    switch (d.kind) {
      case "flow": return flowDiagram(d);
      case "system": return systemDiagram(d);
      case "layers": return layersDiagram(d);
      case "bits": return bitsDiagram(d);
      case "sequence": return sequenceDiagram(d);
      case "er": return erDiagram(d);
      case "compare": return compareDiagram(d);
      case "uml": return umlDiagram(d);
      default: return "";
    }
  }

  /* ── section parts ───────────────────────────────────────────────────── */

  function codeBlock(c) {
    return '<figure class="code">' +
      (c.title ? "<figcaption><span>" + esc(c.title) + "</span>" +
        (c.lang ? '<span class="lang">' + esc(c.lang) + "</span>" : "") + "</figcaption>" : "") +
      "<pre><code>" + esc(c.source) + "</code></pre></figure>";
  }

  function tableBlock(t) {
    return '<div class="tablewrap"><table>' +
      (t.caption ? "<caption>" + esc(t.caption) + "</caption>" : "") +
      "<thead><tr>" + t.headers.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      t.rows.map(function (r) {
        return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  function mathBlock(rows) {
    return '<div class="math"><table><tbody>' + rows.map(function (m) {
      return '<tr><th class="lbl">' + esc(m.label) + "</th>" +
        '<td class="expr">' + esc(m.expr) +
        (m.note ? '<span class="note">' + esc(m.note) + "</span>" : "") + "</td>" +
        '<td class="res">' + esc(m.result) + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  }

  function stepsBlock(steps) {
    return '<ol class="steps">' + steps.map(function (s, i) {
      return '<li class="step"><span class="n">' + (i + 1) + "</span>" +
        '<div class="t">' + esc(s.title) + "</div>" +
        '<p class="d">' + esc(s.text) + "</p>" +
        (s.detail ? '<div class="x">' + esc(s.detail) + "</div>" : "") + "</li>";
    }).join("") + "</ol>";
  }

  function qaBlock(items, qLabel, aLabel) {
    return '<dl class="qa">' + items.map(function (f) {
      return '<div class="item"><dt><span class="tag">' + esc(qLabel) + "</span>" + esc(f.q) + "</dt>" +
        '<dd><span class="tag">' + esc(aLabel) + "</span>" + esc(f.a) + "</dd></div>";
    }).join("") + "</dl>";
  }

  var CALLOUT_LABEL = { note: "Note", insight: "Insight", warn: "Watch out", interview: "In the interview" };

  function section(s, i) {
    var out = ['<section class="section" id="' + esc(slugify(s.heading, i)) + '">',
      "<h2>" + esc(s.heading) + "</h2>"];
    if (s.lede) out.push('<p class="lede">' + esc(s.lede) + "</p>");
    (s.body || []).forEach(function (p) { out.push('<p class="para">' + esc(p) + "</p>"); });

    if (has(s.bullets)) {
      out.push('<ul class="dotlist">' + s.bullets.map(function (b) {
        return "<li><span>" + esc(b) + "</span></li>";
      }).join("") + "</ul>");
    }
    if (has(s.numbered)) {
      out.push('<ol class="numlist">' + s.numbered.map(function (b) {
        return "<li><span>" + esc(b) + "</span></li>";
      }).join("") + "</ol>");
    }
    if (has(s.steps)) out.push(stepsBlock(s.steps));
    if (has(s.math)) out.push(mathBlock(s.math));
    if (s.table) out.push(tableBlock(s.table));
    arr(s.code).forEach(function (c) { out.push(codeBlock(c)); });
    arr(s.diagram).forEach(function (d) { out.push(diagram(d)); });
    if (has(s.followUps)) out.push(qaBlock(s.followUps, "Q", "A"));

    if (s.callout) {
      out.push('<aside class="callout ' + esc(s.callout.kind) + '">' +
        '<div class="ct">' + esc(s.callout.title || CALLOUT_LABEL[s.callout.kind] || s.callout.kind) + "</div>" +
        "<p>" + esc(s.callout.text) + "</p></aside>");
    }
    if (has(s.takeaways)) {
      out.push('<div class="takeaways"><div class="ct">Takeaways</div><ul class="dotlist">' +
        s.takeaways.map(function (t) { return "<li><span>" + esc(t) + "</span></li>"; }).join("") +
        "</ul></div>");
    }
    out.push("</section>");
    return out.join("");
  }

  /* ── shared page pieces ──────────────────────────────────────────────── */

  function pageHeader(kicker, title, sub, badges) {
    return '<header class="phead"><div class="kicker">' + esc(kicker) + "</div>" +
      "<h1>" + esc(title) + "</h1>" +
      '<p class="sub">' + esc(sub) + "</p>" +
      (has(badges) ? '<div class="badges">' + badges.map(function (b, i) {
        return '<span class="badge' + (i === 0 ? " lvl" : "") + '">' + esc(b) + "</span>";
      }).join("") + "</div>" : "") + "</header>";
  }

  function relatedBlock(paths) {
    var items = (paths || []).map(lookup).filter(Boolean);
    if (!items.length) return "";
    return '<div><hr class="rule"><div style="padding-top:26px">' +
      '<h2 class="smallcap">Continue</h2><div class="related">' +
      items.map(function (it) {
        return '<a class="rcard" href="' + esc(it.path) + '">' +
          '<div class="k">' + esc(it.kind) + "</div>" +
          '<div class="t">' + esc(it.title) + "</div>" +
          '<div class="d">' + esc(it.sub) + "</div></a>";
      }).join("") + "</div></div></div>";
  }

  function sourcesBlock(links) {
    if (!has(links)) return "";
    return '<div><h2 class="smallcap">Sources</h2><div class="srcs">' +
      links.map(function (l) {
        return '<a href="' + esc(l.href) + '" target="_blank" rel="noreferrer noopener">' + esc(l.label) + "</a>";
      }).join("") + "</div></div>";
  }

  function tocBlock(entries) {
    if (entries.length < 3) return "";
    var lastGroup = null;
    var html = entries.map(function (e) {
      var g = "";
      if (e.group && e.group !== lastGroup) {
        g = '<div class="toc-group">' + esc(e.group) + "</div>";
        lastGroup = e.group;
      }
      return g + '<a href="#' + esc(e.id) + '" data-toc="' + esc(e.id) + '">' + esc(e.label) + "</a>";
    }).join("");
    return '<div class="tocwrap"><div class="toc-title">On this page</div><nav class="toc" aria-label="On this page">' +
      html + "</nav></div>";
  }

  /* ── concept page ────────────────────────────────────────────────────── */

  function conceptPage(c, kicker) {
    var entries = c.sections.map(function (s, i) {
      return { id: slugify(s.heading, i), label: s.heading };
    });

    var col = ['<div class="col">'];
    col.push('<div style="display:flex;flex-direction:column;gap:12px">' +
      '<p class="summary">' + esc(c.summary) + "</p>" +
      (has(c.prerequisites) ? (function () {
        var pre = c.prerequisites.map(lookup).filter(Boolean);
        if (!pre.length) return "";
        return '<p style="font-size:13.5px;color:var(--muted)"><span class="smallcap">Read first </span>' +
          pre.map(function (p) {
            return '<a href="' + esc(p.path) + '" style="color:var(--accent);text-decoration:none">' + esc(p.title) + "</a>";
          }).join('<span style="color:var(--faint)"> · </span>') + "</p>";
      })() : "") + "</div>");

    if (has(c.keyPoints)) {
      col.push('<aside class="takeaways"><div class="ct">The 60-second version</div><ul class="dotlist" style="margin-top:10px">' +
        c.keyPoints.map(function (p) { return "<li><span>" + esc(p) + "</span></li>"; }).join("") +
        "</ul></aside>");
    }

    c.sections.forEach(function (s, i) { col.push(section(s, i)); });
    col.push(sourcesBlock(c.furtherReading));
    col.push(relatedBlock(c.related));
    col.push("</div>");

    return '<article class="page">' +
      pageHeader(kicker, c.title, c.subtitle, [c.level].concat(c.tags).concat([c.minutes + " min"])) +
      '<div class="body-grid">' + col.join("") + tocBlock(entries) + "</div></article>";
  }

  /* ── example page ────────────────────────────────────────────────────── */

  function boardBlock(b) {
    if (!b) return "";
    var cols = b.columns.map(function (col, i) {
      return '<div class="syscol"><div class="h"><span>' + esc(col.title) + "</span>" +
        (i < b.columns.length - 1 ? '<span aria-hidden="true" style="color:var(--faint)">→</span>' : "") +
        '</div><div class="items">' + col.nodes.map(node).join("") + "</div></div>";
    }).join("");
    var walk = '<div class="walk">' + b.walkthrough.map(function (w, i) {
      return '<div class="w"><div class="n">' + (i + 1) + "</div><div><div class=\"t\">" + esc(w.title) +
        '</div><div class="d">' + esc(w.text) + "</div></div></div>";
    }).join("") + "</div>";
    return '<section class="section" id="architecture-board"><h2>Architecture</h2>' +
      figure('<div class="sys">' + cols + "</div>" + walk, b.caption) + "</section>";
  }

  function examplePage(e) {
    var board = DATA.boards[e.slug];
    var entries = [{ id: "requirements", label: "Requirements", group: "1 · Scope" }];
    if (has(e.estimation) || has(e.math)) entries.push({ id: "estimation", label: "Back of the envelope", group: "1 · Scope" });
    if (has(e.apis)) entries.push({ id: "apis", label: "API design", group: "2 · High-level design" });
    if (has(e.dataModel)) entries.push({ id: "data-model", label: "Data model", group: "2 · High-level design" });
    if (board) entries.push({ id: "architecture-board", label: "Architecture", group: "2 · High-level design" });
    e.architecture.forEach(function (s, i) {
      entries.push({ id: slugify(s.heading, i), label: s.heading, group: "2 · High-level design" });
    });
    e.deepDives.forEach(function (s, i) {
      entries.push({ id: slugify(s.heading, 100 + i), label: s.heading, group: "3 · Deep dive" });
    });
    if (has(e.tradeoffs)) entries.push({ id: "tradeoffs", label: "Trade-offs", group: "4 · Wrap up" });
    if (has(e.wrapUp)) entries.push({ id: "wrap-up", label: "What to say at the end", group: "4 · Wrap up" });
    if (has(e.followUps)) entries.push({ id: "follow-ups", label: "Follow-up questions", group: "4 · Wrap up" });

    function mark(n, t) {
      return '<div class="stepmark"><span class="n">' + n + '</span><span class="t">' + esc(t) + "</span></div>";
    }

    var col = ['<div class="col">'];

    if (has(e.companies)) {
      col.push('<p style="font-size:13.5px;color:var(--muted)">In the wild: ' + esc(e.companies.join(" · ")) + "</p>");
    }

    col.push(mark(1, "Understand the problem, establish scope"));

    if (has(e.clarifying)) {
      col.push('<section class="section"><h2>Questions to ask first</h2>' +
        '<p class="lede">The first five minutes decide what you build. These are the questions worth spending them on, and the answers this design assumes.</p>' +
        qaBlock(e.clarifying, "You", "Them") + "</section>");
    }

    col.push('<section class="section" id="requirements"><h2>Requirements</h2><div class="twocol">' +
      '<div class="panel"><h3>Functional</h3><ul class="dotlist">' +
      e.requirements.functional.map(function (r) { return "<li><span>" + esc(r) + "</span></li>"; }).join("") +
      '</ul></div><div class="panel"><h3>Non-functional</h3><ul class="dotlist">' +
      e.requirements.nonFunctional.map(function (r) { return "<li><span>" + esc(r) + "</span></li>"; }).join("") +
      "</ul></div></div></section>");

    if (has(e.math) || has(e.estimation)) {
      var est = "";
      if (has(e.estimation)) {
        est = '<div class="math"><table><tbody>' + e.estimation.map(function (x) {
          return '<tr><th class="lbl">' + esc(x.item) + '</th><td class="expr" colspan="2">' + esc(x.calc) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      }
      col.push('<section class="section" id="estimation"><h2>Back of the envelope</h2>' +
        (has(e.math) ? mathBlock(e.math) : "") + est + "</section>");
    }

    col.push(mark(2, "Propose the high-level design"));

    if (has(e.apis)) {
      col.push('<section class="section" id="apis"><h2>API design</h2><div class="tablewrap"><table>' +
        "<thead><tr><th>Method</th><th>Path</th><th>Role</th></tr></thead><tbody>" +
        e.apis.map(function (a) {
          return '<tr><td style="font-family:var(--font-mono);font-size:11.5px;color:var(--accent)">' + esc(a.method) +
            '</td><td style="font-family:var(--font-mono);font-size:11.5px;color:var(--fg)">' + esc(a.path) +
            "</td><td>" + esc(a.desc) + "</td></tr>";
        }).join("") + "</tbody></table></div></section>");
    }

    if (has(e.dataModel)) {
      col.push('<section class="section" id="data-model"><h2>Data model</h2><div class="models">' +
        e.dataModel.map(function (d) {
          return '<div class="model"><div class="n">' + esc(d.entity) + "</div><ul>" +
            d.fields.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul></div>";
        }).join("") + "</div></section>");
    }

    col.push(boardBlock(board));
    e.architecture.forEach(function (s, i) { col.push(section(s, i)); });

    if (has(e.deepDives)) {
      col.push(mark(3, "Design deep dive"));
      e.deepDives.forEach(function (s, i) { col.push(section(s, 100 + i)); });
    }

    col.push(mark(4, "Wrap up"));

    if (has(e.tradeoffs)) {
      col.push('<section class="section" id="tradeoffs"><h2>Trade-offs</h2><div class="tablewrap"><table>' +
        "<thead><tr><th>Choice</th><th>Pick when</th><th>Cost</th></tr></thead><tbody>" +
        e.tradeoffs.map(function (t) {
          return "<tr><td>" + esc(t.choice) + "</td><td>" + esc(t.pickWhen) + "</td><td>" + esc(t.cost) + "</td></tr>";
        }).join("") + "</tbody></table></div></section>");
    }

    if (has(e.wrapUp)) {
      col.push('<section class="section" id="wrap-up"><h2>What to say at the end</h2><ul class="dotlist">' +
        e.wrapUp.map(function (w) { return "<li><span>" + esc(w) + "</span></li>"; }).join("") + "</ul></section>");
    }

    if (has(e.followUps)) {
      col.push('<section class="section" id="follow-ups"><h2>Follow-up questions</h2>' +
        qaBlock(e.followUps, "Q", "A") + "</section>");
    }

    col.push(sourcesBlock(e.furtherReading));
    col.push(relatedBlock(e.related));
    col.push("</div>");

    var kicker = e.source + (e.chapter ? " · Chapter " + e.chapter : "");
    return '<article class="page">' +
      pageHeader(kicker, e.title, e.summary, [e.difficulty].concat(e.tags).concat([e.minutes + " min"])) +
      '<div class="body-grid">' + col.join("") + tocBlock(entries) + "</div></article>";
  }

  /* ── index pages ─────────────────────────────────────────────────────── */

  function indexPage(kicker, title, sub, items, base) {
    var cards = items.map(function (c) {
      var t = c.tags.slice(0, 3).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
      return '<a class="card" href="#/' + base + "/" + esc(c.slug) + '">' +
        '<div class="k">' + esc(c.level || c.difficulty) + "</div>" +
        '<div class="t">' + esc(c.title) + "</div>" +
        '<div class="d">' + esc(c.subtitle || c.summary) + "</div>" +
        '<div class="tags">' + t + "</div></a>";
    }).join("");
    return '<article class="page">' + pageHeader(kicker, title, sub) +
      '<div style="padding:30px 40px 0"><div class="cards">' + cards + "</div></div></article>";
  }

  function homePage() {
    var cells = [
      ["Menu", "HLD Concepts", "Scaling, caching, replication, sharding, consistency, queues — the vocabulary of large systems, each with worked numbers and failure modes.", "#/hld"],
      ["Menu", "LLD Concepts", "SOLID, patterns, LRU, rate limiting, parking lot, elevator, concurrency. Class design that survives a whiteboard.", "#/lld"],
      ["Menu", "Design Examples", "Forty-one worked problems in the four-step interview framework, from URL shortener to stock exchange.", "#/examples"],
    ].map(function (c) {
      return '<div class="homecell"><div class="k">' + esc(c[0]) + "</div><h2>" + esc(c[1]) + "</h2>" +
        "<p>" + esc(c[2]) + '</p><a class="go" href="' + c[3] + '">Open →</a></div>';
    }).join("");

    var stats = [
      [DATA.hld.length, "HLD concepts"],
      [DATA.lld.length, "LLD concepts"],
      [DATA.examples.length, "Worked examples"],
      [DATA.hld.length + DATA.lld.length + DATA.examples.length, "Pages"],
    ].map(function (s) {
      return '<div class="stat"><div class="v">' + s[0] + '</div><div class="l">' + esc(s[1]) + "</div></div>";
    }).join("");

    return '<article class="page"><section class="hero">' +
      '<div class="kicker">System design studio</div>' +
      "<h1>Learn the map, then draw it.</h1>" +
      "<p>High-level architecture and low-level object design, written the way the interview actually goes: scope it, size it, draw it, then defend the trade-offs. Every page carries diagrams, worked arithmetic, failure modes and the follow-up questions.</p>" +
      '<div class="stats">' + stats + "</div></section>" +
      '<div class="homegrid">' + cells + "</div>" +
      '<div class="note"><p>This is a reading build of the Lattice study app. The eight interactive labs — rate limiter, hash ring, quorum, CAP, LRU, load balancer, Snowflake and URL shortener — run in the full application and are not included here.</p></div>' +
      "</article>";
  }

  /* ── router ──────────────────────────────────────────────────────────── */

  var NAV = [
    { label: "Studio", href: "#/", match: "/" },
    { label: "HLD Concepts", href: "#/hld", match: "/hld", count: DATA.hld.length },
    { label: "LLD Concepts", href: "#/lld", match: "/lld", count: DATA.lld.length },
    { label: "Design Examples", href: "#/examples", match: "/examples", count: DATA.examples.length },
  ];

  function renderNav(path) {
    document.getElementById("nav").innerHTML = NAV.map(function (n) {
      var on = n.match === "/" ? path === "/" : path === n.match || path.indexOf(n.match + "/") === 0;
      return '<a href="' + n.href + '"' + (on ? ' aria-current="page"' : "") + ">" +
        "<span>" + esc(n.label) + "</span>" +
        (n.count ? '<span class="count">' + n.count + "</span>" : "") + "</a>";
    }).join("");
  }

  function find(list, slug) {
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
    return null;
  }

  function notFound(path) {
    return '<article class="page">' +
      pageHeader("Not found", "No page at that address", "The link " + path + " does not match anything in this build.") +
      '<div style="padding:30px 40px"><a class="go" style="color:var(--accent);text-decoration:none" href="#/">← Back to the studio</a></div></article>';
  }

  var observer = null;

  function render() {
    var raw = location.hash.replace(/^#/, "") || "/";
    if (raw.charAt(0) !== "/") return; /* in-page anchor */
    var parts = raw.split("/").filter(Boolean);
    var html, item;

    if (parts.length === 0) html = homePage();
    else if (parts[0] === "hld" && parts.length === 1)
      html = indexPage("Menu", "HLD Concepts", "High-level design is about the shape of a system under load: what scales, what fails, and what you give up. Twenty-six concepts, each with the numbers that drive the decision.", DATA.hld, "hld");
    else if (parts[0] === "lld" && parts.length === 1)
      html = indexPage("Menu", "LLD Concepts", "Low-level design is types, invariants and thread-safety. Patterns are named only when they earn a seam — a rate-limiter strategy, a parking-spot index, a logger sink.", DATA.lld, "lld");
    else if (parts[0] === "examples" && parts.length === 1)
      html = indexPage("Menu", "System Design Examples", "Forty-one worked problems in the four-step framework: scope and estimate, propose a high-level design, dive into the hard part, then wrap up with trade-offs and follow-ups.", DATA.examples, "examples");
    else if (parts[0] === "hld" && (item = find(DATA.hld, parts[1]))) html = conceptPage(item, "HLD");
    else if (parts[0] === "lld" && (item = find(DATA.lld, parts[1]))) html = conceptPage(item, "LLD");
    else if (parts[0] === "examples" && (item = find(DATA.examples, parts[1]))) html = examplePage(item);
    else html = notFound(raw);

    view.innerHTML = html;
    renderNav("/" + parts.join("/"));
    document.getElementById("rail").classList.remove("open");
    document.getElementById("menu").setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    spy();
  }

  function spy() {
    if (observer) observer.disconnect();
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-toc]"));
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("data-toc")] = a; });
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute("data-toc")); }).filter(Boolean);
    if (!targets.length) return;

    observer = new IntersectionObserver(function (records) {
      var visible = records.filter(function (r) { return r.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; })[0];
      if (!visible) return;
      links.forEach(function (a) { a.classList.remove("on"); });
      var a = map[visible.target.id];
      if (a) a.classList.add("on");
    }, { rootMargin: "-80px 0px -70% 0px", threshold: 0 });

    targets.forEach(function (t) { observer.observe(t); });
    links[0].classList.add("on");
  }

  /* ── search ──────────────────────────────────────────────────────────── */

  var scrim = document.getElementById("scrim");
  var q = document.getElementById("q");
  var results = document.getElementById("sresults");
  var cursor = 0;

  function score(item, s) {
    var hay = (item.title + " " + item.sub + " " + item.kind + " " + item.tags.join(" ")).toLowerCase();
    var n = 0;
    if (item.title.toLowerCase().indexOf(s) >= 0) n += 5;
    if (hay.indexOf(s) >= 0) n += 2;
    s.split(/\s+/).forEach(function (w) { if (w && hay.indexOf(w) >= 0) n += 1; });
    return n;
  }

  function search(term) {
    var s = term.trim().toLowerCase();
    var list = !s ? CATALOG.slice(0, 10)
      : CATALOG.map(function (i) { return { i: i, n: score(i, s) }; })
        .filter(function (x) { return x.n > 0; })
        .sort(function (a, b) { return b.n - a.n; })
        .slice(0, 12).map(function (x) { return x.i; });

    cursor = 0;
    results.innerHTML = list.length
      ? list.map(function (i, n) {
        return '<a href="' + esc(i.path) + '" class="' + (n === 0 ? "on" : "") + '">' +
          '<span class="k">' + esc(i.kind) + "</span><span><span class=\"t\">" + esc(i.title) +
          '</span><span class="d">' + esc(i.sub.slice(0, 90)) + "</span></span></a>";
      }).join("")
      : '<div class="sempty">Nothing matches “' + esc(term) + "”.</div>";
  }

  function openSearch() {
    scrim.hidden = false;
    q.value = "";
    search("");
    q.focus();
  }
  function closeSearch() { scrim.hidden = true; }

  function moveCursor(delta) {
    var items = results.querySelectorAll("a");
    if (!items.length) return;
    items[cursor] && items[cursor].classList.remove("on");
    cursor = (cursor + delta + items.length) % items.length;
    items[cursor].classList.add("on");
    items[cursor].scrollIntoView({ block: "nearest" });
  }

  document.getElementById("open-search").addEventListener("click", openSearch);
  document.getElementById("open-search-2").addEventListener("click", openSearch);
  scrim.addEventListener("click", function (e) { if (e.target === scrim) closeSearch(); });
  q.addEventListener("input", function () { search(q.value); });

  q.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); moveCursor(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
    else if (e.key === "Enter") {
      var a = results.querySelectorAll("a")[cursor];
      if (a) { location.hash = a.getAttribute("href").slice(1); closeSearch(); }
    } else if (e.key === "Escape") closeSearch();
  });

  results.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeSearch();
  });

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (!scrim.hidden && e.key === "Escape") { closeSearch(); return; }
    if (typing) return;
    if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      openSearch();
    }
  });

  document.getElementById("menu").addEventListener("click", function () {
    var rail = document.getElementById("rail");
    var open = rail.classList.toggle("open");
    this.setAttribute("aria-expanded", String(open));
  });

  window.addEventListener("hashchange", render);
  render();
})();
