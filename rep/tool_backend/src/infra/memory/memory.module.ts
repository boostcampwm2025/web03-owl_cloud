import { Global, Module } from "@nestjs/common";
import { CodeeditorRepository } from "./tool";
import { WhiteboardRepository } from "./tool/whiteboard-repo";


@Global()
@Module({
  providers : [
    CodeeditorRepository,
    WhiteboardRepository
  ],
  exports : [
    CodeeditorRepository,
    WhiteboardRepository
  ]
})
export class MemoryModule {};