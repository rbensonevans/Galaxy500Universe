import type { Metadata } from "next";
import LegalPage from "@/app/components/LegalPage";

export const metadata: Metadata = { title: "Data Deletion · Galaxy500Universe" };

// Public data deletion instructions (required by Facebook Login for Live apps).
export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion" updated="October 29, 2026">
      <p>
        You can delete your Galaxy500Universe account and the data that comes
        with it at any time, including data received when you signed in with
        Facebook, Google, or LinkedIn.
      </p>

      <h2>Delete your account</h2>
      <ul>
        <li>Sign in to Galaxy500Universe.</li>
        <li>
          Open <strong>Messages</strong> and send a message to{" "}
          <strong>@iglobecreator</strong> asking to delete your account, or
          email{" "}
          <a href="mailto:support@galaxy500universe.com" className="underline hover:text-white">
            support@galaxy500universe.com
          </a>{" "}
          from the email address on your account.
        </li>
        <li>
          We confirm the request and delete your account within 30 days.
        </li>
      </ul>

      <h2>What is deleted</h2>
      <ul>
        <li>Your sign-in details and the name, email, and profile picture shared by Facebook, Google, or LinkedIn.</li>
        <li>Your profile, posts, images, comments, reactions, follows, and friend and family connections.</li>
        <li>Your direct messages and the images in them.</li>
        <li>Your Galaxy Credits wallet. Remaining GLXY returns to the galaxy reserve; GLXY has no cash value.</li>
      </ul>

      <h2>Remove Galaxy500Universe from Facebook</h2>
      <p>
        To stop Facebook sharing data with us, open Facebook{" "}
        <strong>Settings &amp; privacy → Settings → Apps and websites</strong>,
        find Galaxy500Universe, and click <strong>Remove</strong>. This does not
        delete your Galaxy500Universe account; request that as described above.
      </p>

      <h2>Can&apos;t sign in?</h2>
      <p>
        If you can no longer sign in, email{" "}
        <a href="mailto:support@galaxy500universe.com" className="underline hover:text-white">
          support@galaxy500universe.com
        </a>{" "}
        from the email address on the account you want deleted.
      </p>
    </LegalPage>
  );
}
