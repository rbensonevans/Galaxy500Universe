// Made during the XRP LEDGER HACKATHON

import type { Metadata } from "next";
import LegalPage from "@/app/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · Galaxy500Universe" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 29, 2026">
      <p>
        By using Galaxy500Universe you agree to these terms. The platform is an
        early project built during the XRP Ledger Hackathon and is provided
        &ldquo;as is&rdquo;, without warranties.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>One account per person. Creating multiple accounts to collect extra Galaxy Credits is not allowed.</li>
        <li>Keep your sign-in secure; you are responsible for activity on your account.</li>
      </ul>

      <h2>Galaxy Credits (GLXY)</h2>
      <ul>
        <li>GLXY is an in-app credit with no cash value today and cannot be withdrawn.</li>
        <li>Balances, grants, and features may change as the project evolves.</li>
        <li>Credits obtained through fraud, such as duplicate accounts, may be removed and the account suspended.</li>
      </ul>

      <h2>Your content</h2>
      <ul>
        <li>You own what you post and give us permission to store and show it to the audience you choose.</li>
        <li>Don&apos;t post anything illegal, harassing, or that infringes others&apos; rights.</li>
        <li>We may remove content or suspend accounts that break these terms.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions? Email{" "}
        <a href="mailto:support@galaxy500universe.com" className="underline hover:text-white">
          support@galaxy500universe.com
        </a>{" "}
        or message @iglobecreator in Galaxy500Universe.
      </p>
    </LegalPage>
  );
}
