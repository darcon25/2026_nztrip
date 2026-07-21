import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// iOS Safari 只要看到 <a download> 就會走下載管理員、把圖片存進「檔案」App（跳下載卡），
// 無法 inline 顯示成一張圖、也就無法長按存到「照片」。所以 iPhone 上不加 download，
// 改用新分頁 inline 開圖讓使用者長按儲存；桌機才用 download 一鍵下載。
// iPadOS 13+ 會偽裝成 Mac，用觸控點數再判斷一次。
export const isIOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
