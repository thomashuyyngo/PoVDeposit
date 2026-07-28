import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { AuthController } from "./auth/auth.controller.js";
import { ALLOWED_ORIGINS, WalletAuthService } from "./auth/wallet-auth.service.js";
import { BookingController } from "./booking/booking.controller.js";
import { BookingWorkflowService } from "./booking/booking-workflow.service.js";
import { CHECKIN_SECRET, CheckInChallengeService } from "./checkin/check-in-challenge.service.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, AuthController, BookingController],
  providers: [
    BookingWorkflowService,
    CheckInChallengeService,
    WalletAuthService,
    {
      provide: ALLOWED_ORIGINS,
      useFactory: () => (process.env.PUBLIC_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim()),
    },
    {
      provide: CHECKIN_SECRET,
      useFactory: () => Buffer.from(
        process.env.CHECKIN_TOKEN_SECRET || process.env.SESSION_SECRET || "development-only-checkin-secret",
      ),
    },
  ],
})
export class AppModule {}
