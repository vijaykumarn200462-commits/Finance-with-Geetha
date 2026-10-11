import { BusinessStat, TeachingTopic, CommunityFeature, CallStep, Product, BookChapter, FAQItem } from './types';

export const BUSINESS_STATS: BusinessStat[] = [
  {
    value: "~60",
    label: "Recurring clients",
    detail: "Maintained consistently month after month without chaos.",
  },
  {
    value: "₹25L+",
    label: "Annual revenue",
    detail: "Gross annual revenue from standard monthly financial & bookkeeping retainers.",
  },
  {
    value: "30–35",
    label: "Hours a week",
    detail: "Total working hours, leaving real time for family and life.",
  },
  {
    value: "5",
    label: "Years, from scratch",
    detail: "Built from the ground up starting with zero clients.",
  },
];

export const TEACHING_TOPICS: TeachingTopic[] = [
  {
    number: "01",
    title: "Pricing your services",
    tagline: "Flat monthly rates that actually profit. Stop guessing at hourly.",
    description:
      "Hourly billing punishes you for getting faster and invites clients to micromanage your timer. We calculate monthly flat fees based on transaction volume, account complexity, and value.",
    takeaways: [
      "How to look at a bank feed and quote within 5 minutes",
      "Tiered monthly pricing templates (₹15,000, ₹35,000, ₹75,000+)",
      "How to price initial historical cleanups separately",
      "Scope creep clauses that protect your margins",
    ],
  },
  {
    number: "02",
    title: "Discovery calls",
    tagline: "Turn a first conversation into a paying client without feeling salesy.",
    description:
      "You don't need high-pressure sales tactics or slick scripts. You need an honest 20-minute diagnostic framework where you ask the right financial questions, identify pain, and propose a calm solution.",
    takeaways: [
      "The exact 6 questions to ask in the first 10 minutes",
      "How to review their current books before quoting",
      "Handling 'Can you do it for less?' with calm confidence",
      "Sending the proposal within 2 hours of hanging up",
    ],
  },
  {
    number: "03",
    title: "Onboarding clients",
    tagline: "Get a new client set up clean, fast, and stress-free from day one.",
    description:
      "The first 30 days set the tone for the next 3 years. If onboarding is chaotic, the client gets anxious. With our intake checklist and access guide, new clients are onboarded in under 48 hours.",
    takeaways: [
      "Accountant access setup for QuickBooks Online, Zoho Books & Tally",
      "View-only banking access request email templates",
      "Client questionnaire that collects GST / tax IDs and compliance logins",
      "Welcome email setting expectations for turnarounds and communication",
    ],
  },
  {
    number: "04",
    title: "The work in accounting software",
    tagline: "Month-end, cleanups, and the real monthly workflow — done right.",
    description:
      "Most courses teach accounting theory. We teach what you actually do on a Tuesday morning: bank feeds, reconciliations, clearing uncategorized entries, dealing with director draws, and closing the books.",
    takeaways: [
      "The 5-step monthly closing checklist used across 60 clients",
      "How to reconcile credit card and merchant clearing accounts",
      "Handling personal expenses mixed with business funds",
      "Producing clean monthly balance sheets and P&L statements that CPAs & CAs praise",
    ],
  },
  {
    number: "05",
    title: "Talking to clients",
    tagline: "Set boundaries, communicate well, and keep clients for years.",
    description:
      "Finance and bookkeeping should be calm. That means no weekend emergency texts, no clients demanding same-day replies for non-emergencies, and clear monthly summary emails that demonstrate your immense value.",
    takeaways: [
      "Strict email and communication boundary rules that clients respect",
      "The monthly 3-bullet executive summary update template",
      "How to politely nudge unresponsive clients for bills and statements",
      "How to fire bad-fit clients cleanly and professionally",
    ],
  },
  {
    number: "06",
    title: "Building your presence",
    tagline: "Look legit, get found, and let the right clients come to you.",
    description:
      "You don't need a complicated corporate portal. You need a fast, trustworthy, professional site that clearly states who you serve, how you work, and provides a simple way to get in touch.",
    takeaways: [
      "Simple structure that converts business owners",
      "What copy to write so you sound like an expert, not a hobbyist",
      "Clear call-to-actions that book discovery sessions",
      "Mobile-friendly presentation that looks polished on every screen",
    ],
  },
];

export const COMMUNITY_FEATURES: CommunityFeature[] = [
  {
    title: "Twice-weekly live calls",
    description: "Every Wednesday & Friday at noon. Small groups capped under 10 members so you get direct coaching time.",
    iconName: "Calendar",
  },
  {
    title: "Searchable call recordings",
    description: "Can't make a session? Every recording is indexed with topic markers so you can review past pricing audits and hot seats.",
    iconName: "Video",
  },
  {
    title: "Live member chat",
    description: "Direct community channel to ask quick questions between calls — get feedback on quotes before you send them to prospects.",
    iconName: "MessageSquare",
  },
  {
    title: "Member-only video library",
    description: "Step-by-step screen recordings inside software: complex cleanups, reconciliations, and year-end closeouts.",
    iconName: "PlayCircle",
  },
  {
    title: "Every template included (₹100+ value)",
    description: "All cheat sheets, client service agreements, onboarding forms, and monthly checklists are free for members.",
    iconName: "FileCheck",
  },
  {
    title: "Weekly accountability check-in",
    description: "State what you're working on each Monday and report back on Friday. Momentum compounds when you stay consistent.",
    iconName: "CheckCircle",
  },
  {
    title: "Direct access to Geetha",
    description: "No junior coaches or generic support. You are learning directly from Geetha, who runs a successful 60-client firm today.",
    iconName: "ShieldCheck",
  },
];

