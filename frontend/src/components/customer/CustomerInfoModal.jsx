import React, { useState, useEffect } from 'react';

export default function CustomerInfoModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setPhone(initialData.phone || '');
        setNote(initialData.note || '');
      } else {
        setName('');
        setPhone('');
        setNote('');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanNote = note.trim();

    if (!cleanName) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 100) {
      setError('Họ và tên phải từ 2 đến 100 ký tự.');
      return;
    }
    if (!cleanPhone) {
      setError('Vui lòng nhập số điện thoại.');
      return;
    }

    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (Vui lòng nhập 10 số, VD: 0912345678).');
      return;
    }

    setError('');
    onSubmit({
      name: cleanName,
      phone: cleanPhone,
      note: cleanNote
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col animate-slide-up relative border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
            Thông Tin Đặt Món
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold text-xs transition"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Quý khách vui lòng điền thông tin để nhà hàng phục vụ chu đáo nhất. Thông tin sẽ được lưu tự động cho các lần gọi món sau.
        </p>

        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center">
            <span className="font-bold mr-1.5">!</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0912345678"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Ghi chú món ăn <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder=""
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận đặt món</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
