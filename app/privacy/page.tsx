import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — Hike RV Caravans",
  description:
    "How Hike RV Caravans collects, uses, stores and shares personal information.",
}

const LAST_UPDATED = "21 May 2026"
const BUSINESS_NAME = "Hike RV Caravans"
const CONTACT_EMAIL = "info@hikerv.com.au"
const WEBSITE = "https://www.hikervcaravans.com.au"
const ABN = "" // optional — fill in if you want

export default function PrivacyPolicyPage() {
  return (
    <main style={{
      maxWidth: 820,
      margin: "0 auto",
      padding: "48px 24px 96px",
      fontFamily: "var(--font-geist, system-ui, sans-serif)",
      color: "#0F172A",
      lineHeight: 1.7,
      fontSize: 15,
    }}>
      <Link
        href="/"
        style={{ fontSize: 13, color: "#5B5FED", textDecoration: "none", fontWeight: 600 }}
      >
        ← Back
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 24, marginBottom: 6, letterSpacing: "-0.5px" }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 36 }}>
        Last updated: {LAST_UPDATED}
      </p>

      <Section title="1. About this policy">
        <p>
          {BUSINESS_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your privacy and is committed to protecting your
          personal information. This Privacy Policy explains how we collect, use, store and disclose
          personal information in accordance with the Australian Privacy Principles set out in the
          <em> Privacy Act 1988 (Cth)</em>.
        </p>
      </Section>

      <Section title="2. Who we are">
        <p>
          {BUSINESS_NAME}{ABN && <> (ABN {ABN})</>} is a caravan sales and service business operating
          in Australia. Our public website is <a href={WEBSITE} target="_blank" rel="noreferrer" style={linkStyle}>{WEBSITE}</a>.
          You can contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>.
        </p>
      </Section>

      <Section title="3. What we collect">
        <p>We collect personal information that you provide to us, including:</p>
        <ul style={listStyle}>
          <li>Your name, phone number, email address and Australian state/region</li>
          <li>Caravan model and configuration you are interested in</li>
          <li>Any notes, questions or messages you send us</li>
          <li>Information you submit through Facebook, Instagram or Google lead forms</li>
        </ul>
        <p>We may also automatically collect technical information when you visit our website, including IP address, browser type, pages viewed and timestamps, for security and analytics purposes.</p>
      </Section>

      <Section title="4. How we collect it">
        <p>We collect personal information when you:</p>
        <ul style={listStyle}>
          <li>Submit an enquiry through our website, social media or lead-ad forms (including Meta/Facebook and Google Ads lead forms)</li>
          <li>Contact us by phone, email or in person</li>
          <li>Purchase a caravan or service from us</li>
          <li>Subscribe to updates or marketing communications</li>
        </ul>
      </Section>

      <Section title="5. Why we collect it">
        <p>We use your personal information to:</p>
        <ul style={listStyle}>
          <li>Respond to your enquiry and follow up on potential sales</li>
          <li>Provide caravans, accessories and after-sales service</li>
          <li>Manage warranty, finance and delivery arrangements</li>
          <li>Send you information about products, promotions and events (where you have opted in)</li>
          <li>Improve our website, marketing and customer experience</li>
          <li>Comply with legal and regulatory obligations</li>
        </ul>
      </Section>

      <Section title="6. Who we share it with">
        <p>We do not sell your personal information. We may share it with:</p>
        <ul style={listStyle}>
          <li><strong>Service providers</strong> who help us operate our business — including hosting (Vercel, AWS, Neon), customer-relationship management, email delivery and analytics</li>
          <li><strong>Advertising platforms</strong> (such as Meta and Google) where you have submitted a lead form on those platforms, solely to receive that lead into our systems</li>
          <li><strong>Finance, insurance and delivery partners</strong> involved in your purchase, where relevant</li>
          <li><strong>Government or regulatory authorities</strong> where required by law</li>
        </ul>
        <p>All third-party processors are required to protect your information consistent with this policy.</p>
      </Section>

      <Section title="7. How we store and protect it">
        <p>
          Your information is stored in secure database systems with access controls, encryption in
          transit (HTTPS) and role-based access for staff. We retain personal information only for as
          long as we have a legitimate business or legal reason to do so.
        </p>
      </Section>

      <Section title="8. Cookies and tracking">
        <p>
          Our website may use cookies and similar technologies for analytics, performance and
          marketing measurement (including Meta Pixel and Google Analytics). You can disable cookies
          via your browser settings; some features may not function as a result.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>Under the Australian Privacy Act, you have the right to:</p>
        <ul style={listStyle}>
          <li>Request access to the personal information we hold about you</li>
          <li>Ask us to correct information that is inaccurate or out of date</li>
          <li>Request that we delete your personal information (subject to any legal retention requirements)</li>
          <li>Opt out of marketing communications at any time</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>. We will respond within a reasonable timeframe.
        </p>
      </Section>

      <Section title="10. Children">
        <p>Our products and services are not directed at children under 16, and we do not knowingly collect personal information from children.</p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top
          of this page reflects the most recent revision. We encourage you to review it periodically.
        </p>
      </Section>

      <Section title="12. Complaints">
        <p>
          If you believe we have not handled your personal information appropriately, please contact
          us first at <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a> so we can
          investigate. If you are not satisfied with our response, you may lodge a complaint with the
          Office of the Australian Information Commissioner (<a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer" style={linkStyle}>oaic.gov.au</a>).
        </p>
      </Section>

      <hr style={{ border: "none", borderTop: "1px solid #E2E8F0", margin: "48px 0 24px" }} />
      <p style={{ fontSize: 12, color: "#94A3B8" }}>
        © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
      </p>
    </main>
  )
}

const linkStyle = { color: "#5B5FED", textDecoration: "underline" }
const listStyle = { paddingLeft: 22, marginBottom: 14 }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#0F172A" }}>{title}</h2>
      <div style={{ color: "#334155" }}>{children}</div>
    </section>
  )
}
