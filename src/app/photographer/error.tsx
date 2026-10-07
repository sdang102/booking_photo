'use client';

export default function PhotographerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="workspace-error" role="alert"><h1>Không thể tải workspace thợ chụp</h1><p>Vui lòng thử lại. Nếu lỗi tiếp tục, hãy kiểm tra phiên đăng nhập.</p><button type="button" onClick={() => reset()}>Thử lại</button></div>;
}
