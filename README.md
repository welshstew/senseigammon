# Sensei Gammon

Quick, fun classroom time-fillers for UK teachers (pupils aged 8–17), built for the interactive whiteboard.

Live site (once published): `https://welshstew.github.io/senseigammon/`, later `https://senseigammon.co.uk`

---

## Part 1: For developers

### What it is
- Plain HTML, CSS and vanilla JavaScript. **No framework, no build step, no dependencies.**
- All content lives in JSON files in [`/content/`](content/). Pages load them with `fetch()`.
- No external scripts, fonts, CDNs, cookies, trackers, analytics or ads. Nothing is stored, not even in `localStorage`. Things like the team scoreboard and the name list live in memory only.
- All paths are **relative**, so the site works both at `/senseigammon/` on GitHub Pages and at the root of a custom domain.

### Run it locally
`fetch()` doesn't work from `file://`, so serve the folder:

```bash
git clone https://github.com/welshstew/senseigammon.git
cd senseigammon
python3 -m http.server 8000
# open http://localhost:8000
```

### Structure
```
index.html          Homepage: hero, filters, activity cards, tools
play.html           One presentation engine for every activity: play.html?a=<id>
timer.html          Countdown timer (presets, chime, mute)
picker.html         Random name picker (memory only)
teams.html          Team generator (memory only)
printables.html     Reads content/printables.json
about.html, privacy.html, 404.html
.nojekyll           Tells GitHub Pages to serve files as-is

css/style.css       All styles (colour tokens at the top)
js/site.js          Shared helpers: JSON loading, coffee link, fullscreen, chime
js/home.js          Filters, cards, Random filler
js/play.js          Activity engine. Activity types are defined in the TYPES object
js/timer.js, picker.js, teams.js, printables.js

content/            ← all editable content (see content/README.md)
printables/         PDF files linked from printables.json
img/favicon.svg
```

### Activity URLs
`play.html?a=riddles`, `scramble`, `would-you-rather`, `odd-one-out`, `emoji` or `quiz`.
Optional `&age=8-11` (or `11-14`, `14-17`) preselects an age band.

### Adding a new activity *type*
1. Add an entry to the `TYPES` object in `js/play.js` (file name, how to draw the body and reveal).
2. Add a matching `content/<name>.json` file.
3. Add a card to `content/activities.json` with the same `id`.

### Keyboard shortcuts (activity mode)
<kbd>Space</kbd> / <kbd>→</kbd> next · <kbd>←</kbd> previous · <kbd>R</kbd> reveal · <kbd>H</kbd> hint · <kbd>F</kbd> fullscreen

### Publish on GitHub Pages
1. Push this folder to the `main` branch of `github.com/welshstew/senseigammon`.
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch **`main`**, folder **`/ (root)`**, and save.
4. After a minute or two the site appears at `https://welshstew.github.io/senseigammon/`.

### Custom domain (later)
<!--
  CNAME: when senseigammon.co.uk is ready, create a file called CNAME (no extension)
  in the repo root containing just:   senseigammon.co.uk
  Do NOT create it until the DNS is set up.
