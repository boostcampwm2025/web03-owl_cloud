import { test, expect } from '@playwright/test';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import fs from 'node:fs';

// .env.local 파일 로드
const envPath = path.resolve(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  loadEnvFile(envPath);
}

test.describe('화이트보드 진입', () => {
  test('로그인 후 회의 생성 및 화이트보드 열기', async ({ page }) => {
    // 1. 루트로 이동
    await page.goto('http://localhost:3000/');

    // 2. 로그인 화면으로 이동
    const loginBtn = page.locator('a:has-text("로그인")').first();
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    // 3. 카카오 로그인 버튼 클릭
    const kakaoLoginBtn = page.getByRole('button', { name: /카카오/i }).first();
    await expect(kakaoLoginBtn).toBeVisible();
    await kakaoLoginBtn.click();

    // 4. 카카오 로그인 페이지 대기
    await page.waitForURL(/.*kakao\.com.*/);

    // 5. 환경 변수에서 카카오 계정 정보 가져오기
    const kakaoId = process.env.KAKAO_ID;
    const kakaoPassword = process.env.KAKAO_PASSWORD;

    if (!kakaoId || !kakaoPassword) {
      throw new Error('KAKAO_ID or KAKAO_PASSWORD is not set in .env');
    }

    // 6. 카카오 로그인 폼 채우기 및 제출
    await page.fill('#loginId--1', kakaoId);
    await page.fill('#password--2', kakaoPassword);
    await page.click('.btn_g.highlight.submit');

    // 7. 로그인 완료 후 메인페이지로 리다이렉트 대기
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 8. '시작하기' 버튼 클릭
    const startMeetingBtn = page.getByRole('button', { name: '시작하기' });
    await expect(startMeetingBtn).toBeVisible({ timeout: 15000 });
    await startMeetingBtn.click();

    // 9. 방 생성 모달 확인
    const modalTitle = page.locator('text=회의 생성').first();
    await expect(modalTitle).toBeVisible({ timeout: 15000 });

    // 10. '생성' 버튼 클릭
    await page.click('button:has-text("생성")');

    // 11. 새로운 방 URL로 이동 확인
    await page.waitForURL(/http:\/\/localhost:3000\/[a-zA-Z0-9-]+$/);

    // 12. '참여하기' 클릭
    const joinButton = page.locator('button:has-text("참여하기")').first();
    await expect(joinButton).toBeVisible();
    await joinButton.click();

    // 13. 화이트보드 열기
    const whiteboardMenuBtn = page.getByRole('button', { name: '화이트보드' });
    await expect(whiteboardMenuBtn).toBeVisible({ timeout: 10000 });
    await whiteboardMenuBtn.click();

    // 14. 화이트보드 캔버스 확인
    const whiteboardCanvas = page.locator('.konvajs-content').first();
    await expect(whiteboardCanvas).toBeVisible({ timeout: 15000 });
  });
});
