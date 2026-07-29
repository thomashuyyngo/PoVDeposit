import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return { status: "ok", service: "pov-deposit", network: "PUBLIC" };
  }

  @Get("api/stellar-config")
  stellarConfig() {
    const network = "PUBLIC";
    return {
      network,
      networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE
        || (network === "PUBLIC" ? "Public Global Stellar Network ; September 2015" : "Test SDF Network ; September 2015"),
      rpcUrl: process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
      horizonUrl: process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org",
      contractId: process.env.ESCROW_CONTRACT_ID || "",
    };
  }
}
