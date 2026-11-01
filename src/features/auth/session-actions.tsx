import { createContext, useContext, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { endLocalSession } from "./session";

type EndReason = "logout" | "password";
const SessionActions = createContext<{
  reason: EndReason | null;
  end: (reason: EndReason) => Promise<void>;
} | null>(null);
export function SessionBoundary() {
  const [reason, setReason] = useState<EndReason | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname === "/login") setReason(null);
  }, [location.pathname]);
  async function end(next: EndReason) {
    // Navigation intent is UI state; the server session remains owned by Query.
    setReason(next);
    await endLocalSession();
    await navigate(next === "password" ? "/login?reason=password" : "/login", {
      replace: true,
    });
  }
  return (
    <SessionActions.Provider value={{ reason, end }}>
      <Outlet />
    </SessionActions.Provider>
  );
}
export function useSessionActions() {
  const actions = useContext(SessionActions);
  if (!actions) throw new Error("SessionBoundary is required");
  return actions;
}
