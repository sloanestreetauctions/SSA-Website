/**
 * ============================================================================
 *  THE EDITING SCREEN (Keystatic)
 * ============================================================================
 *  Describes every editable box shown at  /keystatic  — one entry per page,
 *  plus the auction calendar, contact details and the menus. The words and
 *  photographs themselves are saved in  src/content/pages/*.json  and
 *  public/images/pages/.
 *
 *  Easy to change, hard to break:
 *   - Every major section has a "Show this section" tick box.
 *   - Almost every box is optional: leave it empty and it disappears from the
 *     page (only page headlines are required).
 *   - Every photograph can be removed; the layout closes up around it.
 *
 *  Catalogues, lots, accounts and bidding are NOT edited here: they live on
 *  your Easy Live auction site. The Auction calendar only lists each sale and
 *  links to its catalogue there.
 *
 *  Where edits are saved:
 *   - On your computer (npm run dev): straight into the project's files.
 *   - Once the site is online: set NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO
 *     (e.g. "your-name/sloane-street-auctions") and the Keystatic GitHub app
 *     settings (README, "Once the site is online"). Edits are then saved to
 *     GitHub, which republishes the site. Until then the editor is switched
 *     off on the live site.
 * ============================================================================
 */
import { config, fields, singleton, type ComponentSchema } from "@keystatic/core";

const githubRepo = process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO;

/* ------------------------------------------------------------------ helpers */

const LINK_HELP =
  "To add a link, write [the words](web address), e.g. [Conditions of Sale](https://…). " +
  "{phone}, {phone2}, {email} and {accountsEmail} insert the contact details from “Contact details”.";

const EMPTY_HIDES = "Leave empty to hide.";

/** A field's hint, always ending with "Leave empty to hide." as its own sentence. */
const hint = (description?: string) => {
  if (!description) return EMPTY_HIDES;
  const d = description.trim();
  return `${/[.!?)”]$/.test(d) ? d : `${d}.`} ${EMPTY_HIDES}`;
};

/** Required: page headlines and a few essentials only. */
const requiredLine = (label: string, description?: string) =>
  fields.text({ label, description, validation: { isRequired: true } });

/** Optional single line: hidden on the page when empty. */
/** An on/off tick box for a part of a page that isn't a section of its own. */
const showSwitch = (label: string) =>
  fields.checkbox({
    label,
    description: "Untick to hide it on the website. Nothing is deleted, so you can tick it again later.",
    defaultValue: true,
  });

const line = (label: string, description?: string) => fields.text({ label, description: hint(description) });

/** Optional paragraph: hidden on the page when empty. */
const paragraph = (label: string, description?: string) => fields.text({ label, multiline: true, description: hint(description) });

const richParagraph = (label: string) => paragraph(label, LINK_HELP);

/** A button or link: its wording. Empty wording hides the button. */
const button = (label: string, goesTo: string) => line(label, `Goes to ${goesTo}.`);

const photoFields = (page: string, description?: string) => ({
  image: fields.image({
    label: "Photograph",
    description:
      (description ? `${description} ` : "") +
      "JPEG, PNG or WebP; large photos are fine. Use “Remove” to take the photo off the page.",
    directory: `public/images/pages/${page}`,
    publicPath: `/images/pages/${page}/`,
  }),
  alt: fields.text({
    label: "Describe the photograph",
    description: "What is in the picture, in a sentence. Read aloud to visitors who can’t see it.",
  }),
});

/** A photograph and its description. Each page keeps its photos in its own folder. */
const photo = (page: string, label: string, description?: string) =>
  fields.object(photoFields(page, description), { label });

/** For object photographs that may be studio shots on white (shown whole, never cropped). */
const objectPhoto = (page: string, label: string, description?: string) =>
  fields.object(
    {
      ...photoFields(page, description),
      onWhite: fields.checkbox({
        label: "Studio photograph on a white background",
        description: "Tick for objects or drawings on white, so the white blends into the page.",
      }),
    },
    { label },
  );

/** A section of a page that can be switched off as a whole. */
function section<S extends Record<string, ComponentSchema>>(label: string, schema: S, description?: string) {
  return fields.object(
    {
      show: fields.checkbox({
        label: "Show this section",
        description: "Untick to hide this whole section on the website. Nothing is deleted, so you can tick it again later.",
        defaultValue: true,
      }),
      ...schema,
    },
    { label, description },
  );
}

const menuItem = (label: string) =>
  fields.object(
    {
      label: requiredLine("Wording"),
      description: line("Short description", "Shown beside the link in the menu on phones."),
    },
    { label },
  );

const pageSwitch = (label: string) => fields.checkbox({ label, defaultValue: true });

