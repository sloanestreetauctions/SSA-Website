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
    file: "auction-calendar.json",
    description: "Auction calendar: featured lots for each sale (on/off and wording)",
    apply(c) {
      if (c.featured) return false;
      c.featured = {
        show: true,
        eyebrow: "From the sale",
        estimateLabel: "Estimate",
        linkLabel: "View and bid",
        catalogueLabel: "View the full catalogue",
        showOnAuctionsPage: true,
      };
      return true;
    },
  },
  ...["sell.json", "how-to-buy.json"].map((file) => ({
    file,
    description: `Removed the gilt frame option (${file.replace(".json", "")})`,
    apply(c) {
      if (!c.hero || !("framed" in c.hero)) return false;
      delete c.hero.framed;
      return true;
    },
  })),
  {
    file: "auction-calendar.json",
    description: "Auction calendar: viewing times for each sale",
    apply(c) {
      if ("viewingLabel" in c) return false;
      c.viewingLabel = "Viewing times";
      return true;
    },
  },
  {
    file: "auction-calendar.json",
    description: "Auction calendar: live sale bar and “Bid live” button wording",
    apply(c) {
      if (c.live) return false;
      c.live = { barText: "Live now", buttonLabel: "Bid live" };
      return true;
    },
  },
  {
    file: "navigation.json",
    description: "Menus: Private Sales page (in the main menu and the footer)",
    apply(c) {
      let changed = false;
      if (c.pages && !("privateSales" in c.pages)) {
        c.pages.privateSales = true;
        changed = true;
      }
      if (c.header && !c.header.privateSales) {
        c.header.privateSales = { label: "Private Sales", description: "Buying and selling by private agreement" };
        changed = true;
      }
      const selling = (c.footerColumns ?? []).find((col) => (col.links ?? []).some((l) => l.href === "/sell"));
      if (selling && !selling.links.some((l) => l.href === "/private-sales")) {
        const at = selling.links.findIndex((l) => l.href === "/sell");
        selling.links.splice(at + 1, 0, { label: "Private sales", href: "/private-sales" });
        changed = true;
      }
      return changed;
    },
  },
  {
    file: "home.json",
    description: "Homepage: “Request a valuation” button beside the other two",
    apply(c) {
      if (!c.hero || "valuationLabel" in c.hero) return false;
      c.hero.valuationLabel = "Request a valuation";
      return true;
    },
  },
  ...[
    ["home.json", ["valuesShow"]],
    ["about.json", ["interiorShow", "statementsShow"]],
    ["valuation.json", ["nextStepsShow", "talkShow", "notesShow"]],
  ].map(([file, keys]) => ({
    file,
    description: `On/off tick boxes for the remaining parts of the page (${file.replace(".json", "")})`,
    apply(c) {
      let changed = false;
      for (const key of keys) {
        if (!(key in c)) {
          c[key] = true;
          changed = true;
        }
      }
      return changed;
    },
  })),
  {
    file: "private-sales.json",
    description: "Private Sales: address (69 Lower Sloane Street) and a space for a shop illustration",
    apply(c) {
      let changed = false;
      if (c.contact && !("address" in c.contact)) {
        c.contact.address = "69 Lower Sloane Street\nLondon";
        changed = true;
      }
      if (c.hero && !("illustration" in c.hero)) {
        c.hero.illustration = { image: null, alt: "", onWhite: true };
        changed = true;
      }
      return changed;
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
  {
    id: "2026-10-30-hero-shopfront-illustration",
    file: "home.json",
    description: "Homepage: the shopfront illustration at the top of the page (switch back to the photograph any time: Homepage → Opening)",
    apply(c) {
      if (!c.hero) return false;
      c.hero.style = "illustration";
      if (!c.hero.illustration?.image) {
        c.hero.illustration = {
          image: "/images/pages/home/illustration/image.jpg",
          alt: "Watercolour illustration of the Sloane Street Auctions shopfront, with navy awnings and planters along the pavement",
        };
      }
      return true;
    },
  },
  {
    id: "2026-10-30-hero-headline-off",
    file: "home.json",
    description: "Homepage: headline (“A little bit of everything”) hidden; tick “Show the headline and text” to bring it back",
    apply(c) {
      if (!c.hero) return false;
      c.hero.showWords = false;
      return true;
    },
  },
  {
    id: "2026-10-30-covers-replace-highlights-on-home",
    file: "sale-highlights.json",
    description: "Homepage: past catalogue covers take the place of the sale highlights (highlights kept; tick “Show on the homepage” to bring them back)",
    apply(c) {
      c.showOnHome = false;
      return true;
    },
  },
  {
    id: "2026-10-30-stories-off",
    file: "navigation.json",
    description: "Stories & Insights switched off (tick it in Pages & menus to bring it back)",
    apply(c) {
      c.pages = { sell: true, howToBuy: true, about: true, team: true, ...(c.pages ?? {}), stories: false };
      return true;
    },
  },
  {
    id: "2026-11-02-home-valuation-not-sell",
    file: "home.json",
    description: "Homepage: buttons are now “Explore our auctions” and “Request a valuation” (type wording into the “Sell with us” button to bring it back)",
    apply(c) {
      if (!c.hero) return false;
      c.hero.linkLabel = "";
      if (!c.hero.valuationLabel) c.hero.valuationLabel = "Request a valuation";
      return true;
    },
  },
  {
    id: "2026-11-02-private-sales-illustration",
    file: "private-sales.json",
    description: "Private Sales: illustration of the Lower Sloane Street shop",
    apply(c) {
      if (!c.hero || c.hero.illustration?.image) return false;
      c.hero.illustration = {
        image: "/images/pages/private-sales/hero/illustration/image.jpg",
        alt: "Watercolour illustration of the Sloane Street Auctions Private Sales shop on Lower Sloane Street, with a navy awning, gilded doors and planters of white hydrangeas",
        onWhite: true,
      };
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
    viewingLabel: "Viewing times",
    live: { barText: "Live now", buttonLabel: "Bid live" },
    featured: { show: true, eyebrow: "From the sale", estimateLabel: "Estimate", linkLabel: "View and bid", catalogueLabel: "View the full catalogue", showOnAuctionsPage: true },
    sales: [],
  },
  "private-sales.json": {
    seo: { title: "Private Sales", description: "Buying and selling by private agreement with Sloane Street Auctions." },
    hero: {
      eyebrow: "Private Sales",
      title: "Private Sales",
      text: "Our Private Sales department arranges sales by private agreement, outside the auction calendar. To discuss buying or selling privately, please get in touch.",
      illustration: { image: null, alt: "", onWhite: true },
      photo: { image: null, alt: "" },
    },
    contact: {
      show: true,
      title: "Speak to Private Sales",
      text: "",
      address: "69 Lower Sloane Street\nLondon",
      phone: "020 7259 0305",
      email: "",
      buttonLabel: "Email Private Sales",
    },
    steps: { show: true, title: "", steps: [] },
  },
  "mailing-list.json": {
    show: true,
    title: "Join our mailing list",
    text: "Be the first to hear about upcoming sales, catalogues and viewing days.",
    buttonLabel: "Sign up",
    consent: "We’ll only email you about our sales and news, and you can unsubscribe at any time. See our [Privacy Policy](/privacy-policy).",
    successText: "Thank you. Please check your inbox and click the link to confirm.",
    delaySeconds: 20,
  },
  "catalogue-covers.json": {
    show: true,
    showOnHome: true,
    showOnAuctionsPage: false,
    eyebrow: "From our archive",
    title: "Past catalogues",
    intro: "",
    items: [
      {
        cover: {
          image: "/images/pages/covers/items/0/cover/image.jpg",
          alt: "Catalogue cover for The September Fine Art Auction: a black and white photograph of a woman in a wide-brimmed black hat, on a blue ground with diamond drop earrings and a pearl bracelet",
          onWhite: false,
        },
        title: "The September Fine Art Auction",
        date: "Thursday 24 September 2026",
        link: null,
      },
      {
        cover: {
          image: "/images/pages/covers/items/1/cover/image.jpg",
          alt: "Catalogue cover for The Summer Auction: a painting of the Madonna and Child in an arched frame, set on an embroidered suzani textile with emerald drop earrings",
          onWhite: false,
        },
        title: "The Summer Auction",
        date: "Friday 10 July 2026",
        link: null,
      },
    ],
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
