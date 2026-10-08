# Study Spots: a PocketBase starter for CS 5774

A small multi-page web app (HTML, CSS, jQuery) that uses [PocketBase](https://pocketbase.io)
as its backend. It shows the basics you need to connect your own project to PocketBase.

> **Status: iteration 2 of 6.** You can browse study spots, sign up, log in and log out.
> Creating, editing, permissions, search and realtime are added in later iterations.

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
    ├── login.html          log in and sign up forms
    ├── css/style.css
    └── js/
        ├── pb.js           creates the shared PocketBase client
        ├── nav.js          header: "Log in" link or "Hi, name / Log out" (every page)
        ├── list.js         loads and renders spots
        ├── auth.js         handles the log in and sign up forms
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

## The `users` collection (an *auth* collection)

An **auth collection** is a base collection plus built-in login. PocketBase creates one called
`users` for you, already containing:

| Field      | Notes |
|------------|-------|
| `email`, `password` | used to log in. The password is stored hashed and is never returned by the API |
| `emailVisibility`   | if off (the default), other users can't see this user's email |
| `verified`          | for email verification (not used in this starter) |
| `name`, `avatar`    | optional profile fields |

We added one field:

| Field  | Type   | Notes |
|--------|--------|-------|
| `role` | select | `member` or `admin`, required |

**App users are not superusers.** Superusers log into the dashboard (`/_/`) and ignore all
API rules. Records in `users` log into *your app* and are limited by the rules.
To make an app admin, create a `users` record in the dashboard with `role` = admin.

### How login works in the code

| Action  | SDK call | What happens |
|---------|----------|--------------|
| Sign up | `pb.collection('users').create({...})` | creates a user record (does not log in) |
| Log in  | `pb.collection('users').authWithPassword(email, pw)` | server returns a token; the SDK saves it in `pb.authStore` |
| Who am I? | `pb.authStore.isValid`, `pb.authStore.record` | read from the browser's localStorage, so it survives reloads |
| Log out | `pb.authStore.clear()` | forgets the token in this browser (no server request) |

After login, the SDK automatically sends the token with every request. That is how API
rules know who is asking (`@request.auth.id`, `@request.auth.role`, ...).

### Rules on `users`

| Rule   | Value | Why |
|--------|-------|-----|
| List / View | `id = @request.auth.id` | (default) you can only see your own account |
| Create | `@request.body.role = "member"` | anyone can sign up, but **only as a member**. Without this, anyone could send `role: "admin"` |
| Update | `id = @request.auth.id && @request.body.role:isset = false` | you can edit only yourself and **can't change your role**. The default rule would let a member promote themselves |
| Delete | `id = @request.auth.id` | (default) you can delete only your own account |

Hiding a button in the UI does **not** protect anything. Anyone can call the API directly
from the browser console. The rules are what actually enforce permissions.
