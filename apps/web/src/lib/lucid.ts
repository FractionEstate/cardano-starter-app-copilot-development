// Utilities to initialize Lucid Evolution in the browser.
// This module is only imported from client components.
import { Koios, Lucid } from "@lucid-evolution/lucid";

export type { LucidEvolution } from "@lucid-evolution/lucid";

const DEFAULTS = {
  Preprod: "https://preprod.koios.rest/api/v1",
  Preview: "https://preview.koios.rest/api/v1",
  Mainnet: "https://api.koios.rest/api/v1",
} as const;

type Network = keyof typeof DEFAULTS;

export async function initLucid(
  networkEnv?: string,
  providerUrl?: string
) : Promise<ReturnType<typeof Lucid>> {
  const network = (networkEnv as Network) || (process.env.NEXT_PUBLIC_NETWORK as Network) || "Preprod";
  const url = providerUrl || process.env.NEXT_PUBLIC_KOIOS_URL || DEFAULTS[network] || DEFAULTS.Preprod;

  // Create a Koios provider and initialize Lucid for selected network
  const provider = new Koios(url);
  const lucid = await Lucid(provider, network);
  return lucid;
}
