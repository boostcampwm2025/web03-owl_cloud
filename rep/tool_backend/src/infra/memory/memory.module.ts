import { Global, Module } from "@nestjs/common";
import { CodeeditorRepository } from "./tool";


@Global()
@Module({
  providers : [
    CodeeditorRepository
  ],
  exports : [
    CodeeditorRepository
  ]
})
export class MemoryModule {};