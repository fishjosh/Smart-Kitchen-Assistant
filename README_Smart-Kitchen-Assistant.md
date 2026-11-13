# Smart Kitchen Assistant

A web app for tracking groceries and estimating when each item will expire. Type what you bought, and the app looks it up in a public food-storage dataset, shows an estimated shelf-life window, and keeps the inventory synced through Firebase. Built for a Raspberry Pi touch-screen kitchen display.

**Status:** work in progress.

## What it does

- **Add groceries with autocomplete.** Suggestions come from about 450 food names in the dataset.
- **Match what you type to the right food.** The lookup tries an exact name, then an exact keyword, then a partial match, then any matching word. Typing "parmesan" finds the cheese entry even though it is filed under "Cheese."
- **Show expiration as date ranges.** For example, "April 3rd to April 10th in Fridge." If an item can be stored in the pantry or the fridge, both ranges are shown. Days, weeks, months, and years are all handled.
- **Track opened items.** Tap an item to mark it opened, and the estimate switches to the dataset's after-opening guidance. Only items that have after-opening data are tappable (203 of the 629 dataset entries).
- **Sync in real time.** The inventory is stored in Firebase Realtime Database, and a listener updates the screen when the data changes.

## How it works

```
foodkeeper.json  ──►  datatransfer.js (Node)  ──►  food_expiry.json  ──►  index.html + main.js  ◄──►  Firebase
 (spreadsheet          flatten, clean, and          629 entries with        browser app:               Realtime
  export)              drop entries with no         storage rules           lookup, date math,         Database
                       shelf-life numbers
```

1. **Data preparation (`datatransfer.js`).** A Node script reads the spreadsheet export and produces a compact structure for each food: name, subtitle, keywords, and storage rules for pantry and refrigerator (from date of purchase and after opening, each with min, max, and time unit). Values like "Not Recommended" and "Package use-by date" become `null`, and products with no numeric shelf-life data are dropped. Running the script regenerates the committed `food_expiry.json` exactly.
2. **The app (`index.html` and `main.js`).** Plain HTML and JavaScript ES modules, with no framework. It loads `food_expiry.json`, resolves the typed item to a dataset entry, computes the date ranges, and renders the inventory table.
3. **Persistence.** The inventory is saved to and read from Firebase Realtime Database using the Firebase JavaScript SDK.

## Tech stack

JavaScript (ES modules), HTML/CSS, Node.js (data preparation), Firebase Realtime Database

## Run it locally

```bash
git clone https://github.com/fishjosh/Smart-Kitchen-Assistant
cd Smart-Kitchen-Assistant
python3 -m http.server 8000   # any static file server works
```

Then open http://localhost:8000. The page loads the Firebase SDK from a CDN, so it needs an internet connection.

- **Use your own database.** `index.html` points at the author's Firebase project. To run your own copy, create a Realtime Database and replace `firebaseConfig` in `index.html`.
- **Rebuild the dataset.** Run `node datatransfer.js` to regenerate `food_expiry.json` from `foodkeeper.json`.

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | Page layout, tabs, and Firebase setup |
| `main.js` | Food lookup, shelf-life date math, inventory rendering, and Firebase sync |
| `datatransfer.js` | Converts the raw spreadsheet export into `food_expiry.json` |
| `foodkeeper.json` | Raw shelf-life data (spreadsheet release `FMA-Data-v128`) |
| `food_expiry.json` | Cleaned dataset the app reads |
| `smartKitchen/` | Experimental Express scaffold, not yet used by the app |

## Data source

Shelf-life guidance comes from the FoodKeeper dataset, included here as `foodkeeper.json`.

## Known limitations

- No automated tests yet.
- There is one shared inventory list, with no user accounts or authentication.
- Date ranges are estimates from reference data and are not a substitute for food-safety judgment.

## Author

Josh Fishman, [github.com/fishjosh](https://github.com/fishjosh)
