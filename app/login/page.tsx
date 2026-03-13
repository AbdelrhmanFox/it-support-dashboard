"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Languages } from "lucide-react";

const loginCopy = {
  en: {
    title: "IT Support Dashboard",
    subtitle: "Sign in to access the dashboard",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    or: "Or",
    magicLink: "Send magic link to email",
    magicLinkSent: "Check your email for the sign-in link.",
    publicForm: "Public support form:",
    submitTicket: "Submit a ticket",
    loading: "Loading...",
  },
  ar: {
    title: "لوحة دعم تقنية المعلومات",
    subtitle: "سجّل الدخول للوصول إلى اللوحة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
    or: "أو",
    magicLink: "إرسال رابط تسجيل بالبريد",
    magicLinkSent: "تحقق من بريدك للحصول على رابط الدخول.",
    publicForm: "نموذج الدعم العام:",
    submitTicket: "تقديم تذكرة",
    loading: "جاري التحميل...",
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const { locale } = useLocale();
  const t = loginCopy[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMagicLinkSent(true);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {magicLinkSent ? (
          <p className="text-center text-sm text-muted-foreground">
            {t.magicLinkSent}
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.signingIn : t.signIn}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
              </div>
            </div>
            <form onSubmit={handleMagicLink}>
              <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                {t.magicLink}
              </Button>
            </form>
          </>
        )}
        <p className="text-center text-xs text-muted-foreground">
          {t.publicForm}{" "}
          <a href="/support" className="underline">{t.submitTicket}</a>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const { setTheme } = useTheme();
  const { setLocale } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Top bar: Dark mode + Language */}
      <header className="flex justify-end gap-2 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Theme">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Language">
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocale("ar")}>العربية (RTL)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <Suspense fallback={<Card className="w-full max-w-sm"><CardContent className="p-6">{loginCopy.en.loading}</CardContent></Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
