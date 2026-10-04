import React from 'react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

export default function MenuCategory({ categories, cart, onAddToCart, onRemoveFromCart, isStoreClosed = false }) {

  const getItemQuantity = (productId) => {
    const found = cart.find(c => c.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-6 px-4 pb-28">
      {categories.map((cat) => (
        <section
          key={cat.category_id}
          id={`section-cat-${cat.category_id}`}
          className="space-y-3 scroll-mt-36"
        >

          <div className="py-2.5 border-b border-gray-200/80 mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full inline-block"></span>
              <span>{cat.category_name}</span>
            </h2>
            <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
              {cat.items.length} món
            </span>
          </div>

          <div className="space-y-3">
            {cat.items.map((product) => {
              const qty = getItemQuantity(product.id);

              return (
                <div
                  key={product.id}
                  className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs transition hover:shadow-xs"
                >
                  <img
                    src={product.image_url || FALLBACK_IMAGE}
                    alt={product.name}
                    className="w-24 h-24 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      {product.is_best_seller && (
                        <span className="inline-block mt-1 text-[10px] text-orange-600 font-semibold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/50">
                          Nổi bật
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-red-600 font-bold text-sm">
                        {Number(product.price).toLocaleString('vi-VN')} đ
                      </span>

                      {qty === 0 ? (
                        <button
                          type="button"
                          disabled={isStoreClosed}
                          onClick={() => onAddToCart(product)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center select-none ${
                            isStoreClosed
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                              : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
                          }`}
                        >
                          {isStoreClosed ? 'Tạm ngưng' : '+ Thêm'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(product.id)}
                            className="w-6 h-6 rounded bg-white text-gray-700 hover:text-red-500 font-bold text-xs flex items-center justify-center shadow-2xs active:bg-gray-200 transition select-none"
                            title="Giảm bớt"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-gray-800 w-4 text-center leading-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={isStoreClosed}
                            onClick={() => onAddToCart(product)}
                            className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center shadow-2xs transition select-none ${
                              isStoreClosed
                                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                                : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
                            }`}
                            title={isStoreClosed ? 'Nhà hàng đã hết giờ làm việc' : 'Tăng thêm'}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
