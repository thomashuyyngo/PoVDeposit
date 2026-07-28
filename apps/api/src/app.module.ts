import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { AuthController } from "./auth/auth.controller.js";
import { ALLOWED_ORIGINS, WalletAuthService } from "./auth/wallet-auth.service.js";
import { BookingController } from "./booking/booking.controller.js";
import { BookingWorkflowService } from "./booking/booking-workflow.service.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, AuthController, BookingController],
  providers: [
    BookingWorkflowService,
    WalletAuthService,
    {
      provide: ALLOWED_ORIGINS,
      useFactory: () => (process.env.PUBLIC_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim()),
    },
  ],
})
export class AppModule {}
