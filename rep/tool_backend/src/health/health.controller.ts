import { Controller, Get } from "@nestjs/common";


@Controller("health")
export class HealthController {
  @Get("")
  healthCheck(): Record<string, number> {
    return { status: 200 };
  }
};