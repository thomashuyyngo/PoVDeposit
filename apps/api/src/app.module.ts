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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, AuthController, BookingController],
  providers: [
    BookingWorkflowService,
    CheckInChallengeService,
    ViewingSlotService,
    WalletAuthService,
    PrismaService,
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
