# Study Spots: a PocketBase starter for CS 5774

A small multi-page web app (HTML, CSS, jQuery) that uses [PocketBase](https://pocketbase.io)
as its backend. It shows the basics you need to connect your own project to PocketBase.

> **Status: iteration 1 of 6.** Right now the app only *reads* a list of study spots.
> Login, creating, editing, permissions, search and realtime are added in later iterations.

## What is PocketBase?

PocketBase is a single program you run on your own machine. It gives you:

- a **database** (SQLite, stored in `pb_data/`)
- an **admin dashboard** at `http://127.0.0.1:8090/_/` for creating collections (tables)
- a **REST API** your JavaScript calls through the official JS SDK
- **user accounts** and **API rules** (who can do what)
- a **static file server** for your HTML/CSS/JS, from the `pb_public/` folder

## Run it

1. [Download PocketBase](https://pocketbase.io/docs/) for your OS (this repo was built with **v0.40.4**).
   Unzip it and put the `pocketbase` executable (`pocketbase.exe` on Windows) in this folder.
2. Start the server from this folder:
   ```
   ./pocketbase serve
   ```
   On first start, PocketBase runs the files in `pb_migrations/`, which create the `spots` collection.
   It prints a link to create your **superuser** (admin) account. Open the link and create the account.
3. In the dashboard (`http://127.0.0.1:8090/_/`), add a few records to `spots`.
   The migrations created the `spots` collection, but it starts **empty**:
   **migrations copy the structure of your backend (collections, fields, rules), not the data.**
4. Open the app at **http://127.0.0.1:8090/**

> ⚠️ **Do not double-click `index.html`.** If your address bar starts with `file://`, the page
> will stay on "Loading spots…" forever, because browsers block JavaScript modules on `file://`
> pages. Always use **http://127.0.0.1:8090/** while `./pocketbase serve` is running.

`./pocketbase serve` runs one web server that handles three jobs:

| URL                              | Serves                                   |
|----------------------------------|------------------------------------------|
| `http://127.0.0.1:8090/_/`       | the admin dashboard                      |
| `http://127.0.0.1:8090/api/...`  | the REST API (what the SDK calls)        |
| `http://127.0.0.1:8090/` + anything else | files from the `pb_public/` folder (our website) |

## Project layout

```
study-spots/
├── pocketbase              the server (you download this; not in git)
├── pb_data/                database + uploaded files (created automatically; not in git)
├── pb_migrations/          collection definitions, written by the dashboard (in git)
└── pb_public/              the website PocketBase serves at http://127.0.0.1:8090/
    ├── index.html          the spot list page
    ├── css/style.css
    └── js/
        ├── pb.js           creates the shared PocketBase client
        ├── list.js         loads and renders spots
        └── vendor/pocketbase.es.mjs   the PocketBase JS SDK v0.28.1 (unmodified)
```

**Why commit `pb_migrations/` but not `pb_data/`?** Each time you change a collection in the
dashboard, PocketBase writes a small JS file to `pb_migrations/` that records the change.
Anyone who clones the repo and runs `./pocketbase serve` gets the same collections.
`pb_data/` holds your actual data and your superuser password, so it stays on your machine.

## How the pieces connect

1. `index.html` loads jQuery, then `js/list.js` with `type="module"` (needed to use `import`).
2. `js/pb.js` imports the SDK file, creates one client with
   `new PocketBase('http://127.0.0.1:8090')`, and exports it so every page uses the same one.
   (The PocketBase docs write `import PocketBase from 'pocketbase'`. That form only works with
   npm and a bundler. In a plain browser page you import the file path instead.)
3. `js/list.js` imports that client and calls
   `pb.collection('spots').getList(1, 20, { sort: '-created' })`, which sends
   `GET /api/collections/spots/records`. Then it builds a card for each record with jQuery.

## The `spots` collection (a *base* collection)

A **base collection** is a plain table for your app's data, your "item".

| Field         | Type   | Notes                                   |
|---------------|--------|-----------------------------------------|
| `title`       | text   | required                                |
| `description` | text   |                                         |
| `category`    | select | one of: library, cafe, outdoor, lab     |
| `id`, `created`, `updated` | (automatic) | added by PocketBase to every record |

### API rules

Every collection has 5 rules: **List, View, Create, Update, Delete**. Each rule is one of:

| Rule value          | Who is allowed                                   |
|---------------------|--------------------------------------------------|
| locked (`null`)     | only superusers (this is the default)            |
| empty (`""`)        | everyone, including visitors who are not logged in |
| an expression       | only requests that match it, e.g. `@request.auth.id != ""` |

In this iteration, `spots` has **List** and **View** set to empty (public). **Create, Update, Delete** are locked.

The List rule also **filters** results. If a record doesn't match the rule, it is left out
of the response, and you get no error. Try setting the List rule to `category = "cafe"`
and reload the page.