export const CALL_STEPS: CallStep[] = [
  {
    step: "STEP 01",
    title: "Wins around the room",
    description:
      "We start by going around. Each person shares what they got done last week — landed a first client, sent a proposal, or finished a tough cleanup. Momentum compounds when you say it out loud.",
    takeaway: "Celebrates real progress and normalizes the everyday wins of running a firm.",
  },
  {
    step: "STEP 02",
    title: "Open Q&A",
    description:
      "Bring anything — pricing, a tough client, a tech-stack question, an offer you're building. No question is too basic. We stay on your problem until you have total clarity.",
    takeaway: "Get immediate answers so you never stay stuck wondering what to do next.",
  },
  {
    step: "STEP 03",
    title: "Hot seat",
    description:
      "Stuck? We put your business on the screen and work it out live. We audit your pricing, review a difficult client email, or build your discovery call flow together. You leave with a concrete next move.",
    takeaway: "Leaves you with an actionable plan of action for the exact week ahead.",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "community",
    name: "The Community",
    subtitle: "Weekly live coaching, templates, and accountability",
    description:
      "The primary place to build your firm. Two weekly live calls (capped under 10), direct access to Geetha, member chat, and every template included.",
    price: 150,
    period: "month",
    features: [
      "Weekly live calls (Wednesdays & Fridays at noon)",
      "Calls capped under 10 people on purpose",
      "Every call recorded and searchable",
      "Live member chat for questions between calls",
      "Member-only video library (workflows & how-tos)",
      "All templates & cheat sheets included free",
      "Weekly accountability check-ins",
      "Direct access to Geetha",
      "Cancel anytime with one click — no contracts",
    ],
    ctaText: "Join the Community",
    isPopular: true,
  },
  {
    id: "book",
    name: "Start a Bookkeeping Business",
    subtitle: "How to build one that pays you well — and leaves you alone.",
    description:
      "The entire playbook in one book. How Geetha built a calm, profitable firm from scratch — pricing, first clients, the monthly work, and getting your time back.",
    price: 29,
    period: "one-time",
    format: "PDF + EPUB (Kindle, Apple Books, Kobo)",
    features: [
      "180 pages of practical, battle-tested operational guidance",
      "Real numbers, real mistakes, and exact pricing math",
      "The 15-minute discovery call blueprint",
      "How to price flat retainers without guessing",
      "Month-end closing routine & checklist",
      "Read in an afternoon, reference for years",
    ],
    ctaText: "Get the Book — ₹29",
  },
  {
    id: "cheatsheets",
    name: "The Bookkeeper's Cheat Sheets (5-Pack)",
    subtitle: "Five printable, plug-and-play references from a 60-client firm",
    description:
      "Keep these five reference guides on your desk when quoting clients, running calls, and executing monthly books.",
    price: 40,
    period: "one-time",
    valueComparison: "₹50 of value",
    freeWithCommunity: true,
    format: "Digital PDF bundle (Instant Download)",
    features: [
      "Discovery Call 6-Question Diagnostic Sheet",
      "New Client Onboarding 48-Hour Protocol",
      "Recommended Software & Tech Stack Matrix",
      "Core Sales & Compliance Reference",
      "Quoting & Scoping from Financial History",
      "Printable PDF format + editable DOCX",
    ],
    ctaText: "Buy the 5-Pack — ₹40",
  },
  {
    id: "workflow",
    name: "Monthly Bookkeeping Workflow",
    subtitle: "The step-by-step system for delivering consistent, high-quality books",
    description:
      "The exact operational checklist Geetha uses to service 60 recurring clients without dropping balls or missing month-end deadlines.",
    price: 25,
    period: "one-time",
    freeWithCommunity: true,
    format: "Interactive Notion Template + Google Sheet + PDF Checklist",
    features: [
      "Monthly 5-phase closing timeline (Days 1–15)",
      "Bank & credit card reconciliation balance cross-checks",
      "Pre-closing suspense/uncategorized audit protocol",
      "Monthly management report delivery email templates",
      "Ready to import into Notion, ClickUp, or Excel",
    ],
    ctaText: "Buy the Workflow — ₹25",
  },
  {
    id: "call",
    name: "1-on-1 Strategy Call",
    subtitle: "30-minute private consultation with Geetha",
    description:
      "The community works for most people. But if you want to talk through your specific situation, book a 30-minute strategy call with Geetha. Bring your biggest question, leave with a plan.",
    price: 150,
    period: "one-time",
    format: "30-minute private video call via Zoom or Google Meet",
    features: [
      "30 minutes dedicated exclusively to your business",
      "Deep dive into your pricing, proposal, or stuck client",
      "Screen share review of your bookkeeping setup or website",
      "Actionable plan and recording delivered after the call",
    ],
    ctaText: "Book a Call — ₹150",
  },
];

