import { Controller, Get, Inject } from "@nestjs/common";
import type { StellarSettings } from "./config/stellar.config.js";
import { STELLAR_SETTINGS } from "./config/stellar.tokens.js";

@Controller()
export class AppController {
  constructor(@Inject(STELLAR_SETTINGS) private readonly stellar: StellarSettings) {}

  @Get("health")
  health() {
    return { status: "ok", service: "pov-deposit", network: this.stellar.network };
  }

  @Get("api/stellar-config")
  stellarConfig() {
    const { network, networkPassphrase, rpcUrl, horizonUrl, contractId } = this.stellar;
    return { network, networkPassphrase, rpcUrl, horizonUrl, contractId };
  }
}
