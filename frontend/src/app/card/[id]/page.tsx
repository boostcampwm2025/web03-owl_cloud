import { DUMMY_CARD } from '@/app/card/[id]/dummy';
import AddReactionBtn from '@/components/card/AddReactionBtn';
import Card from '@/components/card/Card';
import CardProfile from '@/components/card/CardProfile';
import LikeBtn from '@/components/card/LikeBtn';
import ReportBtn from '@/components/card/ReportBtn';
import ShareBtn from '@/components/card/ShareBtn';
import ToggleReactionBtn from '@/components/card/ToggleReactionBtn';
import Image from 'next/image';
import Link from 'next/link';

export default function CardDetailPage() {
  // API 호출 부분
  const cardData = DUMMY_CARD;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex w-full max-w-300 flex-col gap-12 px-6 pt-4 pb-8">
        <section className="flex flex-col gap-4">
          <CardProfile />

          <article className="flex aspect-12/7 w-full justify-center overflow-hidden rounded-2xl bg-neutral-100 p-4">
            <Card initialData={cardData} />
          </article>

          <div className="flex w-full items-center justify-between">
            <LikeBtn hasLiked={false} likeCount={0} />
            <ToggleReactionBtn />
          </div>
        </section>

        <section className="flex w-full justify-between">
          <div className="flex gap-2">
            <ReportBtn />
            <ShareBtn />
            <AddReactionBtn />
          </div>

          <div className="flex gap-2">
            <Link href="/" className="btn-sm btn-default h-full">
              메인 페이지로
            </Link>
            <Link href="/landing" className="btn-sm btn-primary">
              <Image
                src="/icons/card/resetIcon.svg"
                width={24}
                height={24}
                alt="다시 뽑기 아이콘"
              />
              <span>다시 뽑기</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
