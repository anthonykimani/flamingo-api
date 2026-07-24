import { User } from "../../models/user.entity";

/** Fields that must never leave the service in API responses. */
const SENSITIVE_FIELDS = ["password", "accessToken", "regKey"] as const;

export function sanitizeUser(user: User | null): Partial<User> | null {
  if (!user) return null;
  const copy: any = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete copy[field];
  }
  return copy;
}

export function sanitizeUsers(users: User[]): Partial<User>[] {
  return users.map((u) => sanitizeUser(u) as Partial<User>);
}
