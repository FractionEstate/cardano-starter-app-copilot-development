// Utilities to initialize Lucid Evolution in the browser.
// This module is only imported from client components.

// Note: Avoid top-level imports from Lucid to prevent bundling WASM eagerly.
// If you need the LucidEvolution type, import it at the usage site as a type-only import.

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
  const { Koios, Lucid } = await import("@lucid-evolution/lucid");
  const network = (networkEnv as Network) || (process.env.NEXT_PUBLIC_NETWORK as Network) || "Preprod";
  const url = providerUrl || process.env.NEXT_PUBLIC_KOIOS_URL || DEFAULTS[network] || DEFAULTS.Preprod;

  // Create a Koios provider and initialize Lucid for selected network
  const provider = new Koios(url);
  const lucid = await Lucid(provider, network);
  return lucid;
}
