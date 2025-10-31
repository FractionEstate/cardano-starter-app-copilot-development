import { Blaze, ColdWallet, Core, Kupmios } from "@blaze-cardano/sdk";

function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env: ${name}`);
}

export async function buildUnsignedSendAda(
  fromAddress: string,
  toAddress: string,
  lovelace: bigint
): Promise<string> {
  const ogmiosUrl = env("OGMIOS_URL", "http://localhost:1337");
  const kupoUrl = env("KUPO_URL", "http://localhost:1442");

    // Loosely typed construction to maintain compatibility across SDK versions.
    const provider = new (Kupmios as unknown as any)({ ogmiosUrl, kupoUrl });
    const from = (Core as any).addressFromBech32(fromAddress);
    const to = (Core as any).addressFromBech32(toAddress);

    const wallet = new (ColdWallet as unknown as any)(from, 0, provider);
    const blaze = await (Blaze as any).from(provider, wallet);

    const tx = await blaze.newTransaction().payLovelace(to, lovelace).complete();

    // Return CBOR hex (unsigned)
    return tx.toCbor();
}
