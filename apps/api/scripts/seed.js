import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const address = "GB7CDHVP6LBMP3L5BJFXSTOWB4NX7ONPFN4537AFCWCNL7YD2MHSBZJN";
const wallet = await prisma.walletIdentity.upsert({
  where: { address },
  update: { network: "PUBLIC" },
  create: { address, network: "PUBLIC" },
});
await prisma.hostApplication.upsert({
  where: { id: "00000000-0000-4000-8000-000000000801" },
  update: { status: "APPROVED", reviewedAt: new Date("2026-07-28T00:00:00Z") },
  create: {
    id: "00000000-0000-4000-8000-000000000801",
    walletId: wallet.id,
    statement: "Deterministic Testnet sample host",
    status: "APPROVED",
    reviewedAt: new Date("2026-07-28T00:00:00Z"),
  },
});
const property = await prisma.property.upsert({
  where: { slug: "modern-apartment" },
  update: { active: true },
  create: {
    hostId: wallet.id,
    slug: "modern-apartment",
    title: "Modern 2-bed apartment",
    description: "Testnet sample listing for the viewing-deposit flow.",
    district: "Horizon District",
    addressHash: createHash("sha256").update("testnet-sample-address").digest("hex"),
    active: true,
  },
});
for (const [id, startsAt, endsAt] of [
  ["00000000-0000-4000-8000-000000000811", "2030-05-22T08:00:00Z", "2030-05-22T08:30:00Z"],
  ["00000000-0000-4000-8000-000000000812", "2030-05-22T09:00:00Z", "2030-05-22T09:30:00Z"],
]) {
  await prisma.viewingSlot.upsert({
    where: { id },
    update: { startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
    create: { id, propertyId: property.id, startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
  });
}
await prisma.$disconnect();
console.log("D8 Testnet property seed complete");
