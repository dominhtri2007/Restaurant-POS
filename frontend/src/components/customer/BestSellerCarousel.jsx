import React, { useRef, useState } from 'react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

export default function BestSellerCarousel({ bestSellers, onAddToCart, isStoreClosed = false }) {
  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  if (!bestSellers || bestSellers.length === 0) return null;

  const scrollByAmount = (offset) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleWheel = (e) => {
    if (carouselRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      carouselRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
    setHasScrolled(true);
  };

  return (
    <div id="section-bestsellers" className="mb-6 scroll-mt-28">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
          Món Bán Chạy Nhất
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">
            Gợi ý hôm nay
          </span>

          <div className="hidden sm:flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => scrollByAmount(-220)}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition select-none"
              title="Lướt sang trái"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(220)}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition select-none"
              title="Lướt sang phải"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div
        ref={carouselRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        {bestSellers.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-56 sm:w-60 bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden snap-start transition active:scale-98"
          >
            <div className="relative h-32 w-full bg-gray-100">
              <img
                src={item.image_url || FALLBACK_IMAGE}
                alt={item.name}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <span className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                BEST SELLER
              </span>
            </div>

            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-red-600 font-bold text-sm">
                  {Number(item.price).toLocaleString('vi-VN')} đ
                </span>
                <button
                  type="button"
                  disabled={isStoreClosed}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(item);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition select-none ${
                    isStoreClosed
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-90'
                  }`}
                  title={isStoreClosed ? 'Nhà hàng đã hết giờ làm việc' : 'Thêm vào giỏ'}
                >
                  <span className="text-base font-bold select-none leading-none" style={{ marginTop: '-1px' }}>+</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
