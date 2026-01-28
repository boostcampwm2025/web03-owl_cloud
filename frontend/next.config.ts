import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'owl-cloud-local-disk.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
    ],
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
              replaceAttrValues: {
                black: 'currentColor',
                '#000': 'currentColor',
                '#000000': 'currentColor',
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },

  webpack(config) {
    // 기존의 모든 SVG 관련 rule을 찾아서 가져옵니다.
    // @ts-expect-error: webpack rule type error
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    );

    config.module.rules.push(
      // 1. ?.url이 붙은 SVG는 기존처럼 리소스로 처리합니다. (예: url('./icon.svg?url'))
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      // 2. 그 외의 모든 SVG는 SVGR을 통해 React 컴포넌트로 변환합니다.
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: {
          not: [...(fileLoaderRule.resourceQuery?.not || []), /url/],
        },
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              // 위와 동일한 설정 적용
              icon: true,
              replaceAttrValues: {
                black: 'currentColor',
                '#000': 'currentColor',
                '#000000': 'currentColor',
              },
              // 필요하다면 아래 설정을 통해 viewBox 외의 width/height를 아예 제거할 수도 있습니다.
              svgoConfig: {
                plugins: [
                  {
                    name: 'removeViewBox',
                    active: false,
                  },
                ],
              },
            },
          },
        ],
      },
    );

    // 기존의 기본 SVG rule이 SVGR과 충돌하지 않도록 수정합니다.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

export default nextConfig;
