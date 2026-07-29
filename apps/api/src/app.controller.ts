import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return { status: "ok", service: "pov-deposit", network: process.env.STELLAR_NETWORK || "TESTNET" };
  }
}
