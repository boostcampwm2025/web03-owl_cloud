type RequestOptions = RequestInit & {
  params?: Record<string, string>;
};

const baseApi = async <T>(
  endpoint: string,
  options: RequestOptions = {},
  withToken: boolean = false,
): Promise<T> => {
  const { params, headers, ...rest } = options;

  // URL 및 쿼리 스트링 설정
  const baseUrl = process.env.NEXT_PUBLIC_API_SERVER_URL;
  const queryString = params
    ? `?${new URLSearchParams(params).toString()}`
    : '';
  const url = `${baseUrl}${endpoint}${queryString}`;

  // 토큰 가져오기
  let token: string | null = null;
  if (withToken) {
    token =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('access_token')
        : null;

    // 토큰이 필요한 API 호출에 토큰이 없는 경우 API 호출 X (매번 401 에러 로그 표시 방지)
    if (withToken && !token) {
      return Promise.reject(new Error('NO_TOKEN'));
    }
  }

  const config: RequestInit = {
    ...rest,
    credentials: rest.credentials ?? (withToken ? 'include' : 'same-origin'),
    headers: {
      'Content-Type': 'application/json',
      ...(withToken && token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const response = await fetch(url, config);

  // 응답 헤더의 토큰 갱신 처리
  if (withToken) {
    const hasXAccessToken = response.headers.has('x-access-token');
    const newAccessToken = response.headers.get('x-access-token');

    if (newAccessToken) {
      sessionStorage.setItem('access_token', newAccessToken);
    }
    // refresh token이 만료되었거나, 명시적으로 토큰이 제거된 경우(로그아웃)
    else if (response.status === 401 || (hasXAccessToken && !newAccessToken)) {
      sessionStorage.removeItem('access_token');
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'API 요청 실패');
  }

  return response.json();
};

// 인증이 필요 없는 요청
export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    baseApi<T>(url, { ...options, method: 'GET' }, false),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    baseApi<T>(
      url,
      { ...options, method: 'POST', body: JSON.stringify(body) },
      false,
    ),
};

// 인증이 필요한 요청
export const apiWithToken = {
  get: <T>(url: string, options?: RequestOptions) =>
    baseApi<T>(url, { ...options, method: 'GET' }, true),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    baseApi<T>(
      url,
      { ...options, method: 'POST', body: JSON.stringify(body) },
      true,
    ),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    baseApi<T>(
      url,
      { ...options, method: 'PATCH', body: JSON.stringify(body) },
      true,
    ),
  delete: <T>(url: string, options?: RequestOptions) =>
    baseApi<T>(url, { ...options, method: 'DELETE' }, true),
};
