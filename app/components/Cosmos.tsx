// Decorative full-viewport space scene. Rendered behind page content via the
// `.cosmos` fixed positioning in globals.css. No props, no state, no JS work.
export default function Cosmos() {
  return (
    <div className="cosmos" aria-hidden="true">
      <div className="nebula nebula--violet" />
      <div className="nebula nebula--cyan" />
      <div className="nebula nebula--rose" />
      <div className="stars stars--far" />
      <div className="stars stars--mid" />
      <div className="stars stars--near" />
      <div className="shooting-star shooting-star--1" />
      <div className="shooting-star shooting-star--2" />
    </div>
  );
}
