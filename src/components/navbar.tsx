"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { UploadDialog } from "./upload-dialog";
import { LoginDialog } from "./login-dialog";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const checkAuth = () => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/gallery", label: "Gallery" },
    { href: "/albums", label: "Albums" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Landscape Gallery
          </Link>

          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {authenticated ? (
              <>
                <Link
                  href="/admin"
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    pathname === "/admin"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Admin
                </Link>
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                  Upload
                </Button>
                <Button size="sm" variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setLoginOpen(true)}>
                Login
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={checkAuth}
      />
    </>
  );
}
