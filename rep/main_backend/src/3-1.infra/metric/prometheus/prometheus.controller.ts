import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';

// prometheus가 메트릭을 pull할 수 있게 열어두는 controller
@Controller('')
export class PrometheusController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8') // 프로메테우스가 사용하는 문자열 버전 0.0.4를 명시함
  async getMetrics(): Promise<string> {
    const registry = this.prometheusService.getRegistry();

    // 데이터를 직렬화 해서 보내준다.
    return registry.metrics();
  }
}
