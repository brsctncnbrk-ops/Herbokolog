import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "./auth";

// Sunucu tarafı admin oturum kontrolü (route handler & server component).
export function isAdminAuthed(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}
