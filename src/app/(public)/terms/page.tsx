import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({
    title: 'Điều khoản sử dụng',
    description: 'Bản dự thảo điều khoản sử dụng và đặt lịch dịch vụ của FIN PHOTO.',
    path: '/terms',
  });
}

export default function TermsPage() {
  const sections: Array<[string, string]> = [
    ['1. Thông tin đơn vị cung cấp', 'Tên doanh nghiệp/hộ kinh doanh: [CHƯA ĐIỀN]. Địa chỉ: [CHƯA ĐIỀN]. Email liên hệ: [CHƯA ĐIỀN].'],
    ['2. Phạm vi dịch vụ', 'Website cho phép người dùng xem gói chụp, lịch trống dự kiến, gửi yêu cầu booking và quản lý đánh giá. Booking chỉ được xác nhận sau khi FIN PHOTO liên hệ lại.'],
    ['3. Tài khoản', 'Người dùng chịu trách nhiệm cung cấp thông tin chính xác, giữ bí mật thông tin đăng nhập và thông báo khi nghi ngờ tài khoản bị truy cập trái phép. Không sử dụng tài khoản của người khác.'],
    ['4. Giá và thanh toán', 'Giá hiển thị là giá dự kiến theo gói tại thời điểm booking. Dự án hiện không thu tiền online; khách thanh toán theo thỏa thuận được xác nhận cho buổi chụp. Các khoản phát sinh phải được hai bên thống nhất.'],
    ['5. Đổi, hủy và thời tiết', 'Điều kiện đổi/hủy lịch, thời hạn báo trước, chi phí phát sinh và phương án khi thời tiết không phù hợp: [CHƯA ĐIỀN/ĐỐI CHIẾU CHÍNH SÁCH VẬN HÀNH].'],
    ['6. Ảnh, quyền sử dụng và đánh giá', 'Quyền sở hữu, phạm vi chỉnh sửa, bàn giao file gốc và quyền sử dụng ảnh cho portfolio/truyền thông phải được thỏa thuận rõ với khách: [CHƯA ĐIỀN]. Người gửi đánh giá cam kết có quyền đối với nội dung và ảnh đã tải lên.'],
    ['7. Hành vi bị cấm', 'Không được phá hoại hệ thống, giả mạo danh tính, đặt lịch hàng loạt nhằm chiếm chỗ, tải nội dung trái pháp luật hoặc xâm phạm quyền của bên thứ ba.'],
    ['8. Giới hạn trách nhiệm và giải quyết tranh chấp', 'Phạm vi trách nhiệm, luật áp dụng và cơ chế giải quyết khiếu nại/tranh chấp: [CHƯA ĐIỀN VÀ CẦN TƯ VẤN PHÁP LÝ].'],
    ['9. Thời gian lưu dữ liệu', 'Thời gian lưu booking, thông tin liên hệ, ảnh và đánh giá: [CHƯA ĐIỀN SỐ THÁNG/NĂM]. Nội dung này phải thống nhất với Chính sách riêng tư.'],
  ];

  return <main className="fin-site min-h-screen bg-background py-24 text-slate-900">
    <article className="mx-auto max-w-3xl px-5 sm:px-8">
      <p className="section-kicker">Dự thảo pháp lý</p>
      <h1 className="mt-3 text-4xl font-black">Điều khoản sử dụng</h1>
      <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong>Quan trọng:</strong> Đây chỉ là bản dự thảo. Chủ dự án phải tự rà soát hoặc nhờ người am hiểu pháp lý kiểm tra, hoàn thiện các chỗ trống và phê duyệt trước khi áp dụng.</div>
      <p className="mt-6 text-sm text-slate-500">Ngày hiệu lực: [CHƯA ĐIỀN]</p>
      <div className="mt-8 space-y-8">{sections.map(([heading, copy]) => <section key={heading}><h2 className="text-xl font-black">{heading}</h2><p className="mt-3 leading-7 text-slate-600">{copy}</p></section>)}</div>
    </article>
  </main>;
}
