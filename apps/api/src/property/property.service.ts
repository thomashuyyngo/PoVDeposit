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
    const property = await this.prisma.property.findFirst({
      where: { slug, active: true },
      include: {
        images: { orderBy: { position: "asc" } },
        slots: {
          where: { startsAt: { gt: new Date() }, booking: null },
          orderBy: { startsAt: "asc" },
        },
      },
    });
    if (!property) throw new Error("Property not found");
    return property;
  }
}
