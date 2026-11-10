import { linkProvider, unlinkProvider } from "@/app/auth/actions";
import { LINKABLE_PROVIDERS, PROVIDER_LABELS } from "@/lib/verification";

// Where each provider's password is managed, for accounts without a password
// here.
const SECURITY_PAGES: Record<string, string> = {
  google: "https://myaccount.google.com/security",
  linkedin_oidc: "https://www.linkedin.com/mypreferences/d/sign-in-and-security",
  facebook: "https://accountscenter.facebook.com/password_and_security",
};

const button =
  "rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white";

// Sign-in methods on the account. Linking Google or LinkedIn earns the Linked
// badge; an account must keep at least one way to sign in.
export default function LinkedAccounts({
  providers,
  hasEmail,
  notice,
  error,
}: {
  providers: string[];
  hasEmail: boolean;
  notice?: string;
  error?: string;
}) {
  const canUnlink = providers.length + (hasEmail ? 1 : 0) > 1;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h2 className="text-lg font-semibold text-white">Linked accounts</h2>
      <p className="mt-1 text-sm text-white/50">
        Link Google or LinkedIn to show the Linked badge on your photo and to
        sign in with either one.
      </p>

      {notice && (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-white/10">
        {hasEmail && (
          <li className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-white">Email and password</span>
            <span className="text-xs text-white/40">Linked</span>
          </li>
        )}
        {LINKABLE_PROVIDERS.map((p) => {
          const linked = providers.includes(p);
          return (
            <li key={p} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-white">
                {PROVIDER_LABELS[p]}
                {linked && <span className="ml-2 text-xs text-emerald-300/80">Linked</span>}
              </span>
              {linked ? (
                canUnlink && (
                  <form action={unlinkProvider}>
                    <input type="hidden" name="provider" value={p} />
                    <button type="submit" className={button}>Unlink</button>
                  </form>
                )
              ) : (
                <form action={linkProvider}>
                  <input type="hidden" name="provider" value={p} />
                  <button type="submit" className={button}>Link {PROVIDER_LABELS[p]}</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {!hasEmail && providers.length > 0 && (
        <p className="mt-3 text-xs text-white/40">
          You don&apos;t have a password here. Your password is managed by{" "}
          {providers
            .filter((p) => SECURITY_PAGES[p])
            .map((p, i, list) => (
              <span key={p}>
                {i > 0 && (i === list.length - 1 ? " and " : ", ")}
                <a
                  href={SECURITY_PAGES[p]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-300 hover:text-violet-200"
                >
                  {PROVIDER_LABELS[p]}
                </a>
              </span>
            ))}
          .
        </p>
      )}
    </section>
  );
}
