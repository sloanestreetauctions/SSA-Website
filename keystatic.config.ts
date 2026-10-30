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

/** Required: page headlines and a few essentials only. */
const requiredLine = (label: string, description?: string) =>
  fields.text({ label, description, validation: { isRequired: true } });

/** Optional single line: hidden on the page when empty. */
const line = (label: string, description?: string) =>
  fields.text({ label, description: description ? `${description} ${EMPTY_HIDES}` : EMPTY_HIDES });

/** Optional paragraph: hidden on the page when empty. */
const paragraph = (label: string, description?: string) =>
  fields.text({ label, multiline: true, description: description ? `${description} ${EMPTY_HIDES}` : EMPTY_HIDES });

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
        description: "Untick to hide the whole section; nothing is deleted, so you can bring it back later.",
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
    { label: "Search engines and browser tab" },
  );

const steps = (label: string, itemLabel: string) =>
  fields.array(fields.object({ title: requiredLine("Heading"), body: paragraph("Text") }), {
    label,
    description: "Use the ⋯ menu on each item to remove it, or drag to reorder.",
    itemLabel: (props) => props.fields.title.value || itemLabel,
  });

function singlePage<S extends Record<string, ComponentSchema>>(label: string, page: string, schema: S) {
  return singleton({ label, path: `src/content/pages/${page}`, format: { data: "json" }, schema });
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
      Auctions: ["calendar", "highlights"],
      Pages: ["home", "auctions", "sell", "howToBuy", "about", "team", "contact", "valuation", "stories", "notFound"],
      Policies: ["terms", "privacy", "shipping"],
      "Across the site": ["settings", "navigation"],
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

    /* ===================================================== SALE HIGHLIGHTS */
    highlights: singlePage("Sale highlights", "sale-highlights", {
      show: fields.checkbox({
        label: "Show the highlights",
        description: "Shown once at least one lot has been added. Untick to hide it everywhere.",
        defaultValue: true,
      }),
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

    /* ============================================================ SETTINGS */
    settings: singleton({
      label: "Contact details & opening hours",
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
      label: "Pages & menus",
      path: "src/content/pages/navigation",
      format: { data: "json" },
      schema: {
        pages: fields.object(
          {
            sell: pageSwitch("Sell With Us"),
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
            stories: menuItem("Stories (phone menu only)"),
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
                href: requiredLine("Goes to", "A page on this site, e.g. /sell or /auctions#past, or a full web address."),
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
          showWords: fields.checkbox({
            label: "Show the headline and text on the photograph",
            description:
              "Untick to show the photograph on its own, with just the two buttons centred near the bottom. The headline is still read by Google and screen readers.",
            defaultValue: true,
          }),
          title: requiredLine("Headline"),
          text: paragraph("Text under the headline"),
          buttonLabel: button("Button", "Auctions"),
          linkLabel: button("Link under the button", "Sell With Us (shown as a second button when the headline is off)"),
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
        { label: "Opening (over the photograph)" },
      ),
      upcoming: section(
        "Upcoming auctions",
        {
          title: line("Heading"),
          viewAllLabel: button("Link to all auctions", "Auctions"),
          noUpcoming: paragraph("Shown when no sales are coming up"),
        },
        "The sales themselves are listed in the Auction calendar.",
      ),
      approach: section("Navy band", {
        eyebrow: line("Small heading"),
        title: paragraph("Headline", "Start a new line where you want the headline to break on larger screens."),
        text: paragraph("Text"),
        linkLabel: button("Link", "Sell With Us"),
      }),
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
          label: "Points at the bottom",
          description: "Remove them all to hide this row.",
          itemLabel: (props) => props.fields.title.value || "Point",
        },
      ),
    }),

    /* ============================================================ AUCTIONS */
    auctions: singlePage("Auctions page", "auctions", {
      seo: seo({ title: "Auctions" }),
      eyebrow: line("Small heading"),
      title: requiredLine("Headline"),
      intro: paragraph("Text under the headline"),
      catalogueLinkLabel: button("Link to all catalogues", "your Easy Live auction site (once its address is in the Auction calendar)"),
      noUpcoming: paragraph("Shown when no sales are coming up"),
      past: section("Past auctions", {
        title: line("Heading"),
        text: paragraph("Text"),
      }),
      selling: section("Selling panel at the bottom", {
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
          framed: fields.checkbox({
            label: "Show the photograph in a gilt frame",
            description: "A slim gold frame with an ivory mount, like a framed picture. Untick for the photograph on its own.",
          }),
        },
        { label: "Opening" },
      ),
      process: section("How selling works", { title: line("Heading"), steps: steps("Steps", "Step") }),
      showroom: section("Visit us (navy section)", {
        eyebrow: line("Small heading"),
        title: line("Headline"),
        text: richParagraph("Text"),
        buttonLabel: button("Button", "an email to book an appointment"),
        appointmentSubject: line("Subject of the appointment email"),
        photo: photo("sell", "Photograph"),
      }),
      fees: section("Fees and terms", {
        title: line("Heading"),
        text: richParagraph("Text"),
        linkLabel: button("Link", "the Conditions of Sale"),
        photo: objectPhoto("sell", "Photograph"),
      }),
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
          framed: fields.checkbox({
            label: "Show the photograph in a gilt frame",
            description: "A slim gold frame with an ivory mount, like a framed picture. Untick for the photograph on its own.",
          }),
        },
        { label: "Opening" },
      ),
      register: section("Register to bid", {
        title: line("Heading"),
        text: paragraph("Text"),
        buttonLabel: button("Button", "your Easy Live sign-in page (set in the Auction calendar)"),
        steps: steps("Steps", "Step"),
      }),
      ways: section("Ways to bid", {
        title: line("Heading"),
        items: fields.array(
          fields.object({ title: requiredLine("Heading"), body: paragraph("Text"), photo: photo("how-to-buy", "Photograph") }),
          { label: "Ways to bid", itemLabel: (props) => props.fields.title.value || "Way to bid" },
        ),
        note: richParagraph("Note underneath"),
      }),
      payment: section("After the sale", {
        title: line("Heading"),
        text: richParagraph("Text"),
        linkLabel: button("Link", "the Conditions of Sale"),
      }),
      collection: section("Collection and shipping", {
        title: line("Heading"),
        text: richParagraph("Text"),
        linkLabel: button("Link", "the shipping policy"),
      }),
    }),

    /* =============================================================== ABOUT */
    about: singlePage("About", "about", {
      seo: seo({ title: "About Us" }),
      hero: fields.object(
        {
          title: requiredLine("Headline"),
          text: richParagraph("Text (leave an empty line between paragraphs)"),
          linkLabel: button("Link", "Meet the Team"),
          photo: photo("about", "Photograph"),
        },
        { label: "Opening" },
      ),
      interiorPhoto: photo("about", "Wide photograph"),
      statements: fields.array(fields.object({ title: requiredLine("Heading"), body: paragraph("Text") }), {
        label: "Navy band",
        description: "Remove them all to hide the band.",
        itemLabel: (props) => props.fields.title.value || "Statement",
      }),
      visit: section("Visit us", {
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
      title: requiredLine("Headline"),
      intro: paragraph("Text under the headline", "Leave an empty line between paragraphs."),
      featured: section("Featured person (large photograph at the top)", {
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
          label: "Everyone else (four to a row)",
          description: "Use the ⋯ menu on a person to remove them, or drag to reorder.",
          itemLabel: (props) => props.fields.name.value || "Person (name to be added)",
        },
      ),
      primaryButton: button("Main button", "Contact"),
      secondaryButton: button("Second link", "the valuation form"),
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
          photo: photo("contact", "Photograph"),
        },
        { label: "Opening", description: "The address, phone numbers and hours come from “Contact details”." },
      ),
      map: section("Map", {
        placeName: line("Name on the map pin", "Start a new line where it should break."),
        areaLabel: line("Area name on the map"),
        buttonLabel: requiredLine("Button that loads the map"),
        directionsLabel: line("Directions button"),
        note: line("Small note", "Explains that the map comes from Google."),
      }),
      enquiries: section("How can we help?", {
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
      eyebrow: line("Small heading"),
      title: requiredLine("Headline"),
      intro: paragraph("Text under the headline"),
      nextStepsTitle: line("“What happens next” heading"),
      nextSteps: fields.array(requiredLine("Step"), {
        label: "What happens next",
        description: "Remove them all to hide this box.",
        itemLabel: (props) => props.value || "Step",
      }),
      talkTitle: line("“Prefer to talk?” heading"),
      talkText: richParagraph("“Prefer to talk?” text"),
      notesTitle: line("“Good to know” heading"),
      notes: fields.array(requiredLine("Note"), {
        label: "Good to know",
        description: "Remove them all to hide this box.",
        itemLabel: (props) => props.value || "Note",
      }),
      notesFooter: richParagraph("Line under the notes"),
    }),

    /* ============================================================= STORIES */
    stories: singlePage("Stories & Insights", "stories", {
      seo: seo({ title: "Stories & Insights" }),
      eyebrow: line("Small heading"),
      title: requiredLine("Headline"),
      text: paragraph("Text"),
    }),

    /* ======================================================= PAGE NOT FOUND */
    notFound: singlePage("Page not found", "not-found", {
      eyebrow: line("Small heading"),
      title: requiredLine("Headline"),
      text: paragraph("Text"),
    }),
  },
});
