'use client';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="workspace-error" role="alert"><h1>Không thể tải khu vực quản trị</h1><p>Vui lòng thử lại. Nếu lỗi tiếp tục, hãy kiểm tra phiên đăng nhập.</p><button type="button" onClick={() => reset()}>Thử lại</button></div>;
}
