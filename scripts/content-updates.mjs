/**
 * Brings existing content files up to date when a website update adds,
 * renames or regroups editable fields, without losing anything that has
 * already been edited. Each step only changes what is missing or out of date.
 * Safe to run any number of times; runs automatically before `npm run dev`
 * and `npm run build`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PAGES = join(import.meta.dirname, "..", "src", "content", "pages");

/** Sections that gained a "Show this section" tick box (ticked, so nothing disappears). */
const SECTIONS = {
  "home.json": ["upcoming", "approach"],
  "auctions.json": ["selling", "past"],
  "sell.json": ["process", "showroom", "fees"],
  "how-to-buy.json": ["register", "ways", "payment", "collection"],
  "about.json": ["visit"],
  "team.json": ["featured"],
  "contact.json": ["map", "enquiries"],
};

const updates = [
  {
    file: "about.json",
    description: "Showroom illustration in “Visit us on Fulham Road”",
    apply(c) {
      if (!c.visit || c.visit.illustration) return false;
      c.visit.illustration = {
        image: "/images/pages/about/visit/illustration/image.jpg",
        alt: "Watercolour illustration of the Sloane Street Auctions showroom on Fulham Road, with navy awnings and planted window boxes",
        onWhite: true,
      };
      return true;
    },
  },
  {
    file: "auctions.json",
    description: "Auctions page: past auctions grouped into one section; link to all catalogues",
    apply(c) {
      let changed = false;
      if (!c.past) {
        c.past = { show: true, title: c.pastTitle ?? "Past auctions", text: "Catalogues and results from our previous sales." };
        changed = true;
      }
      for (const old of ["pastTitle", "pastText", "pastLinkLabel"]) {
        if (old in c) {
          delete c[old];
          changed = true;
        }
      }
      if (!("catalogueLinkLabel" in c)) {
        c.catalogueLinkLabel = "Browse all catalogues";
        changed = true;
      }
      return changed;
    },
  },
  {
    file: "home.json",
    description: "Homepage: message for when no sales are coming up",
    apply(c) {
      if (!c.upcoming || "noUpcoming" in c.upcoming) return false;
      c.upcoming.noUpcoming = "Our next sales will be announced here shortly.";
      return true;
    },
  },
  {
    file: "navigation.json",
    description: "Footer: removed the link to the old search page (search is now on the Easy Live auction site)",
    apply(c) {
      let changed = false;
      for (const col of c.footerColumns ?? []) {
        const before = col.links?.length ?? 0;
        col.links = (col.links ?? []).filter((l) => l.href !== "/search");
        if (col.links.length !== before) changed = true;
      }
      return changed;
    },
  },
  {
    file: "auction-calendar.json",
    description: "Auction calendar: consignment deadline wording",
    apply(c) {
      if (c.deadlines) return false;
      c.deadlines = { label: "Consign by", showOnSell: true, sellText: "Now consigning for" };
      return true;
    },
  },
  {
    file: "settings.json",
    description: "Contact details: inbox for valuation requests (info@)",
    apply(c) {
      if (c.valuationInbox) return false;
      c.valuationInbox = "info@sloanestreetauctions.com";
      return true;
    },
  },
  {
    file: "navigation.json",
    description: "Menus: “Sign in / Register” link in the header",
    apply(c) {
      if (!c.header || "signInLabel" in c.header) return false;
      c.header.signInLabel = "Sign in / Register";
      return true;
    },
  },
  {
    file: "navigation.json",
    description: "Menus: page on/off switches (all pages on)",
    apply(c) {
      if (c.pages) return false;
      c.pages = { sell: true, howToBuy: true, about: true, team: true, stories: true };
      return true;
    },
  },
  ...Object.entries(SECTIONS).map(([file, keys]) => ({
    file,
    description: `“Show this section” tick boxes (${file.replace(".json", "")})`,
    apply(c) {
      let changed = false;
      for (const key of keys) {
        if (c[key] && typeof c[key] === "object" && !("show" in c[key])) {
          c[key] = { show: true, ...c[key] };
          changed = true;
        }
      }
      return changed;
    },
  })),
];

