// Placeholder Blaze setup. Configure after services are up.
// Example for Kupmios provider using Ogmios + Kupo endpoints
// import { Blaze, Kupmios, ColdWallet, Core } from "@blaze-cardano/sdk";

export interface BlazeContext {
  ready: boolean;
}

export async function getBlaze(): Promise<BlazeContext> {
  // TODO: wire real provider & wallet
  return { ready: false };
}
