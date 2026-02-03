import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrometheusService } from "./prometheus/prometheus.service";
import { HttpMetricsInterceptor, WsMetricsInterceptor } from "./prometheus/prometheus.intercepter";
import { PrometheusController } from "./prometheus/prometheus.controller";


@Global()
@Module({
  controllers : [
    PrometheusController
  ],
  providers : [
    ConfigService,
    PrometheusService,
    HttpMetricsInterceptor,
    WsMetricsInterceptor
  ],
  exports : [
    PrometheusService,
    HttpMetricsInterceptor,
    WsMetricsInterceptor
  ]
})
export class PrometheusModule {};