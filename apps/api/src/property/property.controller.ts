import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { PropertyService } from "./property.service.js";

@Controller("api/properties")
export class PropertyController {
  constructor(private readonly properties: PropertyService) {}

  @Get()
  list(@Query("district") district?: string) {
    return this.properties.list(district?.trim() || undefined);
  }

  @Get(":slug")
  async bySlug(@Param("slug") slug: string) {
    try {
      return await this.properties.bySlug(slug);
    } catch {
      throw new NotFoundException("Property not found");
    }
  }
}