export const BOOK_CHAPTERS: BookChapter[] = [
  {
    number: 1,
    title: "The Zero-Client Phase",
    summary: "Setting up your practice, software stack, and getting past the paralysis of starting without a portfolio.",
  },
  {
    number: 2,
    title: "The Truth About Pricing",
    summary: "Why hourly rates trap you in low pay, how flat monthly retainers work, and calculating your baseline margin.",
  },
  {
    number: 3,
    title: "Landing Your First 3 Clients",
    summary: "Practical outreach through local networks and professional partnerships without cold-calling or spending money on ads.",
  },
  {
    number: 4,
    title: "The 15-Minute Discovery Call",
    summary: "How to diagnose financial pain, read their current bookkeeping status, and quote with total confidence.",
  },
  {
    number: 5,
    title: "Stress-Free Client Onboarding",
    summary: "The 48-hour intake protocol: access requests, engagement agreements, and establishing firm communication boundaries.",
  },
  {
    number: 6,
    title: "Workflows at Scale",
    summary: "How to run month-end closes across 50+ clients without working weekends or missing deadlines.",
  },
  {
    number: 7,
    title: "Protecting Your Life & Schedule",
    summary: "Structuring your week to 30 hours, managing asynchronous communication, and saying no to toxic scope creep.",
  },
  {
    number: 8,
    title: "The Calm Firm Philosophy",
    summary: "Why bigger isn't always better, and how staying lean yields higher net profits and true personal freedom.",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Do I need an advanced degree or CPA/CA certification to start?",
    answer:
      "No. You do not need a CPA or CA certification to run a successful monthly bookkeeping and financial management practice. You need a solid understanding of double-entry accounting fundamentals, software proficiency, and the operational skills to onboard and manage business clients reliably.",
    category: "general",
  },
  {
    question: "How does the Community call schedule work?",
    answer:
      "Calls are held twice every week: Wednesdays and Fridays at 12:00 PM. Each call is capped under 10 members so everyone gets speaking time and personal feedback. If you cannot attend live, all sessions are recorded and searchable in the member portal.",
    category: "community",
  },
  {
    question: "Can I cancel my community membership anytime?",
    answer:
      "Yes, absolutely. There are no contracts, minimum commitments, or cancellation hoops. You can cancel with a single click inside your billing portal at any time.",
    category: "community",
  },
  {
    question: "Are the templates really free inside the community?",
    answer:
      "Yes. Every single template in the store — including the 5-pack cheat sheets, the monthly workflow checklist, engagement contracts, and quoting calculators — is included free as a community member.",
    category: "community",
  },
  {
    question: "What format does the book come in?",
    answer:
      "You receive instant access to both PDF and EPUB files. It is formatted cleanly for Kindle, Apple Books, Kobo, and any standard tablet or desktop reader.",
    category: "book",
  },
  {
    question: "What if I just have one specific pricing question?",
    answer:
      "If you just need a one-time deep dive into an upcoming proposal, you can book a 30-minute 1-on-1 strategy call with Geetha for ₹150. However, most members find the community pays for itself immediately because you get multiple live calls every month.",
    category: "general",
  },
];

export const SAMPLE_CHAPTER_EXCERPT = `
### Chapter 1 Excerpt: The Myth of Hourly Billing

When I started my firm, the first mistake I almost made was listening to traditional advice: "Charge an hourly rate until you get experienced, then raise it slightly."

Here is why hourly billing is fundamentally broken for finance and bookkeeping professionals:

1. **It punishes efficiency:** If a client's monthly cleanup takes you 10 hours in month one, you make a fixed fee. In month six, when you've automated their bank feeds and understand their business, the work takes you 2 hours. Under hourly billing, your reward for becoming faster and more competent is making far less for the exact same value. That is absurd.

2. **It turns clients into micromanagers:** When a client sees a time log with 15 minutes for "emailing about missing vouchers," they scrutinize your time instead of valuing your results.

3. **It creates unpredictable income:** You cannot plan your budget when your monthly revenue swings wildly based on how many hours you happened to log this week.

### The Calm Alternative: Value-Tiered Flat Retainers

Instead of selling hours, we sell a completed outcome:
"Every month, your bank and credit accounts are reconciled to the rupee, your filings are on time, and you receive an executive summary of your profit and loss by the 10th of the month."

To the business owner, that peace of mind is worth a predictable flat retainer every month — regardless of whether it takes you 90 minutes or 3 hours to produce.

When you switch to flat monthly retainers, everything changes:
- Your monthly income becomes 100% predictable.
- Clients respect your professional boundaries.
- As you master your workflow and software shortcuts, your effective rate increases dramatically.
`;
