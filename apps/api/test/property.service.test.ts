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

  it("gives the detail response the same host the list carries", async () => {
    let query: { select?: Record<string, unknown>; include?: Record<string, unknown> } = {};
    const prisma = {
      property: {
        findFirst: async (input: typeof query) => {
          query = input;
          return { id: "property", slug: "home", host: { address: "GHOST" } };
        },
      },
    } as unknown as PrismaService;

    await new PropertyService(prisma).bySlug("home");

    // The detail page shows the host address, so the query has to ask for it.
    expect(Object.keys(query.select ?? {})).toContain("host");
    expect(query.include).toBeUndefined();
  });

  it("keeps internal columns out of the detail response", async () => {
    let query: { select?: Record<string, unknown> } = {};
    const prisma = {
      property: {
        findFirst: async (input: typeof query) => {
          query = input;
          return { id: "property", slug: "home", host: { address: "GHOST" } };
        },
      },
    } as unknown as PrismaService;

    await new PropertyService(prisma).bySlug("home");

    const asked = Object.keys(query.select ?? {});
    expect(asked).toEqual(expect.arrayContaining(["id", "slug", "title", "description", "district", "host", "images", "slots"]));
    expect(asked).not.toContain("hostId");
    expect(asked).not.toContain("addressHash");
  });

  it("reports a missing listing rather than returning null", async () => {
    const prisma = {
      property: { findFirst: async () => null },
    } as unknown as PrismaService;

    await expect(new PropertyService(prisma).bySlug("ghost")).rejects.toThrow(/not found/i);
  });
});
