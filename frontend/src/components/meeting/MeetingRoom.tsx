export default function MeetingRoom({ meetingId }: { meetingId: string }) {
  return (
    <div>
      meeting room
      <p className="mb-8 text-slate-400">회의 코드: {meetingId}</p>
    </div>
  );
}
