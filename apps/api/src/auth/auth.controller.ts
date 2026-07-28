import { BadRequestException, Body, Controller, Headers, Post } from "@nestjs/common";
import { z } from "zod";
import { WalletAuthService } from "./wallet-auth.service.js";

const challengeInput = z.object({ address: z.string().length(56) }).strict();
const verifyInput = z.object({
  challengeId: z.uuid(),
  address: z.string().length(56),
  signature: z.string().min(80).max(256),
}).strict();

@Controller("api/auth")
export class AuthController {
  constructor(private readonly auth: WalletAuthService) {}

  @Post("challenge")
  async challenge(@Headers("origin") origin: string | undefined, @Body() body: unknown) {
    if (!origin) throw new BadRequestException("Origin header required");
    const input = challengeInput.safeParse(body);
    if (!input.success) throw new BadRequestException("Invalid challenge request");
    try {
      return await this.auth.issue(input.data.address, origin);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Challenge rejected");
    }
  }

  @Post("verify")
  async verify(@Headers("origin") origin: string | undefined, @Body() body: unknown) {
    if (!origin) throw new BadRequestException("Origin header required");
    const input = verifyInput.safeParse(body);
    if (!input.success) throw new BadRequestException("Invalid verification request");
    try {
      return await this.auth.verify({ ...input.data, origin });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Signature rejected");
    }
  }
}
