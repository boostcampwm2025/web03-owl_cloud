import { GuardService } from "@/guards/guard.service";
import { ToolBackendPayload } from "@/guards/guard.type";
import { Injectable } from "@nestjs/common";


@Injectable()
export class WhiteboardService {

  constructor(
    private readonly guard : GuardService
  ) {}

  async guardService(token : string, type : "main" | "sub") : Promise<ToolBackendPayload> {
 
    const verified = await this.guard.verify(token);

    const payload : ToolBackendPayload = {
      room_id : verified.room_id,
      user_id : verified.sub,
      tool : verified.tool,
      clientType : type
    };

    if ( payload.tool !== "whiteboard" ) throw new Error("whiteboard만 가능한 gateway입니다.");

    // main인 경우 emit 해준다. 

    return payload;
  }

};