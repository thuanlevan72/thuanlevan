import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface LazyLoadErrorBoundaryProps {
  resetKey?: string;
  label?: string;
  children: ReactNode;
}

interface LazyLoadErrorBoundaryState {
  hasError: boolean;
}

export class LazyLoadErrorBoundary extends Component<
  LazyLoadErrorBoundaryProps,
  LazyLoadErrorBoundaryState
> {
  state: LazyLoadErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LazyLoadErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: LazyLoadErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Handled gracefully by fallback UI
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="min-h-[320px] rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white/90 dark:bg-[#0B1222]/95 flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Không thể tải {this.props.label ?? 'mô-đun'} do phiên bản máy chủ vừa cập nhật
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
          Vui lòng thử tải lại mô-đun hoặc làm mới trang để đồng bộ tệp mới nhất.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="min-h-[40px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-sky-400 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử tải lại</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[40px] px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold cursor-pointer"
          >
            Làm mới trang
          </button>
        </div>
      </div>
    );
  }
}
