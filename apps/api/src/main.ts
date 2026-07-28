import "reflect-metadata";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://soroban-testnet.stellar.org", "https://horizon-testnet.stellar.org"],
      },
    },
  }));
  const openApi = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle("Proof-of-Visit Deposit API")
    .setDescription("Stellar Testnet property-viewing escrow API")
    .setVersion("1.0")
    .build());
  SwaggerModule.setup("docs", app, openApi);
  app.enableShutdownHooks();
  app.useStaticAssets(join(process.cwd(), "../web"));
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}

void bootstrap();