/**
 * One-time changes the owner asked for, applied once only (recorded in
 * src/content/applied-updates.json), so they can still be changed back in the
 * editor afterwards without being undone again.
 */
const ONCE = [
  {
    id: "2026-10-29-hero-two-buttons",
    file: "home.json",
    description: "Homepage: opening shows just the photograph with two buttons, “Upcoming Auctions” and “Sell with us”",
    apply(c) {
      if (!c.hero) return false;
      c.hero = { showWords: false, ...c.hero, showWords: false };
      if (!c.hero.buttonLabel || c.hero.buttonLabel === "View upcoming auctions") c.hero.buttonLabel = "Upcoming Auctions";
      if (!c.hero.linkLabel) c.hero.linkLabel = "Sell with us";
      return true;
    },
  },
  {
    id: "2026-10-29-highlights-replace-navy-band",
    file: "home.json",
    description: "Homepage: sale highlights take the place of the navy band (band switched off; tick it back on in the editor any time)",
    apply(c) {
      if (!c.approach) return false;
      c.approach.show = false;
      return true;
    },
  },
  {
    id: "2026-10-29-hero-words-back",
    file: "home.json",
    description: "Homepage: headline, text and buttons back on the opening photograph (switch them off any time with the tick box)",
    apply(c) {
      if (!c.hero) return false;
      c.hero.showWords = true;
      if (c.hero.buttonLabel === "Upcoming Auctions") c.hero.buttonLabel = "View upcoming auctions";
      return true;
    },
  },
];

/** New content files that didn't exist before, created empty. */
const newFiles = {
  "terms-and-conditions.json": {
    seo: { title: "Terms and Conditions", description: "The terms and conditions of sale at Sloane Street Auctions." },
    title: "Terms and Conditions",
    updated: "",
    body: "",
  },
  "privacy-policy.json": {
    seo: { title: "Privacy Policy", description: "How Sloane Street Auctions collects, uses and protects personal information." },
    title: "Privacy Policy",
    updated: "",
    body: "",
  },
  "shipping-policy.json": {
    seo: { title: "Shipping Policy", description: "Collection and shipping of purchases from Sloane Street Auctions." },
    title: "Shipping Policy",
    updated: "",
    body: "",
  },
  "auction-calendar.json": {
    easyLive: {},
    deadlines: { label: "Consign by", showOnSell: true, sellText: "Now consigning for" },
    sales: [],
  },
  "sale-highlights.json": {
    show: true,
    showOnAuctionsPage: true,
    eyebrow: "Sale highlights",
    title: "Recent results",
    intro: "",
    priceLabel: "Sold for",
    items: [],
  },
};

for (const [file, initial] of Object.entries(newFiles)) {
  const path = join(PAGES, file);
  if (!existsSync(path)) {
    writeFileSync(path, JSON.stringify(initial, null, 2) + "\n");
    console.log(`Content added: ${file}`);
  }
}

for (const u of updates) {
  const path = join(PAGES, u.file);
  if (!existsSync(path)) continue;
  const content = JSON.parse(readFileSync(path, "utf8"));
  if (u.apply(content)) {
    writeFileSync(path, JSON.stringify(content, null, 2) + "\n");
    console.log(`Content updated: ${u.description}`);
  }
}

const APPLIED = join(PAGES, "..", "applied-updates.json");
const applied = existsSync(APPLIED) ? JSON.parse(readFileSync(APPLIED, "utf8")) : [];
let appliedChanged = false;
for (const u of ONCE) {
  if (applied.includes(u.id)) continue;
  const path = join(PAGES, u.file);
  if (!existsSync(path)) continue;
  const content = JSON.parse(readFileSync(path, "utf8"));
  if (u.apply(content)) {
    writeFileSync(path, JSON.stringify(content, null, 2) + "\n");
    console.log(`Content updated: ${u.description}`);
  }
  applied.push(u.id);
  appliedChanged = true;
}
if (appliedChanged) writeFileSync(APPLIED, JSON.stringify(applied, null, 2) + "\n");
