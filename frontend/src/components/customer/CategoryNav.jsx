import React, { useRef, useEffect } from 'react';

export default function CategoryNav({
  categories = [],
  hasBestSellers = true,
  activeCategoryId,
  onSelectCategory
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [activeCategoryId]);

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 px-4 scroll-smooth"
      >

        {hasBestSellers && (
          <button
            type="button"
            data-active={activeCategoryId === 'bestsellers'}
            onClick={() => onSelectCategory('bestsellers')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 select-none active:scale-95 ${
              activeCategoryId === 'bestsellers'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bán Chạy
          </button>
        )}

        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.category_id;
          const count = cat.items ? cat.items.length : 0;

          return (
            <button
              key={cat.category_id}
              type="button"
              data-active={isActive}
              onClick={() => onSelectCategory(cat.category_id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 select-none active:scale-95 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{cat.category_name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
