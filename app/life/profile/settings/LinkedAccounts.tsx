import { linkProvider, unlinkProvider } from "@/app/auth/actions";
import { LINKABLE_PROVIDERS, PROVIDER_LABELS } from "@/lib/verification";

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
    </section>
  );
}
