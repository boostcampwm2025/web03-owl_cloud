'use client';

import { motion, Variants } from 'framer-motion';
import ParticipateMeetingForm from '@/components/landing/ParticipateMeetingForm';
import StartMeetingButton from '@/components/landing/StartMeetingButton';
import Header from '@/components/layout/Header';

export default function Home() {
  /** 공통 easing (자연스러운 ease-out) */
  const easeOut = [0.16, 1, 0.3, 1] as const;

  /** 자식 stagger용 컨테이너 */
  const staggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const fadeInUp: Variants = {
    initial: {
      opacity: 0,
      y: 32,
      filter: 'blur(6px)',
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 1,
        ease: easeOut,
      },
    },
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#050505] selection:bg-indigo-500/30">
      {/* 배경 Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] h-[35%] w-[35%] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <Header />

      <main className="relative mt-16 flex w-full flex-1 items-center justify-center px-4 text-white">
        <div className="flex h-full w-full max-w-6xl items-center py-12 max-lg:flex-col max-lg:gap-16 lg:gap-24">
          <motion.section
            className="flex w-full flex-col items-center justify-center text-center lg:items-start lg:text-left"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div
              variants={fadeInUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              <span className="text-xs font-medium tracking-wider text-indigo-300 uppercase">
                v1.0.0
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-8 text-7xl leading-[0.9] font-black tracking-tighter md:text-9xl"
            >
              <span className="text-[#0084D1]">dev:</span>meet
            </motion.h1>

            <motion.h2
              variants={fadeInUp}
              className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl"
            >
              One Flow,
              <br />
              <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                All Dev.
              </span>
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="max-w-md text-lg leading-relaxed text-neutral-400 md:text-xl"
            >
              코드와 설계, 대화의 맥락이 하나로 이어지는 공간
            </motion.p>
          </motion.section>

          <motion.section
            className="w-full max-w-105"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 1,
              ease: easeOut,
              delay: 0.3,
            }}
          >
            <div className="group relative">
              {/* glow 효과 */}
              <motion.div
                className="absolute -inset-0.5 rounded-3xl bg-linear-to-b from-blue-500/40 to-indigo-600/40 blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                transition={{ duration: 1.2, delay: 0.4 }}
              />

              <div className="relative flex w-full flex-col gap-10 rounded-2xl border border-white/10 bg-[#0A0A0A]/80 px-8 py-12 shadow-2xl backdrop-blur-xl">
                <section className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-white">
                      새 회의 시작
                    </h2>
                    <p className="text-sm text-neutral-500">
                      즉시 방을 생성하고 팀원을 초대하세요.
                    </p>
                  </div>
                  <StartMeetingButton />
                </section>

                <div className="flex w-full items-center gap-4 text-neutral-600">
                  <span className="h-px flex-1 bg-neutral-800" />
                  <span className="text-xs font-bold tracking-widest uppercase">
                    OR
                  </span>
                  <span className="h-px flex-1 bg-neutral-800" />
                </div>

                <section className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-white">
                      회의 참여하기
                    </h2>
                    <p className="text-sm text-neutral-500">
                      전달받은 초대 코드를 입력해 주세요.
                    </p>
                  </div>
                  <ParticipateMeetingForm />
                </section>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
