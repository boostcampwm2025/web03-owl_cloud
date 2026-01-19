import { Observable } from 'rxjs';

export interface EventStreamPort {
  emit<T>(topic: string, payload: T): Observable<any>;
}
