import { createPublicMetadata } from '@/lib/siteMetadata';

export async function generateMetadata() {
  return createPublicMetadata({
    title: 'Chính sách riêng tư',
    description: 'Bản dự thảo chính sách riêng tư của FIN PHOTO dành cho khách đặt lịch và gửi đánh giá.',
    path: '/privacy',
  });
}

export default function PrivacyPage() {
  return <LegalDocument
    eyebrow="Dự thảo pháp lý"
    title="Chính sách riêng tư"
    sections={[
      ['1. Đơn vị xử lý dữ liệu', 'Tên doanh nghiệp/hộ kinh doanh: [CHƯA ĐIỀN]. Địa chỉ: [CHƯA ĐIỀN]. Email liên hệ về dữ liệu cá nhân: [CHƯA ĐIỀN].'],
      ['2. Dữ liệu được thu thập', 'Website có thể thu thập họ tên, email, số điện thoại, địa điểm và thời gian chụp, nội dung trao đổi, thông tin tài khoản, ảnh đại diện, đánh giá và ảnh khách chủ động tải lên.'],
      ['3. Mục đích sử dụng', 'Dữ liệu được dùng để tạo và vận hành booking, liên hệ xác nhận lịch, thực hiện dịch vụ, quản lý tài khoản, tiếp nhận đánh giá, bảo đảm an toàn hệ thống và giải quyết yêu cầu hỗ trợ.'],
      ['4. Cơ sở và phạm vi chia sẻ', 'Dữ liệu chỉ được xử lý trong phạm vi cần thiết để cung cấp dịch vụ hoặc thực hiện nghĩa vụ pháp luật. Không bán dữ liệu cá nhân. Nhà cung cấp hạ tầng chỉ được tiếp cận theo phạm vi kỹ thuật cần thiết.'],
      ['5. Ảnh và nội dung công khai', 'Đánh giá và ảnh review có thể được hiển thị công khai khi trạng thái review cho phép. Bucket avatars và review-media hiện là công khai; người biết URL có thể tải file. Đây là rủi ro kỹ thuật đã được chủ dự án chấp nhận tại thời điểm soạn dự thảo.'],
      ['6. Thời gian lưu trữ', 'Thời gian lưu dữ liệu booking, tài khoản, ảnh và log: [CHƯA ĐIỀN SỐ THÁNG/NĂM VÀ TIÊU CHÍ XÓA]. Dữ liệu có thể được giữ lâu hơn khi pháp luật yêu cầu hoặc cần giải quyết tranh chấp.'],
      ['7. Quyền của người dùng', 'Bạn có thể yêu cầu xem, chỉnh sửa hoặc đề nghị xóa dữ liệu trong phạm vi pháp luật cho phép bằng email liên hệ nêu trên. Một số dữ liệu giao dịch có thể cần được lưu để đối soát hoặc tuân thủ nghĩa vụ pháp lý.'],
      ['8. Bảo mật và thay đổi chính sách', 'Dự án áp dụng phân quyền và kiểm soát truy cập phù hợp, nhưng không hệ thống nào an toàn tuyệt đối. Khi chính sách thay đổi đáng kể, phiên bản mới và ngày hiệu lực sẽ được công bố tại trang này.'],
    ]}
  />;
}

function LegalDocument({ eyebrow, title, sections }: { eyebrow: string; title: string; sections: Array<[string, string]> }) {
  return <main className="fin-site min-h-screen bg-background py-24 text-slate-900">
    <article className="mx-auto max-w-3xl px-5 sm:px-8">
      <p className="section-kicker">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black">{title}</h1>
      <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong>Quan trọng:</strong> Đây chỉ là bản dự thảo phục vụ giai đoạn chuẩn bị public. Chủ dự án phải tự rà soát hoặc nhờ người am hiểu pháp lý kiểm tra, điền đủ các chỗ trống và phê duyệt trước khi sử dụng chính thức.</div>
      <p className="mt-6 text-sm text-slate-500">Ngày hiệu lực: [CHƯA ĐIỀN]</p>
      <div className="mt-8 space-y-8">{sections.map(([heading, copy]) => <section key={heading}><h2 className="text-xl font-black">{heading}</h2><p className="mt-3 leading-7 text-slate-600">{copy}</p></section>)}</div>
    </article>
  </main>;
}
