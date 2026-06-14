import Feed from "./Feed";
import StarDate from "./StarDate";

export default function LifePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Life
      </p>
      <h1 className="mt-3 whitespace-nowrap text-sm font-bold text-white sm:text-lg">
        Welcome. Star date: <StarDate />
      </h1>
      <p className="mt-2 text-white/60">
        Share what&apos;s happening in your universe.
      </p>

      <Feed feed="life" />
    </div>
  );
}
