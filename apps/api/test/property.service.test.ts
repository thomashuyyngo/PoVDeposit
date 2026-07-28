import { describe, expect, it } from "vitest";
import type { PrismaService } from "../src/database/prisma.service.js";
import { PropertyService } from "../src/property/property.service.js";

describe("PropertyService", () => {
  it("returns only public listing fields and available slots", async () => {
    let query: unknown;
    const prisma = {
      property: {
        findMany: async (input: unknown) => {
          query = input;
          return [{ id: "property", slug: "home", title: "Home", district: "District", images: [], slots: [] }];
        },
      },
    } as unknown as PrismaService;
    const result = await new PropertyService(prisma).list("District");
    expect(result).toHaveLength(1);
    expect(query).toMatchObject({
      where: { active: true, district: { equals: "District", mode: "insensitive" } },
    });
    expect(result[0]).not.toHaveProperty("addressHash");
    expect(result[0]).not.toHaveProperty("hostId");
  });
});