const seo = (defaults: { title: string }) =>
  fields.object(
    {
      title: requiredLine("Page title", `Shown in the browser tab and in Google, e.g. “${defaults.title}”.`),
      description: paragraph("Page summary", "One or two sentences shown under the title in Google results."),
    },
    { label: "Google and the browser tab (optional)", description: "How this page appears in Google search results. You rarely need to change this." },
  );

const steps = (label: string, itemLabel: string) =>
  fields.array(fields.object({ title: requiredLine("Heading"), body: paragraph("Text") }), {
    label,
    description: "Use the ⋯ menu on each item to remove it, or drag to reorder.",
    itemLabel: (props) => props.fields.title.value || itemLabel,
  });

function singlePage<S extends Record<string, ComponentSchema>>(label: string, page: string, schema: S) {
  // The Google / browser-tab settings are technical, so they always sit at the bottom of the page in the editor.
  const { seo: google, ...rest } = schema as Record<string, ComponentSchema>;
  const ordered = (google ? { ...rest, seo: google } : rest) as S;
  return singleton({ label, path: `src/content/pages/${page}`, format: { data: "json" }, schema: ordered });
}

/** A legal page: the exact wording, pasted in. Lightly formatted so long text stays readable. */
function policyPage(label: string, page: string) {
  return singlePage(label, page, {
    seo: seo({ title: label }),
    title: requiredLine("Page heading"),
    updated: line("Last updated", "e.g. October 2026."),
    body: fields.text({
      label: "The full text",
      multiline: true,
      description:
        "Paste the wording exactly as it should appear. Leave an empty line between paragraphs. Start a line with ## for a heading, or with - for a bullet point. Links: [the words](web address). While empty, the page says it is being updated and gives your email address.",
    }),
  });
}

/* ------------------------------------------------------------------ config */

