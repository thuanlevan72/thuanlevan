import { useState } from 'react';
import { Download, PlusSquare, Share, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PwaInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export function PwaInstallButton({ compact = false, className = '' }: PwaInstallButtonProps) {
  const { canNativeInstall, isInstalled, isIosDevice, promptInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (canNativeInstall) {
      await promptInstall();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        data-testid="pwa-install-btn"
        onClick={() => void handleClick()}
        title="Cài đặt ứng dụng vào Màn hình chính để chơi toàn màn hình ẩn thanh địa chỉ"
        className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/75 dark:hover:bg-emerald-900/80 dark:text-emerald-200 text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{compact ? 'Cài App' : 'Thêm Màn Hình Chính'}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hướng dẫn cài đặt ứng dụng PWA"
          className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0B1222] text-slate-100 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-400">
                  CHẾ ĐỘ ỨNG DỤNG (PWA)
                </p>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Chơi Toàn Màn Hình Không Thanh Địa Chỉ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Đóng hướng dẫn"
                className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIosDevice ? (
              <ol className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-cyan-300 shrink-0">1.</span>
                  <span>
                    Nhấn biểu tượng <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-sky-400 inline" /> Chia sẻ</strong> ở thanh dưới trình duyệt Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-cyan-300 shrink-0">2.</span>
                  <span>
                    Kéo xuống chọn <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Thêm vào MH chính</strong> (Add to Home Screen).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-cyan-300 shrink-0">3.</span>
                  <span>
                    Mở biểu tượng <strong className="text-amber-300">Pháo Đài TD</strong> vừa tạo và xoay ngang máy để tận hưởng tối đa khung hình.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-cyan-300 shrink-0">1.</span>
                  <span>Mở menu trình duyệt (<strong className="text-white">⋮</strong> hoặc biểu tượng Cài đặt trên thanh địa chỉ).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-cyan-300 shrink-0">2.</span>
                  <span>Chọn <strong className="text-white">Cài đặt ứng dụng / Thêm vào màn hình chính</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-cyan-300 shrink-0">3.</span>
                  <span>Mở ứng dụng ở chế độ độc lập (Standalone) để ẩn hoàn toàn thanh địa chỉ khi chơi ngang.</span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-[#070B14] font-bold text-sm cursor-pointer"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      className="fixed left-1/2 -translate-x-1/2 z-[75] px-3.5 py-2 rounded-xl border border-amber-400/50 bg-[#0B1222]/95 text-amber-200 text-xs font-mono font-semibold inline-flex items-center gap-2 shadow-lg whitespace-nowrap"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
      <span>Đang chạy ngoại tuyến · Trò chơi vẫn hoạt động bình thường</span>
    </div>
  );
}
