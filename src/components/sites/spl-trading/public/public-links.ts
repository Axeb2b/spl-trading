export type PublicLink = {
  href: string;
  label: string;
};

export const NAV_LINKS: PublicLink[] = [
  { href: "/product", label: "Product" },
  { href: "/fees", label: "Fees" },
  { href: "/support", label: "Support" },
  { href: "/contact", label: "Contact" },
];

export const LEGAL_LINKS: PublicLink[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/risk", label: "Risk disclosure" },
];

export const AUTH_LINKS: { signIn: PublicLink; signUp: PublicLink } = {
  signIn: { href: "/auth/sign-in", label: "Sign in" },
  signUp: { href: "/auth/sign-up", label: "Create account" },
};

/** Footer columns — every public route is reachable from the footer. */
export const FOOTER_COLUMNS: { title: string; links: PublicLink[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "What's in the cabinet" },
      { href: "/fees", label: "Fees & limits" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/support", label: "Support" },
      { href: "/contact", label: "Contact" },
    ],
  },
  { title: "Legal", links: LEGAL_LINKS },
  { title: "Account", links: [AUTH_LINKS.signUp, AUTH_LINKS.signIn] },
];

export function isNavLinkActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
