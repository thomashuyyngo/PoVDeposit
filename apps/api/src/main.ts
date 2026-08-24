import "reflect-metadata";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { inlineScriptHashes } from "./security/csp-hashes.js";

function htmlDocuments(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlDocuments(path);
    return entry.name.endsWith(".html") ? [readFileSync(path, "utf8")] : [];
  });
}

async function bootstrap() {
  const webRoot = join(process.cwd(), "../web/out");
  // The static bundle is built by a sibling workspace. When it is missing the API
  // still has to listen, otherwise the platform health check only ever sees a
  // container that exited before binding a port.
  const webBundlePresent = existsSync(webRoot);
  if (!webBundlePresent) {
    console.warn(`[api] static web bundle not found at ${webRoot}; serving the API only`);
  }
  const scriptHashes = webBundlePresent ? inlineScriptHashes(htmlDocuments(webRoot)) : [];
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...scriptHashes],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
          process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org",
        ],
      },
    },
  }));
  const openApi = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle("Proof-of-Visit Deposit API")
    .setDescription("Stellar Mainnet property-viewing escrow API")
    .setVersion("1.0")
    .build());
  SwaggerModule.setup("docs", app, openApi);
  app.enableShutdownHooks();
  if (webBundlePresent) app.useStaticAssets(webRoot);
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}

void bootstrap();
