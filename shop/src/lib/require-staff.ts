import type { Session } from "next-auth";

export function requireStaff(session: Session | null) {
  const u = session?.user as { id?: string; userType?: string; role?: string } | undefined;
  const isStaff = !!u && (u.userType === "staff" || (!!u.role && u.userType !== "customer"));
  return isStaff ? u : null;
}
