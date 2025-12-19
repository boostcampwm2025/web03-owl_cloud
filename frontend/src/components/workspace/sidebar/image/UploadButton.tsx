'use client';

import React, { useRef } from 'react';

interface UploadData {
  src: string;
  width: number;
  height: number;
}

interface UploadButtonProps {
  onUpload: (data: UploadData) => void;
}

export default function UploadButton({ onUpload }: UploadButtonProps) {
  // 파일 선택 Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 파일 선택기 연결
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 파일 선택 확인
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다');
      return;
    }

    // FileReader : Base64 인코딩(선택한 파일 문자열 형태 변환)
    const reader = new FileReader();
    reader.onload = (event) => {
      // 데이터 (Base64 문자열)
      const src = event.target?.result as string;

      // 가상 이미지 객체 생성 : 파일 데이터만으로 이미지 크기를 알 수 없어서 가상 이미지객체로 데이터 넣어서 해석 후 원본 크기 확인
      const img = new window.Image();

      // 이미지 로딩 후 실행 로직 : 크기 임시 저장
      img.onload = () => {
        onUpload({
          src: src,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      // 가상 이미지에 할당
      img.src = src;
    };
    reader.readAsDataURL(file);

    // 같은 파일 다시 선택 가능을 위한 초기화 : 해당 내용 없으면 같은 파일 선택시 작동 X
    e.target.value = '';
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
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
            maskImage: `url('/icons/sidebar/imageIcon.svg')`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',

            WebkitMaskImage: `url('/icons/sidebar/imageIcon.svg')`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
          role="img"
          aria-label="업로드 아이콘"
        />

        <div className="text-center">
          <p className="text-lg font-bold text-neutral-600 group-hover:text-lime-700">
            이미지 업로드
          </p>
          <p className="text-sm text-neutral-500 group-hover:text-lime-700">
            내 PC에서 이미지를 선택하세요
          </p>
        </div>
      </button>
    </div>
  );
}
