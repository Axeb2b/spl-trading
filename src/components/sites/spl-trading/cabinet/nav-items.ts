import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Home,
  Landmark,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", mobileLabel: "Home", icon: Home },
  { href: "/onboarding", label: "Getting started", mobileLabel: "Setup", icon: ListChecks },
  { href: "/accounts", label: "Accounts", mobileLabel: "Accounts", icon: Landmark },
  { href: "/payins", label: "Deposits", mobileLabel: "Deposits", icon: ArrowDownToLine },
  { href: "/payouts", label: "Payouts", mobileLabel: "Payouts", icon: ArrowUpFromLine },
  { href: "/report", label: "Reports", mobileLabel: "Reports", icon: FileText },
];
