export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "pi-objects-column" },
  { href: "/onboarding", label: "Onboarding", icon: "pi-list" },
  { href: "/accounts", label: "Accounts", icon: "pi-credit-card" },
  { href: "/payins", label: "Payins", icon: "pi-arrow-down" },
  { href: "/payouts", label: "Payouts", icon: "pi-arrow-up" },
  { href: "/report", label: "Report", icon: "pi-file-arrow-up" },
];

/**
 * The bell shows real ledger activity, not seeded copy. The previous build
 * shipped three hardcoded strings ("Verification pending…", "Your account UI
 * preview is ready.") that had nothing to do with the signed-in account.
 */
export const ADMIN_NAV_ITEM: NavItem = { href: "/admin", label: "Admin", icon: "pi-shield" };