-->
When `senseigammon.co.uk` is ready:
1. At your domain registrar, point the domain at GitHub Pages (see GitHub's "Managing a custom domain" docs).
2. Add a file called `CNAME` (no file extension) to the repo root containing the single line `senseigammon.co.uk`. **This file doesn't exist yet on purpose.**
3. In **Settings → Pages**, enter the custom domain and tick **Enforce HTTPS**.

No code changes are needed because every link is relative.

### Content editing (Pages CMS)
`.pages.yml` in the repo root configures [Pages CMS](https://pagescms.org): one form per JSON file in `content/`, with PDFs uploaded to `printables/`. `settings.content: true` merges on save, so keys that aren't in the schema are kept. The site's JavaScript accepts list fields (such as `ages` and `options`) either as arrays or as comma-separated strings, and strips a leading `/` from PDF paths, so the site keeps working with either save format. If you add a field to a JSON file, add it to `.pages.yml` too.

### Buy Me a Coffee
The username lives in one place: `content/site.json` → `"buyMeACoffeeUsername"`. It is currently the placeholder `BMC_USERNAME`. It's a plain link, not their widget script.

---

## Part 2: For the teacher (adding content)

There are two ways to add content. **Option A (Pages CMS) is the easiest**: you fill in simple forms and don't need to touch any code.

### Option A: Pages CMS (recommended)
1. Go to **https://app.pagescms.org** and click **Sign in with GitHub**.
2. The first time, it asks to install the Pages CMS app. Allow it for the **senseigammon** repository.
3. Open **senseigammon**. On the left you'll see **Riddles**, **Quick-fire quiz**, **Word scramble**, **Would you rather**, **Odd one out**, **Emoji puzzles**, **Printables**, **Homepage cards** and **Site settings**.
4. Click one, for example **Riddles**. Scroll to the bottom and click **Add an entry** (or the **+** button). Fill in the riddle, the answer and tick the age bands.
5. Click **Save**. That's it. The website updates by itself in a minute or two.

**Adding a printable:** open **Printables** and add an entry. In the **PDF file** box, upload your PDF (it goes into the `printables` folder automatically), fill in the title and age bands, and save.

Tips:
- Every entry needs at least one age band ticked.
- In **Odd one out**, the answer must be spelled exactly like one of the four items.
- **Homepage cards** and **Site settings** change how the site works. Only change them if you're sure.
- Made a mistake? Every save is kept in the history on GitHub, so nothing is ever lost.

### Option B: edit the files directly on github.com
You don't need any special software. You can do everything on **github.com** in your web browser.

### How to edit a file on GitHub
1. Go to the repository on github.com and click the **`content`** folder.
2. Click the file you want, for example **`riddles.json`**.
3. Click the **pencil icon ✏️** (top right of the file) to edit.
4. Make your change (see the examples below).
5. Scroll down, type a short note such as "Added a riddle", and click **Commit changes**.
6. Wait about a minute, then refresh the website. Your change is live.

### ⚠️ The two golden rules: commas and quote marks
These files are in a format called JSON. It's very fussy:

- **Every item in a list is separated by a comma**, but there must be **no comma after the last item**.
- **All text goes inside straight double quotes** `"like this"`. Don't use curly quotes `“like this”`. If you copy from Word, the quotes may turn curly, so retype them.
- If your text needs a double quote inside it, write `\"`. Apostrophes (`'`) are fine as they are.

If you get it wrong, that activity will show a "couldn't load" message. To check your file before saving, paste the whole thing into a free JSON checker such as jsonlint.com.

### Age bands
Use one or more of these exactly: `"8-11"`, `"11-14"`, `"14-17"`.

### Example 1: add a riddle (`content/riddles.json`)
The file looks like this:
```json
{
  "items": [
    { "question": "What has a neck but no head?", "answer": "A bottle", "ages": ["8-11"] },
    { "question": "What disappears as soon as you say its name?", "answer": "Silence", "ages": ["11-14", "14-17"] }
  ]
}
```
To add one, put a **comma** after the last `}` and paste your new line underneath:
```json
    { "question": "What disappears as soon as you say its name?", "answer": "Silence", "ages": ["11-14", "14-17"] },
    { "question": "What has four legs but can't walk?", "answer": "A table", "ages": ["8-11"] }
  ]
}
```
Copy and paste this, then change the words:
```json
    { "question": "YOUR RIDDLE HERE", "answer": "YOUR ANSWER HERE", "ages": ["8-11"] }
```

### Example 2: add a quiz question (`content/quiz.json`)
It works the same way as a riddle:
```json
    { "question": "What is the capital of Scotland?", "answer": "Edinburgh", "ages": ["8-11", "11-14"] }
```

### Example 3: add a printable (`content/printables.json`)
1. First upload the PDF. Open the **`printables`** folder, click **Add file → Upload files**, drag your PDF in and click **Commit changes**. Use a simple file name with no spaces, e.g. `times-tables-bingo.pdf`.
2. Then edit `content/printables.json` and add:
```json
    {
      "title": "Times tables bingo",
      "ages": ["8-11"],
      "description": "Print one card per pupil.",
      "pdf": "printables/times-tables-bingo.pdf"
    }
```
Remember the comma after the item before it.

### Other files you can edit
- `scramble.json`: words to unscramble (with an optional hint)
- `would-you-rather.json`: two options per question
- `odd-one-out.json`: four options, the answer and a short explanation
- `emoji.json`: emojis, the answer, and an optional hint
- `activities.json`: the cards on the homepage
- `site.json`: site settings (e.g. the Buy Me a Coffee username)

The full list of fields for every file is in [`content/README.md`](content/README.md).

### Made a mistake?
Don't panic. GitHub keeps every version. Open the file, click **History**, and you can see (and copy back) any earlier version.
