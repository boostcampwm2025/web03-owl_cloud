'use client';

// import TextPropertyBar from '@/components/whiteboard/sidebar/properties/TextPropertyBar';

export default function Sidebar() {
  // TODO : store에서 selectedItemType 가져온 후 조건부 렌더링

  return (
    <aside className="fixed top-20 left-4 z-40 flex flex-col gap-4">
      {/* Todo : 상단의 Toolbar에서 선택된 요소에 따른 사이드바 조건부 렌더링*/}
      {/* <TextPropertyBar /> */}
    </aside>
  );
}
