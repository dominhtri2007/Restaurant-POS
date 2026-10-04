import React from 'react';
export default function CartFloatingBar({ cart, onOpenCartModal, isStoreClosed = false, isQrOrderDisabled = false }) {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  if (totalCount === 0) return null;
  return (
    <div className="fixed bottom-3 left-0 right-0 px-4 z-40 max-w-md mx-auto">
      <div className="bg-gray-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-gray-800 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center font-extrabold text-white text-xs shadow-sm select-none">
            {totalCount}
          </div>
          <div>
            <div className="text-xs text-gray-300">Giỏ hàng: <strong className="text-white">{totalCount} món</strong></div>
            <div className="text-base font-extrabold text-orange-400">
              {totalPrice.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenCartModal}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 leading-none"
        >
          {isStoreClosed ? (isQrOrderDisabled ? 'Xem giỏ (Tạm dừng QR)' : 'Xem giỏ (Hết giờ làm việc)') : 'Xem giỏ hàng'}
        </button>
      </div>
    </div>
  );
}
