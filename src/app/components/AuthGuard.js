"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/"];

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname === `${path}/`);

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (isPublicPath(pathname)) {
        if (isMounted) {
          setIsAuthorized(true);
          setIsChecking(false);
        }
        return;
      }

      const token = localStorage.getItem("token");
      const apiUrl = localStorage.getItem("apiUrl");

      if (!token || !apiUrl) {
        router.replace("/");
        if (isMounted) {
          setIsAuthorized(false);
          setIsChecking(false);
        }
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/AdminLogin/AdminLogin/verify`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        if (response.ok) {
          setIsAuthorized(true);
        } else {
          localStorage.removeItem("token");
          router.replace("/");
          setIsAuthorized(false);
        }
      } catch {
        if (!isMounted) return;
        router.replace("/");
        setIsAuthorized(false);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    setIsChecking(true);
    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
}
