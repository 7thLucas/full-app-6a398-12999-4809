import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/modules/authentication";
import { useConfigurables } from "~/modules/configurables";
import { getSiloamProfile, SILOAM_ROLES, type SiloamRole } from "~/lib/siloam";
import { saveSiloamProfile } from "~/lib/evaluations.client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Button } from "~/components/ui/button";

export default function OnboardingRoute() {
  const { config } = useConfigurables();
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const hospitals = config.hospitals ?? [];
  const units = config.units ?? [];

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<SiloamRole>("staff");
  const [hospital, setHospital] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
      return;
    }
    const existing = getSiloamProfile(user?.profile);
    if (existing?.completed) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (existing) {
      setFullName(existing.fullName);
      setRole(existing.role);
      setHospital(existing.hospital);
      setUnit(existing.unit);
    } else if (user?.username) {
      setFullName(user.username);
    }
  }, [loading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!hospital && hospitals.length) setHospital(hospitals[0]);
    if (!unit && units.length) setUnit(units[0]);
  }, [hospitals, units]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveSiloamProfile({ fullName, role, hospital, unit });
      // Hard reload so AuthProvider re-fetches /api/auth/me with the new profile.
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message ?? "Failed to save profile");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Set up your workspace</CardTitle>
          <CardDescription>
            Tell us your role and where you work so we can scope your dashboards and
            evaluations correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dewi Anggraini"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Your role</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value as SiloamRole)}>
                {SILOAM_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                {SILOAM_ROLES.find((r) => r.value === role)?.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital</Label>
                <Select id="hospital" value={hospital} onChange={(e) => setHospital(e.target.value)}>
                  {hospitals.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Service unit</Label>
                <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving…" : "Continue to workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
