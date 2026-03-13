"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/components/locale-provider";
import { useBranch } from "@/components/branch-provider";
import { getCurrentUserProfile, type Profile } from "@/services/profile";
import { Separator } from "@/components/ui/separator";
import { Palette, Languages, User, LayoutDashboard, Info, List } from "lucide-react";

const APP_VERSION = "0.1.0";

function roleDisplay(role: string | null): string {
  if (!role) return "—";
  if (role === "admin") return "Admin";
  if (role === "support") return "Support";
  if (role === "viewer") return "Viewer";
  return role;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { role, branchLabel, isAdmin } = useBranch();
  const [mounted, setMounted] = useState(false);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setAuthUser(user ?? null);
      const prof = await getCurrentUserProfile();
      if (cancelled) return;
      setProfile(prof);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-8 max-w-3xl">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Preferences</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Appearance</CardTitle>
                </div>
                <CardDescription>Choose light, dark, or system theme for the interface.</CardDescription>
              </CardHeader>
              <CardContent>
                <Label className="sr-only">Theme</Label>
                <Select
                  value={mounted ? (theme ?? "system") : "system"}
                  onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
                  disabled={!mounted}
                >
                  <SelectTrigger className="w-full max-w-[180px]">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">System follows your device preference.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Language</CardTitle>
                </div>
                <CardDescription>Display language for labels and messages. Arabic uses RTL layout.</CardDescription>
              </CardHeader>
              <CardContent>
                <Label className="sr-only">Language</Label>
                <Select value={locale} onValueChange={(v) => setLocale(v as "en" | "ar")}>
                  <SelectTrigger className="w-full max-w-[180px]">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية (RTL)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Account</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Profile & access</CardTitle>
              </div>
              <CardDescription>Your account details and current role. Contact an administrator to change role or branch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm font-medium">{authUser?.email ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Display name</Label>
                  <p className="text-sm font-medium">{profile?.full_name ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Role</Label>
                  <p className="text-sm font-medium">{roleDisplay(role)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Branch</Label>
                  <p className="text-sm font-medium">{branchLabel ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Dashboard & about</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Dashboard layout</CardTitle>
                </div>
                <CardDescription>Customize your dashboard: reorder cards and resize them with the Edit layout option.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Open Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
            {isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <List className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Dropdown lists</CardTitle>
                  </div>
                  <CardDescription>Edit device types, brands, and departments used on the Add asset form.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild>
                    <Link href="/settings/options">
                      <List className="mr-2 h-4 w-4" />
                      Manage lists
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>About</CardTitle>
                </div>
                <CardDescription>Application information and version.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm font-medium">IT Support Dashboard</p>
                <p className="text-xs text-muted-foreground">Version {APP_VERSION}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
