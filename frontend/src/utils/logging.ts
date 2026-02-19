import * as Sentry from '@sentry/nextjs';

export function captureError(params: {
  error: unknown;
  type: string;
  message: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', params.type);

    if (params.tags) scope.setTags(params.tags);
    if (params.extra) scope.setContext('details', params.extra);

    // Fingerprint를 설정하면 Sentry에서 이슈를 그룹화하는 방식을 직접 제어 가능
    scope.setFingerprint([params.type, params.message]);

    const exception =
      params.error instanceof Error ? params.error : new Error(params.message);
    Sentry.captureException(exception);
  });
}

export function socketBreadcrumb(
  event: string,
  data?: unknown,
  level: 'info' | 'warning' | 'error' = 'info',
) {
  Sentry.addBreadcrumb({
    category: 'socket',
    message: event,
    data: data ? { payload: data } : undefined,
    level,
  });
}

type Level = 'info' | 'warning' | 'error';

export function syncLog(
  name: string,
  data: Record<string, any> = {},
  level: Level = 'info',
) {
  // breadcrumb (타임라인)
  Sentry.addBreadcrumb({
    category: 'yjs-sync',
    message: name,
    level,
    data,
  });

  // anomaly / simulation 은 event로도 쏘기
  if (level !== 'info') {
    Sentry.captureMessage(`[SYNC] ${name}`, {
      level,
      extra: data,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`🧩 [${name}]`, data);
  }
}
