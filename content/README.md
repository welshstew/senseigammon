# Content field reference

Every file is a JSON object with a single `items` list, except `site.json`. Keep the items flat and simple.

**Age bands** (used in `ages` everywhere): `"8-11"`, `"11-14"`, `"14-17"`. An item can have several. An item with no `ages` shows in every band.

Text fields are plain text (no HTML). Emojis are fine.

These files are edited through Pages CMS using the forms defined in `/.pages.yml`. If you add or rename a field here, update `.pages.yml` to match.

---

## `site.json`: site settings
| Field | Required | Example | Notes |
|---|---|---|---|
| `siteName` | yes | `"Sensei Gammon"` | |
| `buyMeACoffeeUsername` | yes | `"BMC_USERNAME"` | Used to build `https://buymeacoffee.com/<username>` everywhere |

## `activities.json`: homepage cards
| Field | Required | Example | Notes |
|---|---|---|---|
| `id` | yes | `"riddles"` | Must match an activity type in `js/play.js`: `riddles`, `scramble`, `would-you-rather`, `odd-one-out`, `emoji`, `quiz` |
| `title` | yes | `"Riddles"` | |
| `emoji` | yes | `"🤔"` | Card icon |
| `description` | yes | `"Brain-teasing riddles…"` | One or two short sentences |
| `minutes` | yes | `["2", "5", "10"]` | Any of `"2"`, `"5"`, `"10"`, `"15+"` (as text) |
| `ages` | yes | `["8-11", "11-14"]` | |
| `groups` | yes | `["class", "teams"]` | Any of `"class"` (whole class), `"teams"`, `"solo"` (quiet/solo) |
| `energy` | yes | `["calm"]` | `"calm"` and/or `"lively"` |

## `riddles.json`
| Field | Required | Example |
|---|---|---|
| `question` | yes | `"What has a neck but no head?"` |
| `answer` | yes | `"A bottle"` |
| `ages` | yes | `["8-11"]` |

## `scramble.json`
| Field | Required | Example | Notes |
|---|---|---|---|
| `word` | yes | `"rabbit"` | Single word. Spaces are ignored. Shown in capitals |
| `hint` | no | `"A furry pet with long ears"` | Shown when the Hint button is pressed |
| `seconds` | no | `60` | Countdown per word (a number, no quotes). Default 45 |
| `ages` | yes | `["8-11"]` | |

## `would-you-rather.json`
| Field | Required | Example |
|---|---|---|
| `optionA` | yes | `"Be able to fly"` |
| `optionB` | yes | `"Be able to turn invisible"` |
| `ages` | yes | `["8-11", "11-14", "14-17"]` |

## `odd-one-out.json`
| Field | Required | Example | Notes |
|---|---|---|---|
| `options` | yes | `["Apple", "Banana", "Carrot", "Pear"]` | Four items (shown in a random order) |
| `answer` | yes | `"Carrot"` | Must be spelled exactly as in `options` |
| `explanation` | yes | `"A carrot is a vegetable…"` | Shown on reveal |
| `ages` | yes | `["8-11"]` | |

## `emoji.json`
| Field | Required | Example | Notes |
|---|---|---|---|
| `emojis` | yes | `"🌧️🐱🐶"` | Common sayings/phrases only (please avoid film titles) |
| `answer` | yes | `"Raining cats and dogs"` | |
| `hint` | no | `"Very heavy rain"` | |
| `ages` | yes | `["8-11"]` | |

## `quiz.json`
| Field | Required | Example |
|---|---|---|
| `question` | yes | `"What is the capital city of Wales?"` |
| `answer` | yes | `"Cardiff"` |
| `ages` | yes | `["8-11", "11-14"]` |

## `printables.json`
| Field | Required | Example | Notes |
|---|---|---|---|
| `title` | yes | `"Riddle sheet"` | |
| `ages` | yes | `["8-11"]` | |
| `description` | no | `"Ten riddles to print…"` | |
| `pdf` | yes | `"printables/riddle-sheet.pdf"` | Relative path to a PDF uploaded into `/printables/` |
