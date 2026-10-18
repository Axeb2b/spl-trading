# SPL Trading UI/UX refresh

## Scope

A full-site refresh across the public landing and information pages, account access, the signed-in cabinet, and its deposit/payout/report views. SPL Trading is a money-movement cabinet; it does not provide investment performance, market pricing, or a live trading terminal.

## Patterns applied

1. **Progressive disclosure and task-first navigation.** The landing page starts with the purpose and next actions, then expands into product details, flow steps, fees, and risk. The cabinet puts balance and recent activity first; supporting counts and status summaries sit below. Detail is available through the relevant record views. This follows NN/guidance to expose frequent, primary actions first and defer secondary detail until requested: <https://www.nngroup.com/articles/progressive-disclosure/>.
2. **Strong visual hierarchy for scanning.** Primary balance and page titles have the strongest contrast and scale; metadata, helper text, and secondary actions are quieter. Related figures and actions are grouped with consistent spacing rather than decoration competing with financial values. Reference: <https://www.nngroup.com/articles/visual-hierarchy-ux-definition/>.
3. **Records remain comparable and usable at mobile widths.** Deposit, payout, and ledger views have real search/status/date filtering. Wide screens use aligned tables; narrow screens switch to stacked labeled records so status and amount stay visible without sideways scrolling. Reference: <https://www.nngroup.com/articles/data-tables/>.
4. **Status is never communicated by color alone.** Status badges pair color with a visible text label and shape; amount direction is paired with an arrow and a signed value. The interface also supports visible keyboard focus and reduced motion. WCAG references: <https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html> and <https://www.w3.org/WAI/fundamentals/accessibility-principles/>.
5. **Financial trust comes from accurate context, not simulated activity.** The hero's product preview is explicitly labeled illustrative; the live cabinet contains no fabricated transactions, price chart, performance metric, or notification. Feature availability, fee defaults, network checks, and the no-return disclosure are stated where relevant.
6. **Traceable payment states and explicit next steps.** The [LiteBanking payout API page](https://litebanking.com/p/payout-api) informed the clear request → pending → outcome → receipt progression and up-front fee presentation; SPL Trading only shows its actual manually reviewed states and does not claim a live payout rail, webhook, or automatic settlement.
7. **Mobile deposit hand-off from the supplied screenshot.** The deposit dialog adopts its BSC network card, prominent scannable QR, copyable address, progressive “More details” disclosure, and high-contrast bottom action. The QR payload in the uploaded image was decoded and matches `0xf4e03ef2c21b87c32b21bfa120006f411adaf2b6`; the app generates a fresh QR from the configured address instead of embedding a screenshot.

## Route map

- `/` — public landing when signed out; account overview when signed in.
- `/product`, `/fees`, `/support`, `/contact`, `/privacy`, `/terms`, `/risk` — shared public navigation/footer and page-intro system.
- `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password` — shared access shell and accessible form controls. Password reset is explicitly described as unavailable rather than pretending to send email.
- `/` — public landing when signed out; after sign-in, the dashboard stays gated until at least $500 in deposits is verified and credited.
- `/onboarding`, `/accounts`, `/payins`, `/payouts`, `/report`, `/admin` — shared cabinet shell; payout requests require both the $500 credited-deposit threshold and the deployment payout switch. Deposit records remain visible for reconciliation.
- `/admin` — admin-only address/limits/feature preflight plus manual deposit-verification and payout-operation queues.

## Accuracy and money-movement gates

- The uploaded QR decodes to `0xf4e03ef2c21b87c32b21bfa120006f411adaf2b6`; this is the default public BSC receiving address, with an admin DB value or `SPL_BEP20_ADDRESS` override taking precedence. The runtime QR is generated from the active address.
- The enforced minimum deposit is **$500 per order**; the dashboard/payout gate also requires at least **$500 in credited deposits**. Pending orders never count toward unlock.
- The public default maximum deposit is **$100,000**, matching the backend default of 10,000,000 cents.
- Deposit creation requires live mode, an enabled operator flag, a valid address, and valid limits. The admin panel exposes all four checks; the live-mode environment switch remains off by default.
- Deposit credits are manual: an admin must independently inspect the BSC transaction, enter its hash and on-chain timestamp, and confirm the asset, destination, exact amount, confirmations, and expiry. The server refuses late transactions.
- Payout requests can be submitted after the $500 verification gate and when enabled, but settlement is manually sent from an operator-controlled wallet; the UI does not claim an automated payout provider or transfer call.
- Investment functions remain unavailable; no return, market price, or investment metric is fabricated. The earlier unsupported onboarding, 24/7-support, and saved-account promises remain removed or qualified.
