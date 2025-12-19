'use client';

import React, { useRef } from 'react';

interface VideoUploadData {
  src: string;
  width: number;
  height: number;
  duration: number;
}

interface VideoUploadButtonProps {
  onUpload: (data: VideoUploadData) => void;
}

export default function VideoUploadButton({
  onUpload,
}: VideoUploadButtonProps) {
  // 파일 선택 Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 파일 선택기 연결
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 비디오 파일 유효성 검사
    if (!file.type.startsWith('video/')) {
      alert('비디오 파일만 업로드할 수 있습니다');
      return;
    }

    // video url 생성
    // 비디오는 base64 인코딩 시 용량 문제 발생(브라우저가 정지될 수 있음) -> blob URL 사용
    // blob url : 메모리에 저장된 파일 가르키기 위한 임시 파일
    const videoUrl = URL.createObjectURL(file);

    // 비디오 크기,길이 추출 : 임시 비디오 엘리먼트 생성
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.src = videoUrl;

    videoElement.onloadedmetadata = () => {
      onUpload({
        src: videoUrl,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        duration: videoElement.duration,
      });
      // 메모리 해제
      videoElement.remove();
    };

    e.target.value = '';
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleButtonClick}
        className="group flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100 py-8 transition hover:border-lime-500 hover:bg-lime-50"
      >
        <div
          className="h-12 w-12 bg-neutral-400 transition-colors duration-300 group-hover:bg-lime-600"
          style={{
            maskImage: `url('/icons/sidebar/videoIcon.svg')`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',

            WebkitMaskImage: `url('/icons/sidebar/videoIcon.svg')`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
          role="img"
          aria-label="비디오 업로드 아이콘"
        />

        <div className="text-center">
          <p className="text-lg font-bold text-neutral-600 group-hover:text-lime-700">
            비디오 업로드
          </p>
          <p className="text-sm text-neutral-500 group-hover:text-lime-700">
            내 PC에서 비디오를 선택하세요
          </p>
        </div>
      </button>
    </div>
  );
}
