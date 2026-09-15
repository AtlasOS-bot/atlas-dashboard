"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useModule } from "../lib/moduleContext";
import { useCurrentUser } from "../lib/currentUserContext";
import { supabase } from "../lib/supabase";
import { getEmailForPerson } from "../lib/currentUser";
import {
  fetchPresence,
  subscribeToPresenceChanges,
  isPresenceOnline,
} from "../lib/presence";

const INVENTORY_CATEGORIES = [
  "Pokémon",
  "Star Wars Unlimited",
  "Lorcana",
  "One Piece",
  "Magic",
  "Sports Cards",
  "Dolls",
  "Shoes",
  "Games",
];

export default function Sidebar() {
  const { module, setModule } = useModule();
  const { person } = useCurrentUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mLastSeenAt, setMLastSeenAt] = useState(null);
  const [mOnline, setMOnline] = useState(false);

  // Only N is ever authorized (by RLS) to read M's presence row, so this
  // effect is gated to person === "N" rather than relying on the UI check
  // alone. See supabase/migrations/20260913000000_add_presence.sql.
  useEffect(() => {
    if (person !== "N") return;

    const mEmail = getEmailForPerson("M");
    if (!mEmail) return;

    let cancelled = false;

    fetchPresence(supabase, mEmail).then((lastSeenAt) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[presence] N presence fetch result:", lastSeenAt);
      }
      if (!cancelled) setMLastSeenAt(lastSeenAt);
    });

    const unsubscribe = subscribeToPresenceChanges(
      supabase,
      mEmail,
      (lastSeenAt) => setMLastSeenAt(lastSeenAt)
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [person]);

  // Postgres Changes only fires on new writes, so a stalled heartbeat
  // (M disconnected) needs this separate timer to flip status back to
  // offline once the last known timestamp goes stale.
  useEffect(() => {
    if (person !== "N") return;

    function recompute() {
      const online = isPresenceOnline(mLastSeenAt);
      if (process.env.NODE_ENV !== "production") {
        const age = mLastSeenAt ? Date.now() - new Date(mLastSeenAt).getTime() : null;
        console.log("[presence] presence age:", age, "ms — online:", online);
      }
      setMOnline(online);
    }

    recompute();
    const interval = setInterval(recompute, 5000);

    return () => clearInterval(interval);
  }, [person, mLastSeenAt]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("nomo-sidebar-collapsed") === "true");
    } catch (err) {
      // localStorage unavailable — default to expanded.
    }
  }, []);

  // Close the mobile drawer automatically whenever the route or category
  // filter changes, so tapping a link doesn't leave the drawer open.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, searchParams]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nomo-sidebar-collapsed", String(next));
      } catch (err) {
        // Ignore — collapsing still works for this session.
      }
      return next;
    });
  }

  const isHomeRoute = pathname === "/";
  const isInventoryRoute = pathname === "/inventory";
  const isSettingsRoute = pathname === "/settings";
  const activeCategory = searchParams.get("category");

  const sidebarClassName = [
    "sidebar",
    collapsed ? "sidebar-collapsed" : "",
    mobileOpen ? "sidebar-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type="button"
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        title="Open menu"
        aria-label="Open menu"
      >
        ☰
      </button>

      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={sidebarClassName}>
        <div className="sidebar-top">
          <div className="sidebar-logo">A</div>
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            title="Close menu"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <Link
          href="/"
          className={isHomeRoute ? "sidebar-subitem side-active" : "sidebar-subitem"}
          title="Home"
        >
          🏠 {!collapsed && "Home"}
        </Link>

        <button
          className={module === "resale" ? "side-active" : ""}
          onClick={() => setModule("resale")}
          title="Resale"
        >
          💰 {!collapsed && "Resale"}
        </button>

        <button
          className={module === "tcg" ? "side-active" : ""}
          onClick={() => setModule("tcg")}
          title="TCG"
        >
          🃏 {!collapsed && "TCG"}
        </button>

        <button
          className="sidebar-section-toggle"
          onClick={() => setInventoryExpanded((prev) => !prev)}
          title="Inventory"
        >
          {!collapsed && (inventoryExpanded ? "▾" : "▸")} 📦 {!collapsed && "Inventory"}
        </button>

        {inventoryExpanded && !collapsed && (
          <div className="sidebar-subgroup">
            <Link
              href="/inventory"
              className={
                isInventoryRoute && !activeCategory
                  ? "sidebar-subitem side-active"
                  : "sidebar-subitem"
              }
            >
              Master Inventory
            </Link>

            {INVENTORY_CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/inventory?category=${encodeURIComponent(category)}`}
                className={
                  isInventoryRoute && activeCategory === category
                    ? "sidebar-subitem side-active"
                    : "sidebar-subitem"
                }
              >
                {category}
              </Link>
            ))}
          </div>
        )}

        <button disabled title="Watchlist">
          ⭐ {!collapsed && "Watchlist"}
        </button>
        <button disabled title="Alerts">
          🚨 {!collapsed && "Alerts"}
        </button>
        <button disabled title="Analytics">
          📊 {!collapsed && "Analytics"}
        </button>

        <Link
          href="/settings"
          className={isSettingsRoute ? "sidebar-subitem side-active" : "sidebar-subitem"}
          title="Settings"
        >
          ⚙️ {!collapsed && "Settings"}
        </Link>

        {person === "N" && (
          <div className="sidebar-presence">
            <span
              className={
                mOnline ? "sidebar-presence-dot online" : "sidebar-presence-dot offline"
              }
            />
            {!collapsed && (
              <span className="sidebar-presence-label">
                M {mOnline ? "Online" : "Offline"}
              </span>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
