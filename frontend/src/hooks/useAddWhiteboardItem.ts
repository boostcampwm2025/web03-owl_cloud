import { useWhiteboardLocalStore } from '@/store/useWhiteboardLocalStore';
import { useItemActions } from '@/hooks/useItemActions';
import { getCenterWorldPos } from '@/utils/coordinate';
import { ShapeType } from '@/types/whiteboard';
import { StackIconInfo } from '@/constants/stackList';

export const useAddWhiteboardItem = () => {
  const {
    addText,
    addArrow,
    addLine,
    addShape,
    addImage,
    addVideo,
    addYoutube,
    addStack,
  } = useItemActions();

  const getViewportCenter = () => {
    const stageRef = useWhiteboardLocalStore.getState().stageRef;
    const stage = stageRef?.current;

    if (!stage) {
      const { stagePos, stageScale, viewportWidth, viewportHeight } =
        useWhiteboardLocalStore.getState();
      return getCenterWorldPos(
        stagePos,
        stageScale,
        viewportWidth,
        viewportHeight,
      );
    }

    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    const { viewportWidth, viewportHeight } =
      useWhiteboardLocalStore.getState();

    return getCenterWorldPos(
      stagePos,
      stageScale,
      viewportWidth,
      viewportHeight,
    );
  };

  // Text Item 추가 핸들러
  const handleAddText = () => {
    const worldPos = getViewportCenter();

    const defaultWidth = 200;
    const defaultFontSize = 32;

    addText({
      x: worldPos.x - defaultWidth / 2,
      y: worldPos.y - defaultFontSize / 2,
    });
  };

  // Arrow Item 추가 핸들러
  const handleAddArrow = () => {
    const worldPos = getViewportCenter();
    addArrow({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  // Line Item 추가 핸들러
  const handleAddLine = () => {
    const worldPos = getViewportCenter();
    addLine({
      points: [worldPos.x - 100, worldPos.y, worldPos.x + 100, worldPos.y],
    });
  };

  // Shape Item 추가 핸들러
  const handleAddShape = (type: ShapeType) => {
    const worldPos = getViewportCenter();

    const width = 100;
    const height = 100;

    addShape(type, {
      x: worldPos.x - width / 2,
      y: worldPos.y - height / 2,
      width,
      height,
    });
  };

  // Image Item 추가 핸들러
  const handleAddImage = () => {
    // 파일 선택창 설정
    // input 태그 설정, 타입은 파일 업로드용 , 이미지 파일만 선택되도록 설정
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    // 파일 선택 후 처리 로직(파일 읽기)
    input.onchange = (e) => {
      // 선택한 파일 선정
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // GIF 파일 업로드 제한
      if (file.type === 'image/gif') {
        alert('GIF 파일은 업로드할 수 없습니다.');
        return;
      }

      // 용량 제한 로직 추가
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB를 바이트 단위로 계산
      if (file.size > MAX_FILE_SIZE) {
        alert('이미지 용량은 10MB를 초과할 수 없습니다.');
        return;
      }

      // 파일 읽기
      const reader = new FileReader();
      // 파일 읽기 완료 후 실행
      reader.onload = (readerEvent) => {
        const src = readerEvent.target?.result as string;

        // src를 이용한 이미지 객체 생성
        const img = new Image();
        img.src = src;

        // 이미지 로딩 후 크기 확인 후 로직
        img.onload = () => {
          // 원본 이미지 크기 읽기
          let w = img.width;
          let h = img.height;

          // 제한 크기 설정
          const MAX_SIZE = 500;

          // 이미지 제한 로직
          if (w > MAX_SIZE || h > MAX_SIZE) {
            // 가로 세로 비율 유지하며 크기 조정
            const ratio = w / h;
            if (w > h) {
              w = MAX_SIZE;
              h = MAX_SIZE / ratio;
            } else {
              h = MAX_SIZE;
              w = MAX_SIZE * ratio;
            }
          }

          const worldPos = getViewportCenter();

          // store 저장
          addImage({
            src,
            width: w,
            height: h,
            x: worldPos.x - w / 2,
            y: worldPos.y - h / 2,
          });
        };
      };
      // Base64 형식으로 파일 읽기
      // Base 64 : 별도 서버 업로드 과정 없이 src로 바로 사용
      reader.readAsDataURL(file);
    };

    // 파일 탐색기 열기
    input.click();
  };

  // Video Item 추가 핸들러
  const handleAddVideo = () => {
    // 파일 선택창 설정
    // input 태그 설정, 타입은 파일 업로드용, 비디오 파일만 선택되도록 설정
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';

    // 파일 선택 후 처리 로직(파일 읽기)
    input.onchange = (e) => {
      // 선택한 파일 선정
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Blob URL 생성
      // Blob URL : 브라우저 메모리에 임시로 저장되는 URL, 새로고침시 사라짐

      // 동영상의 경우 용량이 크므로 Base64로 읽지 않고 Blob URL 사용
      // 만약 동영상을 Base64로 읽으면 메모리 부족으로 브라우저가 멈출 수 있음
      // TODO : 실제 서비스에서는 AWS S3 등 외부 서버에 업로드하고 그 URL을 받아와야 함
      const videoSrc = URL.createObjectURL(file);

      // 비디오 엘리먼트 생성
      // 동영상 자체만으로 해상도를 알수 없기에 가상의 video element 생성
      const videoElement = document.createElement('video');
      // blob 주소와 연결
      videoElement.src = videoSrc;

      // 메타데이터 로드 후 실제 크기 파악
      videoElement.onloadedmetadata = () => {
        let w = videoElement.videoWidth;
        let h = videoElement.videoHeight;
        const MAX_SIZE = 600;

        // 크기 제한 로직
        if (w > MAX_SIZE || h > MAX_SIZE) {
          const ratio = w / h;
          if (w > h) {
            w = MAX_SIZE;
            h = MAX_SIZE / ratio;
          } else {
            h = MAX_SIZE;
            w = MAX_SIZE * ratio;
          }
        }

        // 뷰포트 중앙 좌표 계산
        const worldPos = getViewportCenter();

        addVideo({
          src: videoSrc,
          width: w,
          height: h,
          x: worldPos.x - w / 2,
          y: worldPos.y - h / 2,
        });
      };
    };

    input.click();
  };

  const handleAddYoutube = (url?: string) => {
    // 넘겨받은 url이 있으면 사용 없으면 prompt
    const targetUrl = url ?? prompt('유튜브 URL을 입력하세요');
    if (!targetUrl) return;

    const worldPos = getViewportCenter();
    const width = 640;
    const height = 360;

    addYoutube({
      url: targetUrl,
      x: worldPos.x - width / 2,
      y: worldPos.y - height / 2,
    });
  };

  // Stack Item 추가 핸들러
  const handleAddStack = (icon: StackIconInfo) => {
    const worldPos = getViewportCenter();
    const width = 240;
    const height = 240;

    addStack({
      src: icon.src,
      stackName: icon.name,
      category: icon.category,
      x: worldPos.x - width / 2,
      y: worldPos.y - height / 2,
      width,
      height,
    });
  };

  return {
    handleAddText,
    handleAddArrow,
    handleAddLine,
    handleAddShape,
    handleAddImage,
    handleAddVideo,
    handleAddYoutube,
    handleAddStack,
  };
};
