# Sloane Street Auctions — new website (Phase 1 prototype)

A bespoke frontend for Sloane Street Auctions, built with Next.js, TypeScript and Tailwind CSS.
Your main website: everything on it is edited by you in the editing screen (`/keystatic`). Catalogues, accounts and
bidding live on your Easy Live auction site, which this site links to. Not yet online: it runs on your computer
until you approve hosting.

## Preview it on your computer

You need [Node.js](https://nodejs.org) version 22 or later (choose the "LTS" download).

1. Open a terminal in this folder.
2. Install the project's packages (first time only):
   ```
   npm install
   ```
3. Start the preview:
   ```
   npm run dev
   ```
4. Open **http://localhost:3000** in your browser. Pages update as files are edited.
5. Press `Ctrl + C` in the terminal to stop it.

To check everything before saving a version: `npm run check` (types, code style, production build).

## Where things live

| What | Where |
| --- | --- |
| Colours, typefaces, type sizes, spacing | `src/app/globals.css` (design tokens at the top) |
| Fonts (self-hosted, open licence) | `src/fonts/`, loaded in `src/app/fonts.ts` |
| Pages | `src/app/(home)` (homepage, dark header) and `src/app/(site)` (all other pages, light header). The bracketed folder names don't appear in web addresses. |
| Header, footer, menus | `src/components/layout/` |
| Buttons, images, labels | `src/components/ui/` |
| **All page wording, contact details, menus** | `src/content/pages/*.json`, edited at `/keystatic` (see "Editing the website") |
| Editorial photographs | `public/images/pages/`, added at `/keystatic` |
| What the editor shows (its fields) | `keystatic.config.ts` |

## Auctions and Easy Live

Easy Live hosts catalogues, lots, accounts, registration, bidding and payment on your branded auction subdomain
(a white-label site). This website is your main site and links to it; nothing is copied or duplicated.

- **Auction calendar** (in the editor): add each sale once — name, date, time, short description, cover photo and the
  link to its catalogue on the Easy Live site. It appears on the homepage and Auctions page, and moves to
  "Past auctions" automatically the day after the sale. No cover photo? It shows a navy cover with the date.
- **Past catalogue covers** (in the editor, under Auctions): your catalogue covers, newest first, shown as a scrolling
  row on the homepage (and, if ticked, the Auctions page). Each cover is shown whole; add a link to open its catalogue.
- **Easy Live links** (top of the Auction calendar): your auction site's address and its sign-in page. Once filled in,
  the search button, "Browse all catalogues" and "Sign in or register to bid" appear automatically. Until then they
  are simply hidden — never shown as fake buttons.
- **Featured lots** (inside each sale in the Auction calendar): a handful of the sale's best pieces — photo, lot
  number, artist or maker, title, estimate and the link to the lot on Easy Live. They show as a scrolling row under
  the upcoming sales on the homepage and Auctions page, and disappear by themselves once the sale has passed. Untick
  "Show featured lots" (Auction calendar → Featured lots: on/off and wording) to hide them everywhere at any time.
- Connecting the subdomain is a DNS setting at your domain provider, done by you or Easy Live (not by this project).

## The valuation form

`/valuation` checks everything (in the browser and again on the server) and shrinks photos in the browser
before upload, so phone photos of 10 MB+ send quickly.

Each request is **emailed to the inbox set in the editor** (Contact details → "Valuation requests are sent to",
currently info@sloanestreetauctions.com) with the photos attached; pressing Reply answers the sender directly.
If sending ever fails, the visitor is told to email or call instead; they are never shown a false "thank you".

Sending is switched on by settings on the live host (never in the code), using Resend (resend.com):

| Setting | Value |
| --- | --- |
| `VALUATION_DELIVERY` | `resend` |
| `RESEND_API_KEY` | the key from your Resend account (secret) |
| `VALUATION_FROM` | e.g. `Sloane Street Auctions <valuations@sloanestreetauctions.com>` |

Resend asks you to verify the domain by adding a few DNS records; this doesn't affect your existing email. On your
own computer sending stays off (`none`), so testing never sends real email; the form says so.

## Mailing list (Mailchimp)

A small panel invites visitors to join your Mailchimp mailing list. It appears once, after about 20 seconds or
halfway down a page; closing it keeps it away for 90 days, and it never appears on the valuation form. New
addresses are added as "pending", so Mailchimp emails them a link to confirm (double opt-in). Wording, timing and
an on/off switch are in the editor under **Across the site → Mailing list sign-up**.

On the live site the panel stays hidden until these two settings are added on the host (never in the code):

| Setting | Where to find it in Mailchimp |
| --- | --- |
| `MAILCHIMP_API_KEY` | Profile → Extras → API keys → Create a key (it ends in something like `-us21`) |
| `MAILCHIMP_AUDIENCE_ID` | Audience → Settings → Audience name and defaults → Audience ID |

On your computer (`npm run dev`) it shows as a preview, with a note that nothing is sent.

## Photographs and file sizes

Photos added in the editor can be any size. Before the preview or a build starts, `scripts/optimise-photos.mjs`
resizes any website photo larger than 4,000 px on its longest side (or over 10 MB) to 4,000 px at high quality;
still more than twice the detail any screen shows. Visitors are always sent a copy sized for their screen.
Only the website's copies change, so keep your originals.

## Editing the website

Every word and editorial photograph on the site is edited in the **editing screen**, not in the code.
Auctions, lots, estimates and lot photographs are the exception: they come from Easy Live.

### Trying it on your computer

1. Start the preview (`npm run dev`).
2. Open **http://localhost:3000/keystatic**.
3. Choose a page on the left, change the wording or photos, and press **Save**.
4. Open the page on the site (e.g. http://localhost:3000/sell) to see the change straight away.

Saving on your computer writes straight into the project files (`src/content/pages/` for wording,
`public/images/pages/` for photos), so `git diff` shows exactly what changed and anything can be undone.

### Removing and hiding things

- **Whole sections:** untick **Show this section** at the top of a section. Nothing is deleted, so ticking it again
  brings it back exactly as it was.
- **Any box:** leave it empty and it disappears from the page (only page headlines must be filled in). An empty
  button wording hides the button.
- **Photos:** click **Remove** under the photo. The layout closes up around it (for example, the words take the full
  width). Removing a photo deletes the website's copy, so keep your original.
- **Lists** (steps, people, ways to bid, notes, sales): use the ⋯ menu on an item to remove it, or drag to reorder.

### What is in the editor

| Section | What you can change |
| --- | --- |
| Auction calendar | Your sales and the links to their catalogues on Easy Live |
| Homepage, Auctions page, Sell With Us, How to Buy, About, Meet the Team, Contact, Request a Valuation, Stories, Page not found | All headings, text, buttons and editorial photographs on that page, plus its Google title and summary |
| Contact details & opening hours | Address, phone numbers, email addresses, opening hours, Google Maps address, policy page links. Used everywhere on the site |
| Pages & menus | Switch whole pages on or off (Sell With Us, How to Buy, About, Meet the Team, Stories & Insights); menu wording, footer columns and links, footer button and note |

**Handy shortcuts in longer text boxes:**
- A link: `[Conditions of Sale](https://www.sloanestreetauctions.com/terms-and-conditions)` or, for a page on this site, `[Sell With Us](/sell)`.
- `{phone}`, `{phone2}`, `{email}` and `{accountsEmail}` insert the details from *Contact details*, as links, so a new
  phone number only has to be changed once.
- On the About page, leave an empty line between paragraphs.

**Photographs:** any JPEG, PNG or WebP. Large photos are fine; the site makes smaller copies automatically.
Tick *Studio photograph on a white background* for objects shot on white, so the white blends into the page.

**Meet the Team:** add each person's name, job title and portrait. Use *Add* / the ⋯ menu to add, remove or reorder people.

### Once the site is online

The editor is **switched off on a live site** until it is connected to GitHub, so nobody can edit the public site
without signing in. To switch it on (needs your approval and accounts, so it hasn't been done):
1. Put the project on GitHub (a free private repository).
2. Host the site on a service that rebuilds from GitHub (for example Vercel's free plan).
3. Create a Keystatic GitHub app (the editor walks you through it the first time) and set these settings on the host:
   `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO` (e.g. `your-name/sloane-street-auctions`), plus the `KEYSTATIC_GITHUB_CLIENT_ID`,
   `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` values it gives you. These are secrets: never put them in the code.
4. Editors then sign in at **yoursite/keystatic** with their GitHub account. Each save is kept as a version, and the
   site republishes itself within a couple of minutes.

### Checking content

`npm run content` checks every content file against the editor's fields (it also runs as part of `npm run check`),
so a mistake in a hand-edited file is caught before the site is built.

## Applying website updates

Updates arrive as a small zip of changed files. From the project folder run `unzip -o ~/Downloads/<update>.zip`,
then restart the preview. Your wording and photos are never overwritten: when an update adds or renames editor fields,
`scripts/content-updates.mjs` fills them in for you, and `scripts/remove-old-files.mjs` removes code an update no longer
uses. Both run automatically when the preview or build starts.

## Addresses from the previous website

So that Google results and bookmarks keep working after the switch:

| Old address | Now goes to |
| --- | --- |
| /about-us, /history | About |
| /meet-the-team | Meet the Team |
| /contact-us | Contact |
| /selling | Sell With Us |
| /buying, /faqs, /collection---shipping | How to Buy |
| /auction-results | Auctions, past sales |
| /news | Stories & Insights |
| /terms-and-conditions, /privacy-policy, /shipping-policy | Pages on this site at the same addresses (editor → Policies) |
| /register, /login | Easy Live sign-in (once set in the Auction calendar), otherwise How to Buy |
| /catalogue/…, /auction-registration/… | The same page on the Easy Live auction site (once set), otherwise Auctions |

The first group are permanent redirects (in `next.config.ts`). The Easy Live ones live in `src/app/(easy-live)/`.

## Policy pages

Terms and Conditions, Privacy and Shipping are edited under **Policies**. Paste the wording exactly; an empty line
starts a new paragraph, `## ` a heading and `- ` a bullet point. While a page is empty it says it is being updated
and gives your email address.

## The logo

One file, `public/brand/logo.png`, in its original colour: PANTONE 871 C (screen equivalent #84754E), from the vector
print artwork. It is never recoloured. Vector masters are in `brand-source/vector/`.

## Restoring an earlier version

Every milestone is saved with Git. `git log --oneline` lists them; ask before rolling back so nothing is lost.
