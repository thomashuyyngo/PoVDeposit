import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { AuthController } from "./auth/auth.controller.js";
import { ALLOWED_ORIGINS, WalletAuthService } from "./auth/wallet-auth.service.js";
import { BookingController } from "./booking/booking.controller.js";
import { BookingWorkflowService } from "./booking/booking-workflow.service.js";
import { CHECKIN_SECRET, CheckInChallengeService } from "./checkin/check-in-challenge.service.js";
import { checkInSecret } from "./config/secrets.js";
import { PrismaService } from "./database/prisma.service.js";
import { ViewingSlotService } from "./property/viewing-slot.service.js";
import { PropertyController } from "./property/property.controller.js";
import { PropertyService } from "./property/property.service.js";
import { rpc } from "@stellar/stellar-sdk";
import { ContractTransactionVerifier, STELLAR_RPC } from "./stellar/contract-transaction-verifier.js";
import { readStellarSettings, type StellarSettings } from "./config/stellar.config.js";
import { STELLAR_SETTINGS } from "./config/stellar.tokens.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, AuthController, BookingController, PropertyController],
  providers: [
    BookingWorkflowService,
    CheckInChallengeService,
    ViewingSlotService,
    WalletAuthService,
    PrismaService,
    PropertyService,
    ContractTransactionVerifier,
    {
      provide: STELLAR_SETTINGS,
      useFactory: () => readStellarSettings(),
    },
    {
      provide: STELLAR_RPC,
      inject: [STELLAR_SETTINGS],
      useFactory: (settings: StellarSettings) => new rpc.Server(settings.rpcUrl),
    },
    {
      provide: ALLOWED_ORIGINS,
      useFactory: () => (process.env.PUBLIC_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim()),
    },
    {
      provide: CHECKIN_SECRET,
      useFactory: () => checkInSecret(process.env),
    },
  ],
})
export class AppModule {}
