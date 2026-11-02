// Compares VIDEOS in index.html with what ProjektHub last read from the channels (data/youtube_cache.json).
// Lists every main video missing from the site and every site ID no longer public. Warns only, so a build never fails on it.
// Shorts are left out: the site lists main videos only. Run by build_page.sh. Hub folder: BAILABU_HUB, else next to the root.
const fs = require("fs"), path = require("path");
const site = path.join(__dirname, "..");
const hub = process.env.BAILABU_HUB || path.join(site, "..", "..", "Projekte", "ProjektHub");
const cacheFile = path.join(hub, "data", "youtube_cache.json");
if (!fs.existsSync(cacheFile)) { console.log(`check_videos: no ProjektHub cache at ${cacheFile}, skipped`); process.exit(0); }

const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
const start = html.indexOf("const VIDEOS = ["), end = html.indexOf("\n];", start);
const VIDEOS = new Function(`${html.slice(start, end)}\n]; return VIDEOS;`)();
const { checked_at, channels, errors } = JSON.parse(fs.readFileSync(cacheFile, "utf8"));

let problems = 0;
const say = line => { problems++; console.log(`  ${line}`); };
for (const [code, ch] of Object.entries(channels)) {
  if (code === "hist" || !ch.exists) continue;
  if ((errors || {})[code]) { console.log(`check_videos: ${code} had a read error in ProjektHub, skipped`); continue; }
  const onSite = new Map(VIDEOS.filter(v => (v.yt || {})[code]).map(v => [v.yt[code], v]));
  const online = new Set(ch.videos.map(v => v.id));
  ch.videos.filter(v => v.kind === "main" && !onSite.has(v.id)).forEach(v => say(`${code}: online, not on the site: ${v.id} ${v.title}`));
  onSite.forEach((v, id) => { if (!online.has(id)) say(`${code}: on the site, not public: ${v.id} ${id}`); });
  VIDEOS.filter(v => (v.live || []).includes(code) !== !!(v.yt || {})[code]).forEach(v => say(`${code}: live and yt disagree: ${v.id}`));
}
console.log(problems ? `check_videos: ${problems} problem(s) against the channel read of ${checked_at}` : `check_videos: site matches the channels (read ${checked_at})`);