export default config({
  storage: githubRepo ? { kind: "github", repo: githubRepo as `${string}/${string}` } : { kind: "local" },
  ui: {
    brand: { name: "Sloane Street Auctions" },
    navigation: {
      "Sales and results": ["calendar", "covers", "highlights"],
      "Pages (in menu order)": ["home", "auctions", "howToBuy", "sell", "privateSales", "about", "team", "contact", "valuation", "stories", "notFound"],
      "Contact details and menus": ["settings", "navigation", "mailingList", "instagram"],
      "Legal pages": ["terms", "privacy", "shipping"],
    },
  },
  singletons: {
    /* ===================================================== AUCTION CALENDAR */
    calendar: singlePage("Auction calendar", "auction-calendar", {
      easyLive: fields.object(
        {
          site: fields.url({
            label: "Your Easy Live auction site",
            description:
              "The home page of your auction subdomain, e.g. https://auctions.sloanestreetauctions.com. Used for the search button and “all catalogues” links. Leave empty until it is set up.",
          }),
          signIn: fields.url({
            label: "Sign in / create account page",
            description: "Where “Sign in or register to bid” goes. Leave empty until Easy Live gives you the address.",
          }),
        },
        { label: "Easy Live links" },
      ),
      deadlines: fields.object(
        {
          label: line("Wording before the deadline date", "e.g. Consign by"),
          showOnSell: fields.checkbox({
            label: "Show the next deadline on Sell With Us",
            description: "Shows the nearest open consignment deadline near the top of the Sell With Us page.",
            defaultValue: true,
          }),
          sellText: line("Wording on Sell With Us", "e.g. Now consigning for. The sale name and date follow automatically."),
        },
        { label: "Consignment deadlines" },
      ),
      live: fields.object(
        {
          barText: line("Wording at the start of the bar", "e.g. Live now. The sale’s name follows automatically."),
          buttonLabel: line("Wording of the button", "e.g. Bid live"),
        },
        { label: "Live sale (on the day of a sale)", description: "Shown only on the sale day, and only for a sale with a live bidding link." },
      ),
      viewingLabel: line("Wording of the viewing times drop-down", "e.g. Viewing times"),
      featured: fields.object(
        {
          show: fields.checkbox({
            label: "Show featured lots",
            description:
              "Untick to hide featured lots everywhere (nothing is deleted). They also hide by themselves when no upcoming sale has any lots added.",
            defaultValue: true,
          }),
          eyebrow: line("Small heading above featured lots", "e.g. From the sale. The sale’s name is shown underneath automatically."),
          estimateLabel: line("Wording before each estimate", "e.g. Estimate"),
          linkLabel: line("Wording of the link on each lot", "e.g. View and bid. Shown on lots that have a link."),
          catalogueLabel: line("Wording of the link to the whole catalogue", "e.g. View the full catalogue. Shown once the sale’s catalogue link is added."),
          showOnAuctionsPage: fields.checkbox({ label: "Also show on the Auctions page", defaultValue: true }),
        },
        { label: "Featured lots: on/off and wording", description: "The lots themselves are added to each sale below, under Sales." },
      ),
      sales: fields.array(
        fields.object({
          title: requiredLine("Name of the sale", "e.g. Fine Art, Antiques & Collectables"),
          date: fields.date({ label: "Date of the sale", validation: { isRequired: true } }),
          time: line("Start time", "e.g. 11:00"),
          consignmentDeadline: fields.date({
            label: "Consignment deadline",
            description:
              "Last date to consign items for this sale. Shown on the sale (and on Sell With Us) until it has passed. Leave empty to hide.",
          }),
          description: paragraph("Short description", "One or two lines, e.g. what is in the sale and how to bid."),
          viewing: paragraph(
            "Viewing times",
            "One line per day, e.g. Monday 30 November, 10am – 5pm. Shown on the sale on the Auctions page.",
          ),
          liveLink: fields.url({
            label: "Live bidding link",
            description:
              "The Easy Live page where people watch and bid live during the sale. On the day of the sale, a “Live now” bar appears at the top of every page and the sale gets a “Bid live” button. Leave empty to hide.",
          }),
          catalogueLink: fields.url({
            label: "Link to the catalogue",
            description:
              "The sale’s page on your Easy Live auction site. Until it’s added, the sale shows “Catalogue coming soon”.",
          }),
          photo: objectPhoto("calendar", "Cover photograph", "A highlight from the sale."),
          featuredLots: fields.array(
            fields.object({
              photo: objectPhoto("calendar", "Photograph", "Ideally an upright photo of the lot."),
              lotNumber: line("Lot number", "e.g. 42"),
              maker: line("Artist or maker", "e.g. John Wootton (1682–1764)"),
              title: requiredLine("Title of the lot"),
              estimate: line("Estimate", "As you’d like it shown, e.g. £3,000–5,000."),
              link: fields.url({
                label: "Link to the lot",
                description: "The lot’s page on your Easy Live auction site, where people can bid.",
              }),
            }),
            {
              label: "Featured lots",
              description:
                "A handful of the best pieces in this sale (8–12 works well). Shown under the sale on the homepage and Auctions page until the sale has passed. Leave empty to show none. Drag to reorder.",
              itemLabel: (props) =>
                `${props.fields.lotNumber.value ? `Lot ${props.fields.lotNumber.value} · ` : ""}${props.fields.title.value || "New lot"}`,
            },
          ),
        }),
        {
          label: "Sales",
          description:
            "Add each sale once. It shows as upcoming until its date has passed, then moves to Past auctions automatically.",
          itemLabel: (props) =>
            `${props.fields.title.value || "New sale"}${props.fields.date.value ? ` · ${props.fields.date.value}` : ""}`,
        },
      ),
    }),

    /* ============================================ PAST CATALOGUE COVERS */
    covers: singlePage("Catalogue covers", "catalogue-covers", {
      show: fields.checkbox({
        label: "Show the catalogue covers",
        description: "Shown once at least one cover has been added. Untick to hide it everywhere.",
        defaultValue: true,
      }),
      showOnHome: fields.checkbox({ label: "Show on the homepage", defaultValue: true }),
      showOnAuctionsPage: fields.checkbox({ label: "Also show on the Auctions page", defaultValue: false }),
      eyebrow: line("Small heading", "e.g. From our archive"),
      title: line("Heading", "e.g. Past catalogues"),
      intro: paragraph("Text under the heading"),
      items: fields.array(
        fields.object({
          cover: objectPhoto(
            "covers",
            "Cover",
            "The front cover, straight on (e.g. exported from the catalogue file). Shown whole, never cropped.",
          ),
          title: requiredLine("Name of the sale", "e.g. The Summer Auction"),
          date: line("Date", "As you’d like it shown, e.g. July 2026"),
          link: fields.url({
            label: "Link (optional)",
            description: "For example the catalogue on your Easy Live auction site.",
          }),
        }),
        {
          label: "Covers",
          description: "Newest first is usual. Drag to reorder; use the ⋯ menu to remove one.",
          itemLabel: (props) => `${props.fields.title.value || "New cover"}${props.fields.date.value ? ` · ${props.fields.date.value}` : ""}`,
        },
      ),
    }),

    /* ===================================================== SALE HIGHLIGHTS */
    highlights: singlePage("Sale highlights", "sale-highlights", {
      show: fields.checkbox({
        label: "Show the highlights",
        description: "Shown once at least one lot has been added. Untick to hide it everywhere.",
        defaultValue: true,
      }),
      showOnHome: fields.checkbox({ label: "Show on the homepage", defaultValue: true }),
      showOnAuctionsPage: fields.checkbox({ label: "Also show on the Auctions page", defaultValue: true }),
      eyebrow: line("Small heading", "e.g. Sale highlights"),
      title: line("Heading", "e.g. Recent results"),
      intro: paragraph("Text under the heading"),
      priceLabel: line("Wording before each price", "e.g. Sold for"),
      items: fields.array(
        fields.object({
          photo: objectPhoto("highlights", "Photograph", "Ideally an upright photo of the lot."),
          maker: line("Artist or maker", "e.g. John Wootton (1682–1764)"),
          title: requiredLine("Title of the lot"),
          price: line(
            "Price realised",
            "As you’d like it shown, e.g. £42,000. Use the same basis as your published results (e.g. including buyer’s premium).",
          ),
          sale: line("Sale", "e.g. The Autumn Auction, November 2026"),
          link: fields.url({
            label: "Link (optional)",
            description: "For example the lot’s page on your Easy Live auction site.",
          }),
        }),
        {
          label: "Lots",
          description: "Your best results, in the order you’d like them shown. Drag to reorder.",
          itemLabel: (props) =>
            `${props.fields.title.value || "New lot"}${props.fields.price.value ? ` · ${props.fields.price.value}` : ""}`,
        },
      ),
    }),

    /* ============================================================ POLICIES */
    terms: policyPage("Terms and Conditions", "terms-and-conditions"),
    privacy: policyPage("Privacy policy", "privacy-policy"),
    shipping: policyPage("Shipping policy", "shipping-policy"),

    /* ===================================================== INSTAGRAM STRIP */
    instagram: singlePage("Instagram strip", "instagram", {
      show: fields.checkbox({
        label: "Show the Instagram strip on the homepage",
        description: "Shown once at least one photo has been added. Untick to hide it (nothing is deleted).",
        defaultValue: true,
      }),
      title: line("Heading", "e.g. Follow us on Instagram"),
      linkLabel: line(
        "Link to your Instagram page",
        "e.g. @sloanestreetauctions. Goes to the Instagram address in “Address, phone, email & hours”.",
      ),
      posts: fields.array(
        fields.object({
          photo: photo("instagram", "Photograph", "Shown as a square. Save the picture from your post and upload it here."),
          link: fields.url({
            label: "Link to the Instagram post",
            description: "Open the post on Instagram, copy its address from the browser (or Share → Copy link) and paste it here.",
          }),
        }),
        {
          label: "Posts",
          description: "Six works best (one row on a computer, two rows of three on a phone). Drag to reorder.",
          itemLabel: (props) => props.fields.photo.fields.alt.value || "Instagram post",
        },
      ),
    }),

    /* ======================================================== MAILING LIST */
    mailingList: singlePage("Mailing list pop-up", "mailing-list", {
      show: fields.checkbox({
        label: "Show the mailing-list panel",
        description:
          "A small panel inviting visitors to join your Mailchimp mailing list. It appears once, after a short time on the site; closing it keeps it away for 90 days. On the live site it only appears once Mailchimp is connected.",
        defaultValue: true,
      }),
      title: requiredLine("Heading", "e.g. Join our mailing list"),
      text: paragraph("Text", "e.g. Be the first to hear about upcoming sales, catalogues and viewing days."),
      buttonLabel: requiredLine("Button", "e.g. Sign up"),
      consent: richParagraph("Small print under the form"),
      successText: requiredLine("Thank-you message", "Shown after signing up. Mailchimp then emails them to confirm."),
      delaySeconds: fields.integer({
        label: "Seconds before it appears",
        description: "It also appears if the visitor scrolls halfway down a page first.",
        defaultValue: 20,
        validation: { min: 3, max: 300 },
      }),
    }),

    /* ============================================================ SETTINGS */
    settings: singleton({
      label: "Address, phone, email & hours",
      path: "src/content/pages/settings",
      format: { data: "json" },
      schema: {
        addressLines: fields.array(requiredLine("Line"), {
          label: "Showroom address",
          description: "One line per entry, e.g. “158–164 Fulham Road”, “Chelsea”, “London SW10 9PR”.",
          itemLabel: (props) => props.value || "Address line",
        }),
        mainPhone: requiredLine("Main telephone"),
        otherPhone: line("Second telephone", "Shown on the Contact page."),
        generalEmail: requiredLine("Main email address"),
        instagram: fields.url({
          label: "Instagram page",
          description:
            "The full address, e.g. https://www.instagram.com/yourname. Shown as an Instagram link in the footer and on the Contact page. Leave empty to hide.",
        }),
        accountsEmail: requiredLine("Accounts email address", "Used for invoice and payment enquiries."),
        valuationInbox: requiredLine(
          "Valuation requests are sent to",
          "The inbox that receives requests from the valuation form, with photos attached.",
        ),
        openingHours: fields.array(
          fields.object({ days: requiredLine("Days", "e.g. Monday – Friday"), times: requiredLine("Hours", "e.g. 9:30 – 18:00") }),
          { label: "Opening hours", itemLabel: (props) => `${props.fields.days.value}: ${props.fields.times.value}` },
        ),
        mapsQuery: requiredLine(
          "Address for Google Maps",
          "What Google Maps searches for, for the map and the “Open in Google Maps” link.",
        ),
        links: fields.object(
          {
            conditionsOfSale: fields.url({ label: "Conditions of Sale page", validation: { isRequired: true } }),
            privacy: fields.url({ label: "Privacy policy page", validation: { isRequired: true } }),
            shipping: fields.url({ label: "Shipping policy page", validation: { isRequired: true } }),
          },
          { label: "Policy pages", description: "Web addresses of the legal pages linked from across the site." },
        ),
        siteDescription: paragraph("Description of the house for Google", "Used where a page has no summary of its own."),
      },
    }),

    /* ========================================================== NAVIGATION */
    navigation: singleton({
      label: "Menus, footer & pages on/off",
      path: "src/content/pages/navigation",
      format: { data: "json" },
      schema: {
        pages: fields.object(
          {
            sell: pageSwitch("Sell With Us"),
            privateSales: pageSwitch("Private Sales"),
            howToBuy: pageSwitch("How to Buy"),
            about: pageSwitch("About"),
            team: pageSwitch("Meet the Team"),
            stories: pageSwitch("Stories & Insights"),
          },
          {
            label: "Pages switched on",
            description:
              "Untick a page to take it off the site: it disappears from the menus and footer, links to it become plain text, and its address shows “page not found”. Nothing is deleted. The homepage, Auctions, Contact and the valuation form are always on.",
          },
        ),
        header: fields.object(
          {
            auctions: menuItem("Auctions"),
            howToBuy: menuItem("How to Buy"),
            sell: menuItem("Sell With Us"),
            stories: menuItem("Stories (phone menu and footer)"),
            privateSales: menuItem("Private Sales"),
            about: menuItem("About"),
            contact: menuItem("Contact"),
            valuationButton: requiredLine("“Request a valuation” button"),
            signInLabel: line(
              "Sign-in link",
              "e.g. Sign in / Register. Shown at the top right once the Easy Live sign-in page is set in the Auction calendar.",
            ),
          },
          { label: "Main menu wording", description: "The pages themselves stay the same; only the wording changes." },
        ),
        footerColumns: fields.array(
          fields.object({
            heading: requiredLine("Column heading"),
            links: fields.array(
              fields.object({
                label: requiredLine("Wording"),
                href: requiredLine("Goes to", "A page on this site, e.g. /sell or /auctions/past, or a full web address."),
              }),
              { label: "Links", itemLabel: (props) => props.fields.label.value || "Link" },
            ),
          }),
          { label: "Footer columns", itemLabel: (props) => props.fields.heading.value || "Column" },
        ),
        footerButton: line("Footer button"),
        footerNote: line("Note at the bottom of the footer"),
      },
    }),

    /* ============================================================ HOMEPAGE */
    home: singlePage("Homepage", "home", {
      hero: fields.object(
        {
          style: fields.select({
            label: "What to show at the top of the page",
            description:
              "“Illustration” shows the illustration below whole, on white, with the headline and buttons underneath (also on phones). “Photograph” fills the top of the page with the background photograph, with the words over it.",
            options: [
              { label: "Illustration", value: "illustration" },
              { label: "Photograph", value: "photo" },
            ],
            defaultValue: "photo",
          }),
          illustration: photo("home", "Illustration", "Shown whole, never cropped. Best on a plain white background."),
          showWords: fields.checkbox({
            label: "Show the headline and text (headline on/off)",
            description:
              "Untick to show just the two buttons. The headline is still read by Google and screen readers.",
            defaultValue: true,
          }),
          title: requiredLine("Headline"),
          text: paragraph("Text under the headline"),
          buttonLabel: button("Button", "Auctions"),
          linkLabel: button("“Sell with us” button", "Sell With Us"),
          valuationLabel: button("“Request a valuation” button", "the valuation form"),
          photo: photo("home", "Background photograph", "A wide, atmospheric room photograph. Not a catalogue photo."),
          photoPosition: fields.select({
            label: "Which part of the photograph to keep",
            description:
              "On wide screens the photograph is trimmed to fit. Choose which part stays in view: “Bottom” trims the top, “Top” trims the bottom.",
            options: [
              { label: "Top", value: "top" },
              { label: "Upper middle", value: "upper" },
              { label: "Middle", value: "center" },
              { label: "Lower middle", value: "lower" },
              { label: "Bottom", value: "bottom" },
            ],
            defaultValue: "center",
          }),
        },
        { label: "1. Opening (top of the page)", description: "The illustration or photograph, and the buttons under it." },
      ),
      upcoming: section(
        "2. Upcoming auctions",
        {
          title: line("Heading"),
          viewAllLabel: button("Link to all auctions", "Auctions"),
          noUpcoming: paragraph("Shown when no sales are coming up"),
        },
        "The sales themselves are added in the Auction calendar. Featured lots, catalogue covers and sale highlights appear after this; they are edited under “Sales and results”.",
      ),
      approach: section("3. Navy band", {
        eyebrow: line("Small heading"),
        title: paragraph("Headline", "Start a new line where you want the headline to break on larger screens."),
        text: paragraph("Text"),
        linkLabel: button("Link", "Sell With Us"),
      }),
      valuesShow: showSwitch("4. Points at the bottom: show them"),
      values: fields.array(
        fields.object({
          icon: fields.select({
            label: "Icon",
            options: [
              { label: "Magnifying glass", value: "valuation" },
              { label: "Document", value: "terms" },
              { label: "Globe", value: "reach" },
              { label: "No icon", value: "none" },
            ],
            defaultValue: "valuation",
          }),
          title: requiredLine("Heading"),
          body: paragraph("Text"),
        }),
        {
          label: "4. Points at the bottom",
          description: "Up to three short points with icons, near the bottom of the homepage.",
          itemLabel: (props) => props.fields.title.value || "Point",
        },
      ),
    }),

    /* ============================================================ AUCTIONS */
    auctions: singlePage("Auctions", "auctions", {
      seo: seo({ title: "Auctions" }),
      eyebrow: line("1. Small heading above the headline"),
      title: requiredLine("1. Headline"),
      intro: paragraph("1. Text under the headline"),
      catalogueLinkLabel: button("Link to all catalogues", "your Easy Live auction site (once its address is in the Auction calendar)"),
      noUpcoming: paragraph("2. Shown when no sales are coming up", "The sales themselves are added in the Auction calendar."),
      past: section("3. Past auctions (its own tab: /auctions/past)", {
        title: line("Heading"),
        text: paragraph("Text"),
      }),
      selling: section("4. Selling panel at the bottom", {
        photo: objectPhoto("auctions", "Photograph"),
        title: line("Heading"),
        text: paragraph("Text"),
        buttonLabel: button("Button", "the valuation form"),
      }),
    }),

    /* ================================================================ SELL */
    sell: singlePage("Sell With Us", "sell", {
      seo: seo({ title: "Sell With Us" }),
      hero: fields.object(
        {
          eyebrow: line("Small heading"),
          title: requiredLine("Headline"),
          text: paragraph("Text"),
          primaryButton: button("Main button", "the valuation form"),
          secondaryButton: button("Second button", "“Visit us”"),
          photo: photo("sell", "Photograph"),
        },
        { label: "1. Opening (top of the page)" },
      ),
      process: section("2. How selling works", { title: line("Heading"), steps: steps("Steps", "Step") }),
      showroom: section("3. Visit us (navy section)", {
        eyebrow: line("Small heading"),
        title: line("Headline"),
        text: richParagraph("Text"),
        buttonLabel: button("Button", "an email to book an appointment"),
        appointmentSubject: line("Subject of the appointment email"),
        photo: photo("sell", "Photograph"),
      }),
      fees: section(
        "4. Fees box (your commission and terms)",
        {
          title: line("Heading", "e.g. Fees and terms"),
          text: richParagraph("Text"),
          linkLabel: button("Link", "the Conditions of Sale"),
          photo: objectPhoto("sell", "Photograph"),
        },
        "A box near the bottom of Sell With Us explaining your seller’s commission and fees, with a link to your Conditions of Sale. The “Fees and terms” link in the footer only appears while this box is shown.",
      ),
    }),

    /* ========================================================== HOW TO BUY */
    howToBuy: singlePage("How to Buy", "how-to-buy", {
      seo: seo({ title: "How to Buy" }),
      hero: fields.object(
        {
          eyebrow: line("Small heading"),
          title: requiredLine("Headline"),
          text: paragraph("Text"),
          primaryButton: button("Main button", "Auctions"),
          secondaryButton: button("Second button", "“Register to bid”"),
          photo: photo("how-to-buy", "Photograph"),
        },
        { label: "1. Opening (top of the page)" },
      ),
      register: section("2. Register to bid", {
        title: line("Heading"),
        text: paragraph("Text"),
        buttonLabel: button("Button", "your Easy Live sign-in page (set in the Auction calendar)"),
        steps: steps("Steps", "Step"),
      }),
      ways: section("3. Ways to bid", {
        title: line("Heading"),
        items: fields.array(
          fields.object({ title: requiredLine("Heading"), body: paragraph("Text"), photo: photo("how-to-buy", "Photograph") }),
          { label: "Ways to bid", itemLabel: (props) => props.fields.title.value || "Way to bid" },
        ),
        note: richParagraph("Note underneath"),
      }),
      payment: section("4. After the sale (paying)", {
        title: line("Heading"),
        text: richParagraph("Text"),
        linkLabel: button("Link", "the Conditions of Sale"),
      }),
      collection: section("5. Collection and shipping", {
        title: line("Heading"),
        text: richParagraph("Text"),
        linkLabel: button("Link", "the shipping policy"),
      }),
    }),

    /* ======================================================= PRIVATE SALES */
    privateSales: singlePage("Private Sales", "private-sales", {
      seo: seo({ title: "Private Sales" }),
      hero: fields.object(
        {
          eyebrow: line("Small heading"),
          title: requiredLine("Headline"),
          text: richParagraph("Text"),
          illustration: objectPhoto(
            "private-sales",
            "Illustration of the shop",
            "Shown whole beside the opening text, in the same style as the homepage illustration (its white background blends into the page). If you add one, it is shown instead of the photograph below.",
          ),
          photo: photo("private-sales", "Photograph"),
        },
        { label: "1. Opening (top of the page)" },
      ),
      contact: section("2. Contact box (under the opening text)", {
        title: line("Heading", "e.g. Speak to Private Sales"),
        text: paragraph("Text"),
        address: paragraph("Address", "Shown on this page only, with a Google Maps link. One line per row, e.g. 69 Lower Sloane Street, then London and the postcode."),
        phone: line("Telephone", "The Private Sales number."),
        email: line("Email address", "Leave empty to use the main email address."),
        buttonLabel: button("Button", "an email to Private Sales"),
      }),
      steps: section("3. How it works", { title: line("Heading"), steps: steps("Steps", "Step") }),
    }),

    about: singlePage("About", "about", {
      seo: seo({ title: "About Us" }),
      hero: fields.object(
        {
          title: requiredLine("Headline"),
          text: richParagraph("Text (leave an empty line between paragraphs)"),
          linkLabel: button("Link", "Meet the Team"),
          photo: photo("about", "Photograph"),
        },
        { label: "1. Opening (top of the page)" },
      ),
      interiorShow: showSwitch("2. Wide photograph: show it"),
      interiorPhoto: photo("about", "2. Wide photograph"),
      statementsShow: showSwitch("3. Navy band: show it"),
      statements: fields.array(fields.object({ title: requiredLine("Heading"), body: paragraph("Text") }), {
        label: "3. Navy band",
        description: "Up to three short statements on a navy band.",
        itemLabel: (props) => props.fields.title.value || "Statement",
      }),
      visit: section("4. Visit us", {
        title: line("Heading"),
        text: richParagraph("Text"),
        primaryButton: button("Main button", "Meet the Team"),
        secondaryButton: button("Second button", "Contact"),
        illustration: objectPhoto("about", "Illustration of the showroom"),
      }),
    }),

    /* ================================================================ TEAM */
    team: singlePage("Meet the Team", "team", {
      seo: seo({ title: "Meet the Team" }),
      title: requiredLine("1. Headline"),
      intro: paragraph("1. Text under the headline", "Leave an empty line between paragraphs."),
      featured: section("2. Featured person (large photograph at the top)", {
        name: line("Name"),
        role: line("Job title"),
        email: line("Email address", "Shown with an envelope, as a link."),
        photo: photo("team", "Photograph", "A wide (landscape) photograph, shown across the full width of the page."),
      }),
      members: fields.array(
        fields.object({
          name: line("Name"),
          role: line("Job title"),
          email: line("Email address"),
          photo: photo("team", "Portrait", "An upright (portrait-shaped) photograph."),
        }),
        {
          label: "3. Everyone else (four to a row)",
          description: "Use the ⋯ menu on a person to remove them, or drag to reorder.",
          itemLabel: (props) => props.fields.name.value || "Person (name to be added)",
        },
      ),
      primaryButton: button("4. Button at the bottom", "Contact"),
      secondaryButton: button("4. Link at the bottom", "the valuation form"),
    }),

    /* ============================================================= CONTACT */
    contact: singlePage("Contact", "contact", {
      seo: seo({ title: "Contact" }),
      hero: fields.object(
        {
          eyebrow: line("Small heading"),
          title: requiredLine("Headline"),
          text: paragraph("Text"),
          mapsLinkLabel: button("Google Maps link", "Google Maps"),
          hoursTitle: line("Opening hours heading"),
          gettingHereTitle: line("“Getting here” heading", "e.g. Getting here"),
          gettingHere: paragraph(
            "Getting here",
            "One line per way of getting here, e.g. Nearest Underground: South Kensington (District, Circle and Piccadilly lines), then the bus routes. Shown under the opening hours.",
          ),
          photo: photo("contact", "Photograph"),
        },
        { label: "1. Opening (top of the page)", description: "The address, phone numbers and opening hours themselves are edited in “Address, phone, email & hours”." },
      ),
      map: section("2. Map", {
        placeName: line("Name on the map pin", "Start a new line where it should break."),
        areaLabel: line("Area name on the map"),
        buttonLabel: requiredLine("Button that loads the map"),
        directionsLabel: line("Directions button"),
        note: line("Small note", "Explains that the map comes from Google."),
      }),
      enquiries: section("3. “How can we help?” choices", {
        title: line("Heading"),
        text: paragraph("Text"),
        question: requiredLine("Question above the choices"),
        valuation: fields.object(
          { label: requiredLine("Choice"), description: paragraph("Explanation"), buttonLabel: requiredLine("Button") },
          { label: "Selling or a valuation (goes to the valuation form)" },
        ),
        buying: fields.object(
          { label: requiredLine("Choice"), description: paragraph("Explanation"), buttonLabel: requiredLine("Button"), subject: requiredLine("Email subject") },
          { label: "Buying and bidding (email)" },
        ),
        conditionReport: fields.object(
          {
            label: requiredLine("Choice"),
            description: paragraph("Explanation"),
            descriptionWithLot: paragraph(
              "Explanation when sent from a lot page",
              "{lot} is replaced by the lot number and sale, e.g. “Lot 12, The Autumn Auction”.",
            ),
            buttonLabel: requiredLine("Button"),
            subject: requiredLine("Email subject"),
          },
          { label: "A condition report (email)" },
        ),
        accounts: fields.object(
          { label: requiredLine("Choice"), description: paragraph("Explanation"), buttonLabel: requiredLine("Button"), subject: requiredLine("Email subject") },
          { label: "An invoice or payment (email to accounts)" },
        ),
        general: fields.object(
          { label: requiredLine("Choice"), description: paragraph("Explanation"), buttonLabel: requiredLine("Button"), subject: requiredLine("Email subject") },
          { label: "Something else (email)" },
        ),
      }),
    }),

    /* =========================================================== VALUATION */
    valuation: singlePage("Request a Valuation", "valuation", {
      seo: seo({ title: "Request a Free Valuation" }),
      eyebrow: line("1. Small heading above the headline"),
      title: requiredLine("1. Headline"),
      intro: paragraph("1. Text under the headline"),
      nextStepsShow: showSwitch("2. “What happens next” box: show it"),
      nextStepsTitle: line("“What happens next” heading"),
      nextSteps: fields.array(requiredLine("Step"), {
        label: "2. What happens next",
        description: "Short steps, shown in a box beside the form.",
        itemLabel: (props) => props.value || "Step",
      }),
      talkShow: showSwitch("3. “Prefer to talk?” box: show it"),
      talkTitle: line("“Prefer to talk?” heading"),
      talkText: richParagraph("“Prefer to talk?” text"),
      notesShow: showSwitch("4. “Good to know” box: show it"),
      notesTitle: line("“Good to know” heading"),
      notes: fields.array(requiredLine("Note"), {
        label: "4. Good to know",
        description: "Short notes, shown in a box beside the form.",
        itemLabel: (props) => props.value || "Note",
      }),
      notesFooter: richParagraph("Line under the notes"),
    }),

    /* ============================================================= STORIES */
    stories: singlePage("News / Stories", "stories", {
      seo: seo({ title: "Stories & Insights" }),
      eyebrow: line("Small heading"),
      title: requiredLine("Headline"),
      text: paragraph("Text"),
    }),

    /* ======================================================= PAGE NOT FOUND */
    notFound: singlePage("“Page not found” message", "not-found", {
      eyebrow: line("Small heading"),
      title: requiredLine("Headline"),
      text: paragraph("Text"),
    }),
  },
});
