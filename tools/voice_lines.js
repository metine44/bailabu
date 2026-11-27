// Prints every spoken line of the games as JSON, taken from index.html, so the voices always follow the page texts.
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const data = html.slice(html.indexOf("const LANGS = ["), html.indexOf("const $ = (s, el"));
const NUMS = {
  en: ["One", "Two", "Three", "Four", "Five"], es: ["Uno", "Dos", "Tres", "Cuatro", "Cinco"],
  de: ["Eins", "Zwei", "Drei", "Vier", "Fünf"], pt: ["Um", "Dois", "Três", "Quatro", "Cinco"],
  ar: ["واحد", "اثنان", "ثلاثة", "أربعة", "خمسة"], tr: ["Bir", "İki", "Üç", "Dört", "Beş"],
};
const STATIC = ["q_memory", "q_odd", "q_shadow", "q_count", "q_bubbles", "q_music", "q_pattern", "your_turn", "listen", "memory_done",
  "v_hello", "v_pick"];
// Spoken labels: game names before a game starts, the four activity tiles on the homepage. Said with "!" so they sound lively.
const LABELS = ["g_memory", "g_odd", "g_shadow", "g_count", "g_find", "g_colors", "g_bubbles", "g_music", "g_pattern",
  "nav_videos", "nav_play", "nav_stories", "nav_coloring"];
const out = new Function(`${data}
  const lines = {};
  for (const l of LANGS) {
    const g = k => T[l][k] != null ? T[l][k] : T.en[k], r = {};
    for (const k of ${JSON.stringify(STATIC)}) r[k] = g(k);
    g("praise").forEach((p, i) => r["praise" + i] = p);
    for (const k of ${JSON.stringify(LABELS)}) { const q = g(k).match(/[?؟]/); r[k] = g(k).replace(/[\\s?!؟…]+$/, "") + (q ? q[0] : "!"); if (l === "es" && !q && !r[k].startsWith("¡")) r[k] = "¡" + r[k]; }
    for (const c of CAST) r["find_" + c.id] = g("q_find").replace("{n}", c.name[l] || c.name.all);
    for (const c of CAST) r["hi_" + c.id] = g("v_hi").replace("{n}", c.name[l] || c.name.all);
    for (const c of Object.keys(g("colors"))) r["color_" + c] = g("q_colors").replace("{c}", g("colors")[c]);
    (${JSON.stringify(NUMS)})[l].forEach((n, i) => r["n" + (i + 1)] = n + "!");
    for (const k in r) r[k] = r[k].replace(/…/g, "").trim();
    lines[l] = r;
  }
  return lines;`)();
process.stdout.write(JSON.stringify(out));
