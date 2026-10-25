import {
  followUser,
  unfollowUser,
  requestConnection,
  removeConnection,
  respondConnection,
} from "./actions";
import { type ConnectionState, type Relationship } from "./relations";

// Follow / Friend / Family controls for another member. Pure server-action
// forms (no client JS), like the reaction bar.

const pill =
  "rounded-full border px-3 py-1 text-xs font-medium transition";
const primary = `${pill} border-violet-400/40 bg-violet-500/20 text-white hover:bg-violet-500/30`;
const neutral = `${pill} border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white`;
const subtle = "text-xs text-white/40 transition hover:text-rose-300";

function Hidden({ name, value }: { name: string; value: string }) {
  return <input type="hidden" name={name} value={value} />;
}

export function FollowButton({
  personId,
  rel,
}: {
  personId: string;
  rel: Relationship;
}) {
  if (rel.following) {
    return (
      <form action={unfollowUser}>
        <Hidden name="target" value={personId} />
        <button type="submit" className={neutral} title="Unfollow">
          Following ✓
        </button>
      </form>
    );
  }
  return (
    <form action={followUser}>
      <Hidden name="target" value={personId} />
      <button type="submit" className={primary}>
        {rel.followsMe ? "Follow back" : "+ Follow"}
      </button>
    </form>
  );
}

// Accept / decline buttons for a pending request addressed to the member.
export function RespondButtons({
  connectionId,
  label,
}: {
  connectionId: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <form action={respondConnection}>
        <Hidden name="connection_id" value={connectionId} />
        <Hidden name="accept" value="1" />
        <button type="submit" className={primary}>
          {label}
        </button>
      </form>
      <form action={respondConnection}>
        <Hidden name="connection_id" value={connectionId} />
        <Hidden name="accept" value="0" />
        <button type="submit" className={neutral}>
          Decline
        </button>
      </form>
    </div>
  );
}

function ConnectionButton({
  personId,
  kind,
  state,
}: {
  personId: string;
  kind: "friend" | "family";
  state: ConnectionState;
}) {
  const noun = kind === "friend" ? "friend" : "family";
  if (!state) {
    return (
      <form action={requestConnection}>
        <Hidden name="target" value={personId} />
        <Hidden name="kind" value={kind} />
        <button type="submit" className={neutral}>
          {kind === "friend" ? "Add friend" : "Add as family"}
        </button>
      </form>
    );
  }
  if (state.status === "pending" && !state.sentByMe) {
    return (
      <RespondButtons
        connectionId={state.id}
        label={kind === "friend" ? "Accept friend" : "Accept family"}
      />
    );
  }
  return (
    <form action={removeConnection} className="flex items-center gap-2">
      <Hidden name="target" value={personId} />
      <Hidden name="kind" value={kind} />
      <span className="text-xs text-white/60">
        {state.status === "accepted"
          ? kind === "friend"
            ? "Friends ✓"
            : "Family ✓"
          : `${kind === "friend" ? "Friend" : "Family"} request sent`}
      </span>
      <button type="submit" className={subtle}>
        {state.status === "accepted" ? `Remove ${noun}` : "Cancel"}
      </button>
    </form>
  );
}

export default function ConnectButtons({
  personId,
  rel,
}: {
  personId: string;
  rel: Relationship;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <FollowButton personId={personId} rel={rel} />
      <ConnectionButton personId={personId} kind="friend" state={rel.friend} />
      <ConnectionButton personId={personId} kind="family" state={rel.family} />
    </div>
  );
}
