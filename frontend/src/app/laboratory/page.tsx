import CodeEditor from '@/components/code-editor/CodeEditor';

export default function Laboratory() {
  return (
    <main className="flex h-screen w-screen flex-col gap-4 p-4">
      <span>~ Code Editor ~</span>

      {/* 협업 코드 에디터 */}
      <div className="min-h-0 flex-1 border">
        <CodeEditor />
      </div>
    </main>
  );
}
