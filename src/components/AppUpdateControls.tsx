import { CheckCircle2, RefreshCw, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import type { WebUpdateCheckStatus } from '../hooks/useAppUpdater.ts';
import {
  AppBuildVersionInfo,
  formatBuildTimestamp,
  formatShortBuildId,
} from '../utils/appUpdater.ts';

interface AppUpdateBannerProps {
  visible: boolean;
  isUpdating: boolean;
  remoteBuild: AppBuildVersionInfo | null;
  onApplyUpdate: () => void;
  onDismiss: () => void;
}

export function AppUpdateBanner({
  visible,
  isUpdating,
  remoteBuild,
  onApplyUpdate,
  onDismiss,
}: AppUpdateBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="web-update-banner"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      className="fixed right-4 left-4 sm:left-auto sm:max-w-sm z-[76] rounded-2xl border border-[#0284C7]/60 dark:border-[#38BDF8]/50 bg-white/95 dark:bg-[#0B1222]/96 text-[#070B14] dark:text-[#F1F5F9] p-4 shadow-[0_20px_48px_-16px_rgba(2,132,199,0.4)] backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] dark:bg-[#0E223D] text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#070B14] dark:text-white leading-snug">
              Đã có bản build web mới
            </p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Đóng thông báo cập nhật web"
              className="p-1 -mr-1 -mt-1 rounded-lg text-[#64748B] hover:text-[#070B14] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            Phiên bản mới{' '}
            {remoteBuild ? (
              <span className="font-mono text-[#0369A1] dark:text-[#7DD3FC]">
                ({formatShortBuildId(remoteBuild.buildId)})
              </span>
            ) : null}{' '}
            đã sẵn sàng. Cập nhật để xóa cache cũ và nhận giao diện mới nhất.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onApplyUpdate}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isUpdating ? 'Đang cập nhật...' : 'Cập Nhật Ngay'}</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-2 rounded-xl text-xs font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white cursor-pointer"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AppUpdateModalProps {
  open: boolean;
  currentBuild: AppBuildVersionInfo;
  remoteBuild: AppBuildVersionInfo | null;
  updateAvailable: boolean;
  swPending: boolean;
  status: WebUpdateCheckStatus;
  lastCheckedAt: string | null;
  errorMessage: string | null;
  onClose: () => void;
  onCheckUpdates: () => void;
  onApplyUpdate: () => void;
}

export function AppUpdateModal({
  open,
  currentBuild,
  remoteBuild,
  updateAvailable,
  swPending,
  status,
  lastCheckedAt,
  errorMessage,
  onClose,
  onCheckUpdates,
  onApplyUpdate,
}: AppUpdateModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isChecking = status === 'checking';
  const isUpdating = status === 'updating';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kiểm tra và cập nhật phiên bản web"
      data-testid="web-update-modal"
      className="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#DCE6F2] dark:border-[#1E355A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#0369A1] dark:text-[#38BDF8] font-semibold">
              CẬP NHẬT PHIÊN BẢN WEB
            </p>
            <h3 className="font-display text-2xl font-semibold leading-tight">
              Đồng Bộ Bản Build Mới Nhất
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ cập nhật web"
            className="min-w-[38px] min-h-[38px] rounded-xl border border-[#DCE6F2] dark:border-[#1E355A] text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div
          className={`rounded-xl border p-3.5 flex items-start gap-2.5 text-xs leading-relaxed ${
            updateAvailable
              ? 'border-[#0284C7]/45 bg-[#E0F2FE]/60 dark:bg-[#0C2542]/70 text-[#075985] dark:text-[#BAE6FD]'
              : errorMessage
              ? 'border-amber-400/50 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
              : 'border-emerald-500/35 bg-emerald-50/70 dark:bg-emerald-950/35 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {updateAvailable ? (
            <Sparkles className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8] shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div>
            {isChecking ? (
              <span>Đang kiểm tra bản build mới nhất trên máy chủ...</span>
            ) : updateAvailable ? (
              <span>
                <strong>Phát hiện bản cập nhật mới</strong>
                {swPending ? ' (Service Worker đang chờ kích hoạt).' : '.'} Nhấn{' '}
                <strong>Cập Nhật &amp; Xóa Cache</strong> để nạp toàn bộ mã nguồn mới ngay.
              </span>
            ) : errorMessage ? (
              <span>{errorMessage}</span>
            ) : (
              <span>
                Trình duyệt đang dùng phiên bản mới nhất được ghi nhận. Nếu vẫn thấy giao diện cũ do
                cache trình duyệt, hãy dùng nút xóa cache bên dưới.
              </span>
            )}
          </div>
        </div>

        {/* Version Comparison Details */}
        <dl className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-[#F8FAFC] dark:bg-[#070D19] p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#475569] dark:text-[#94A3B8] shrink-0">Bản đang mở</dt>
            <dd
              data-testid="current-build-id"
              className="font-mono tabular-nums font-semibold text-[#070B14] dark:text-white text-right"
            >
              {formatShortBuildId(currentBuild.buildId)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#475569] dark:text-[#94A3B8] shrink-0">Thời gian build</dt>
            <dd className="font-mono tabular-nums text-[#475569] dark:text-[#94A3B8] text-right">
              {formatBuildTimestamp(currentBuild.builtAt)}
            </dd>
          </div>
          <div className="border-t border-[#DCE6F2] dark:border-[#182740] pt-2.5 flex items-center justify-between gap-3">
            <dt className="text-[#475569] dark:text-[#94A3B8] shrink-0">Bản trên máy chủ</dt>
            <dd
              data-testid="remote-build-id"
              className="font-mono tabular-nums font-semibold text-[#0369A1] dark:text-[#38BDF8] text-right"
            >
              {remoteBuild ? formatShortBuildId(remoteBuild.buildId) : 'Chưa kiểm tra'}
            </dd>
          </div>
          {lastCheckedAt && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#475569] dark:text-[#94A3B8] shrink-0">Kiểm tra lúc</dt>
              <dd className="font-mono tabular-nums text-[#475569] dark:text-[#94A3B8] text-right">
                {formatBuildTimestamp(lastCheckedAt)}
              </dd>
            </div>
          )}
        </dl>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onCheckUpdates}
            disabled={isChecking || isUpdating}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#DCE6F2] dark:border-[#1E355A] bg-white dark:bg-[#0F1A2E] hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isChecking ? 'Đang kiểm tra...' : 'Kiểm Tra Bản Mới'}</span>
          </button>

          <button
            type="button"
            onClick={onApplyUpdate}
            disabled={isUpdating}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isUpdating
                ? 'Đang làm mới...'
                : updateAvailable
                ? 'Cập Nhật Bản Mới Ngay'
                : 'Xóa Cache & Tải Lại'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
