import QRCode from "qrcode";
import { getBep20Address } from "./flags";

export type PaymentDestination = {
  address: string;
  network: "BEP20";
  asset: "USDT";
  qrDataUrl: string | null;
  configured: boolean;
};

export async function getPaymentDestination(): Promise<PaymentDestination> {
  const address = await getBep20Address();
  const configured = address.length > 0;
  let qrDataUrl: string | null = null;
  if (configured) {
    try {
      qrDataUrl = await QRCode.toDataURL(address, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 280,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    } catch {
      qrDataUrl = null;
    }
  }
  return { address, network: "BEP20", asset: "USDT", qrDataUrl, configured };
}
