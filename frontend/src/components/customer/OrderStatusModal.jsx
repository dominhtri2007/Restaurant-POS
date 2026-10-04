import React from 'react';

export default function OrderStatusModal({
  isOpen,
  onClose,
  cart = [],
  orderStatus,
  onConfirmOrder,
  isSubmitting,
  onClearCart,
  onAddToCart,
  onRemoveFromCart,
  onDeleteFromCart,
  customerInfo = null,
  onOpenCustomerModal,
  isStoreClosed = false,
  isQrOrderDisabled = false
}) {
  if (!isOpen) return null;
  const totalAmount = cart.reduce((sum, it) => sum + (it.product.price * it.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col animate-slide-up border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            {orderStatus ? 'Thông Báo Đặt Món' : 'Chi Tiết Giỏ Hàng'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold text-xs transition"
          >
            ✕
          </button>
        </div>

        {orderStatus ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3.5">
            {orderStatus !== 'CANCELLED' ? (
              <>

                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl border border-emerald-200">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Đặt Món Thành Công!</h3>
                  <p className="text-xs text-gray-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Vui lòng đợi trong giây lát, nhân viên sẽ phục vụ món ăn tận bàn.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Đang chuẩn bị món ăn...</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-2xl border border-red-200">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-600">Đơn Món Chưa Thể Thực Hiện</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Món đã hết hoặc tạm ngưng phục vụ. Quý khách vui lòng liên hệ nhân viên tại bàn để được hỗ trợ.
                  </p>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onClearCart();
              }}
              className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95"
            >
              Tiếp tục xem thực đơn
            </button>
          </div>
        ) : (
          <>
            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <i className="fa-solid fa-basket-shopping text-3xl block mb-2 text-gray-300"></i>
                <p className="text-sm font-medium">Giỏ hàng của bạn đang trống.</p>
                <button
                  onClick={onClose}
                  className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                >
                  Chọn món ngay
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between py-2.5 border-b border-gray-100 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-red-600 font-bold mt-0.5">
                          {Number(item.product.price).toLocaleString('vi-VN')} đ
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart && onRemoveFromCart(item.product.id)}
                            className="w-6 h-6 rounded bg-white text-gray-700 font-bold text-sm flex items-center justify-center shadow-xs active:bg-gray-200"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-gray-800 w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddToCart && onAddToCart(item.product)}
                            className="w-6 h-6 rounded bg-orange-500 text-white font-bold text-sm flex items-center justify-center shadow-xs active:bg-orange-600"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteFromCart && onDeleteFromCart(item.product.id)}
                          className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-xs font-semibold transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 mt-2 space-y-3">
                  {customerInfo && customerInfo.name && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div className="truncate">
                        <span className="font-bold text-gray-800">{customerInfo.name}</span>
                        <span className="text-gray-500 ml-1.5 font-medium">({customerInfo.phone})</span>
                        {customerInfo.note && (
                          <p className="text-[11px] text-gray-600 truncate mt-0.5">
                            Ghi chú: {customerInfo.note}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onOpenCustomerModal}
                        className="text-[11px] text-orange-600 font-bold hover:underline shrink-0 ml-2 py-0.5 px-2 bg-white rounded-md border border-gray-200 shadow-2xs"
                      >
                        Sửa
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">Tổng thanh toán:</span>
                    <span className="text-base font-extrabold text-red-600">
                      {totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {isStoreClosed ? (
                    <div className="w-full py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-xs text-center">
                      {isQrOrderDisabled
                        ? 'Nhà hàng hiện đang tạm dừng tính năng đặt món qua mã QR'
                        : 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting || cart.length === 0}
                      onClick={onConfirmOrder}
                      className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95 disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Đang gửi đơn...</span>
                        </>
                      ) : (
                        <span>Xác nhận đặt món</span>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
