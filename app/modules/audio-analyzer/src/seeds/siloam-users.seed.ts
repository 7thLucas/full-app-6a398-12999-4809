/*
 * Siloam demo users — seeds one user per role with a completed Siloam profile
 * so the role-scoped flows can be explored immediately. Idempotent: only
 * creates a user if the email does not already exist.
 *
 * Default password for all demo users: Siloam123!
 */
import bcrypt from "bcryptjs";
import { UserModel } from "~/modules/authentication/authentication.model";
import { UserRole } from "~/modules/authentication/authentication.types";

interface DemoUser {
  username: string;
  email: string;
  role: UserRole;
  siloam: {
    fullName: string;
    role: "staff" | "unit_lead" | "quality_exec";
    hospital: string;
    unit: string;
  };
}

const HOSPITAL = "Siloam Hospitals Lippo Village";
const UNIT = "Contact Center";

const DEMO_USERS: DemoUser[] = [
  {
    username: "agent.dewi",
    email: "dewi.staff@siloam.demo",
    role: UserRole.Authenticated,
    siloam: { fullName: "Dewi Anggraini", role: "staff", hospital: HOSPITAL, unit: UNIT },
  },
  {
    username: "lead.budi",
    email: "budi.lead@siloam.demo",
    role: UserRole.Authenticated,
    siloam: { fullName: "Budi Santoso", role: "unit_lead", hospital: HOSPITAL, unit: UNIT },
  },
  {
    username: "quality.sari",
    email: "sari.quality@siloam.demo",
    role: UserRole.Authenticated,
    siloam: { fullName: "Sari Wulandari", role: "quality_exec", hospital: HOSPITAL, unit: UNIT },
  },
];

export async function seedSiloamUsers(): Promise<void> {
  const password_hash = await bcrypt.hash("Siloam123!", 12);

  for (const u of DEMO_USERS) {
    const existing = await UserModel.findOne({ email: u.email });
    if (existing) {
      // Ensure profile stays in sync if it was wiped
      if (!existing.profile?.siloam?.completed) {
        existing.profile = { ...(existing.profile ?? {}), siloam: { ...u.siloam, completed: true } };
        existing.markModified("profile");
        await existing.save();
      }
      continue;
    }
    await UserModel.create({
      username: u.username,
      email: u.email,
      password_hash,
      role: u.role,
      is_active: true,
      email_verified: true,
      profile: { siloam: { ...u.siloam, completed: true } },
    });
  }
}
