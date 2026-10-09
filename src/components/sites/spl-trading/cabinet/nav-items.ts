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

export const NOTIFICATIONS = [
  { kind: "info", text: "Verification pending. Complete Telegram step." },
  { kind: "warn", text: "Deposit is required before any trading operations." },
  { kind: "success", text: "Your account UI preview is ready." },
] as const;
