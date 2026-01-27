import { Injectable } from '@nestjs/common';
import { YjsRepository } from './yjs-repo';
import * as Y from 'yjs';

@Injectable()
export class CodeeditorRepository implements YjsRepository {
  private readonly roomDocs = new Map<string, Y.Doc>();

  get(room_id: string): Y.Doc | undefined {
    return this.roomDocs.get(room_id);
  }

  set(room_id: string, doc: Y.Doc): void {
    this.roomDocs.set(room_id, doc);
  }

  delete(room_id: string): void {
    this.roomDocs.delete(room_id);
  }
}
