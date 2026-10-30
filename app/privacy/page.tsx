// Made during the XRP LEDGER HACKATHON

import type { Metadata } from "next";
import LegalPage from "@/app/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · Galaxy500Universe" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 29, 2026">
      <p>
        Galaxy500Universe is a social universe built during the XRP Ledger
        Hackathon. This page explains what we collect and how we use it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your email address, and — if you
          sign in with Google, LinkedIn, or Facebook — the name, email, and
          profile picture that provider shares. We never receive your password
          for those services.
        </li>
        <li>
          <strong>Profile:</strong> anything you add, such as display name,
          @handle, bio, location, and website.
        </li>
        <li>
          <strong>Content:</strong> posts, images, comments, reactions,
          follows, friend and family connections, and direct messages.
        </li>
        <li>
          <strong>Galaxy Credits:</strong> your in-app GLXY balance, grants,
          transfers, bank accounts, and startup activity.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show your content to the people you choose.</li>
        <li>To pay monthly Galaxy Credit grants and keep the in-app ledger accurate.</li>
        <li>To keep the platform fair, including detecting duplicate or fraudulent accounts.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Who can see what</h2>
      <ul>
        <li>Posts are private unless you share them to the Universal Feed, or to accepted friends and family.</li>
        <li>Direct messages are visible only to you and the other member. They are private but not end-to-end encrypted.</li>
        <li>Your profile, follows, and accepted connections are visible to signed-in members.</li>
      </ul>

      <h2>Where it is stored</h2>
      <p>
        Data is stored with our infrastructure providers, Supabase (database,
        sign-in, and file storage) and Vercel (hosting).
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit your profile and hide yourself from People search in Settings.</li>
        <li>Delete your own posts, comments, and messages at any time.</li>
        <li>
          To delete your account and its data, email{" "}
          <a href="mailto:support@galaxy500universe.com" className="underline hover:text-white">
            support@galaxy500universe.com
          </a>{" "}
          or message
          @iglobecreator in Galaxy500Universe. See{" "}
          <a href="/data-deletion" className="underline hover:text-white">
            Data Deletion
          </a>{" "}
          for details.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>We may update this policy; the date above shows the latest version.</p>
    </LegalPage>
  );
}
