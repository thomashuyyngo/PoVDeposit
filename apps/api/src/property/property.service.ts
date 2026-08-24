import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  list(district?: string) {
    return this.prisma.property.findMany({
      where: { active: true, ...(district ? { district: { equals: district, mode: "insensitive" } } : {}) },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        district: true,
        host: { select: { address: true } },
        images: { orderBy: { position: "asc" }, select: { url: true, altText: true } },
        slots: {
          where: { startsAt: { gt: new Date() }, booking: null },
          orderBy: { startsAt: "asc" },
          select: { id: true, startsAt: true, endsAt: true, lockedUntil: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async bySlug(slug: string) {
    // Selected, not included: the detail response carries the same fields as the
    // list, so a caller can move between them, and no internal column rides along.
    const property = await this.prisma.property.findFirst({
      where: { slug, active: true },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        district: true,
        host: { select: { address: true } },
        images: { orderBy: { position: "asc" }, select: { url: true, altText: true } },
        slots: {
          where: { startsAt: { gt: new Date() }, booking: null },
          orderBy: { startsAt: "asc" },
          select: { id: true, startsAt: true, endsAt: true, lockedUntil: true },
        },
      },
    });
    if (!property) throw new Error("Property not found");
    return property;
  }
}
