export async function refreshPublicContent() {
  const response = await fetch('/api/revalidate-public', { method: 'POST' });
  if (!response.ok) throw new Error('Dữ liệu đã được lưu nhưng chưa thể làm mới nội dung công khai.');
}
