// Reusable scaffold for Life sections that are navigable but not yet built out.
// Shows the section heading and a preview of planned features so the area feels
// intentional rather than empty.
export default function SectionShell({
  eyebrow,
  title,
  blurb,
  features,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  features: { title: string; description: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-white/60">{blurb}</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <h2 className="text-base font-semibold text-white">{f.title}</h2>
            <p className="mt-1 text-sm text-white/55">{f.description}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        Coming soon
      </p>
    </div>
  );
}
