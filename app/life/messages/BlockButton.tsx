import { blockUser, unblockUser } from "./actions";

// Block / Unblock control (server-action form, no client JS).
export default function BlockButton({
  personId,
  blocked,
}: {
  personId: string;
  blocked: boolean;
}) {
  return (
    <form action={blocked ? unblockUser : blockUser}>
      <input type="hidden" name="target" value={personId} />
      <button
        type="submit"
        className="text-xs text-white/40 transition hover:text-rose-300"
      >
        {blocked ? "Unblock" : "Block"}
      </button>
    </form>
  );
}
