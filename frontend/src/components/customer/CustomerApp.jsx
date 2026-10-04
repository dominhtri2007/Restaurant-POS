import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import BestSellerCarousel from './BestSellerCarousel';
import MenuCategory from './MenuCategory';
import CategoryNav from './CategoryNav';
import CartFloatingBar from './CartFloatingBar';
import OrderStatusModal from './OrderStatusModal';
import CustomerInfoModal from './CustomerInfoModal';

export default function CustomerApp({ initialTableId = 1, tokenOrId = null, isScanRoute = false }) {
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isQrOrderEnabled, setIsQrOrderEnabled] = useState(true);
  const [menu, setMenu] = useState({ best_sellers: [], categories: [] });
  const [cart, setCart] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState('bestsellers');
  const [announcement, setAnnouncement] = useState('Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món • Món ăn sẽ được bếp chuẩn bị chu đáo và phục vụ tận bàn • Chúc quý khách ngon miệng!');
  const [closedAnnouncement, setClosedAnnouncement] = useState('Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai. Kính chúc quý khách một ngày tốt lành!');

  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    try {
      localStorage.removeItem('customer_info');
      sessionStorage.removeItem('customer_info');
    } catch (e) {}
  }, []);

  useEffect(() => {
    let identifier = tokenOrId;
    if (!identifier && isScanRoute) {
      identifier = initialTableId;
    }
    if (!identifier) {
      identifier = initialTableId;
    }

    const initSession = async () => {
      try {

        if (/^\d+$/.test(String(identifier))) {
          const res = await api.scanTable(identifier);
          if (res.success) {
            setSession(res.data);
            if (res.data.customer_name && res.data.customer_phone) {
              setCustomerInfo((prev) => prev || {
                name: res.data.customer_name,
                phone: res.data.customer_phone,
                note: res.data.note || ''
              });
            }
            socket.emit('join_table', res.data.table_id);

            if (res.data.session_token) {
              window.history.replaceState(null, '', `/table/${res.data.session_token}`);
            }
          } else {
            setSessionError(res.message || 'Không thể mở bàn.');
          }
        } else {

          const res = await api.getSessionByToken(identifier);
          if (res.success) {
            setSession(res.data);
            if (res.data.customer_name && res.data.customer_phone) {
              setCustomerInfo((prev) => prev || {
                name: res.data.customer_name,
                phone: res.data.customer_phone,
                note: res.data.note || ''
              });
            }
            socket.emit('join_table', res.data.table_id);
          } else {
            setSessionError(res.message || 'Vui lòng quét lại mã QR tại bàn!');
          }
        }
      } catch (err) {
        setSessionError('Không thể kết nối máy chủ. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [tokenOrId, initialTableId, isScanRoute]);

  useEffect(() => {
    const fetchMenu = () => {
      api.getMenu().then((res) => {
        if (res.success) setMenu(res.data);
      }).catch(console.error);
    };

    fetchMenu();

    socket.on('menu_updated', fetchMenu);
    return () => {
      socket.off('menu_updated', fetchMenu);
    };
  }, []);
  useEffect(() => {
    api.getStoreStatus().then((res) => {
      if (res.success && res.data) {
        setIsStoreOpen(Boolean(res.data.is_open));
        if (res.data.announcement) setAnnouncement(res.data.announcement);
        if (res.data.closed_announcement) setClosedAnnouncement(res.data.closed_announcement);
        if (typeof res.data.enable_qr_order !== 'undefined') {
          setIsQrOrderEnabled(res.data.enable_qr_order !== false && res.data.enable_qr_order !== 'false');
        }
      }
    }).catch(console.error);
    const onPosStatus = (data) => {
      setIsStoreOpen(Boolean(data.is_open));
    };
    const onAnnouncementUpdated = (data) => {
      if (data && data.announcement) setAnnouncement(data.announcement);
      if (data && data.closed_announcement) setClosedAnnouncement(data.closed_announcement);
    };
    const onSettingsUpdated = (data) => {
      if (data && typeof data.enable_qr_order !== 'undefined') {
        setIsQrOrderEnabled(data.enable_qr_order !== false && data.enable_qr_order !== 'false');
      }
    };
    socket.on('pos_status_changed', onPosStatus);
    socket.on('announcement_updated', onAnnouncementUpdated);
    socket.on('settings_updated', onSettingsUpdated);
    return () => {
      socket.off('pos_status_changed', onPosStatus);
      socket.off('announcement_updated', onAnnouncementUpdated);
      socket.off('settings_updated', onSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    const onApproved = (data) => {
      if (session && Number(data.table_id) === Number(session.table_id)) setOrderStatus('PREPARING');
    };
    const onRejected = (data) => {
      if (session && Number(data.table_id) === Number(session.table_id)) setOrderStatus('CANCELLED');
    };
    const onTableCleared = (data) => {
      if (session && (Number(data.table_id) === Number(session.table_id) || Number(data.session_id) === Number(session.session_id))) {
        setIsSessionEnded(true);
        setCart([]);
        setOrderStatus(null);
        try {
          localStorage.removeItem('customer_info');
          sessionStorage.removeItem('customer_info');
        } catch (e) {}

        if (session.table_id) {
          window.history.replaceState(null, '', `/scan/${session.table_id}`);
        }
      }
    };

    socket.on('order_approved', onApproved);
    socket.on('order_rejected', onRejected);
    socket.on('table_cleared', onTableCleared);
    return () => {
      socket.off('order_approved', onApproved);
      socket.off('order_rejected', onRejected);
      socket.off('table_cleared', onTableCleared);
    };
  }, [session]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 130;

      if (menu.categories && menu.categories.length > 0) {
        for (let i = menu.categories.length - 1; i >= 0; i--) {
          const cat = menu.categories[i];
          const el = document.getElementById(`section-cat-${cat.category_id}`);
          if (el && el.offsetTop <= scrollPosition) {
            setActiveCategoryId(cat.category_id);
            return;
          }
        }
      }

      if (menu.best_sellers && menu.best_sellers.length > 0) {
        setActiveCategoryId('bestsellers');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menu]);

  const handleSelectCategory = (catId) => {
    setActiveCategoryId(catId);
    const targetId = catId === 'bestsellers' ? 'section-bestsellers' : `section-cat-${catId}`;
    const el = document.getElementById(targetId);
    if (el) {
      const topBar = document.getElementById('customer-sticky-header');
      const headerHeight = topBar ? topBar.offsetHeight : 125;
      const y = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product) => {
    if (!isStoreOpen) {
      alert('Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai!');
      return;
    }
    if (!isQrOrderEnabled) {
      alert('Nhà hàng hiện đang tạm dừng tính năng đặt món bằng mã QR. Quý khách vui lòng gọi nhân viên phục vụ!');
      return;
    }
    setCart((prev) => {
      const exist = prev.find((i) => i.product.id === product.id);
      if (exist) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };
  const handleRemoveFromCart = (productId) => {
    setCart((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter((i) => i.quantity > 0)
    );
  };
  const handleDeleteFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };
  const handleClearCart = () => {
    setCart([]);
    setOrderStatus(null);
  };
  const executeCreateOrder = async (info) => {
    if (!session || cart.length === 0) return;
    if (!isStoreOpen) {
      alert('Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai!');
      return;
    }
    if (!isQrOrderEnabled) {
      alert('Nhà hàng hiện đang tạm dừng tính năng đặt món bằng mã QR. Quý khách vui lòng gọi nhân viên phục vụ!');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        session_token: session.session_token,
        session_id: session.session_id,
        table_id: session.table_id,
        customer_name: info?.name || null,
        customer_phone: info?.phone || null,
        note: info?.note || null,
        items: cart.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity
        }))
      };
      const res = await api.createOrder(payload);
      if (res.success) {
        setOrderStatus('CONFIRMED');
      } else {
        alert(res.message || 'Lỗi gửi order');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInitiateOrder = () => {
    if (cart.length === 0 || isSubmitting) return;
    if (!isStoreOpen) {
      alert('Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai!');
      return;
    }
    if (!isQrOrderEnabled) {
      alert('Nhà hàng hiện đang tạm dừng tính năng đặt món bằng mã QR. Quý khách vui lòng gọi nhân viên phục vụ!');
      return;
    }
    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      setIsCustomerModalOpen(true);
      return;
    }
    executeCreateOrder(customerInfo);
  };

  const handleCustomerSubmit = async (info) => {

    setCustomerInfo(info);
    setIsCustomerModalOpen(false);

    await executeCreateOrder(info);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-xs">Đang tải Menu...</p>
        </div>
      </div>
    );
  }

  if (isSessionEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-xl border border-gray-100 animate-slide-up">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 border border-emerald-200 font-bold">
            ✓
          </div>
          <h2 className="text-base font-extrabold text-gray-800 mb-2">Thanks!</h2>
          <p className="text-xs text-gray-600 leading-relaxed mb-6">
            Hoá đơn đã được thanh toán. Cảm ơn quý khách đã dùng bữa tại nhà hàng!
          </p>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = session?.table_id ? `/scan/${session.table_id}` : '/';
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
            >
              Gọi Món
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 border border-red-200 font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-2">Thông Báo Phiên Bàn</h2>
          <p className="text-xs text-gray-600 leading-relaxed mb-6">{sessionError}</p>
          <a
            href="/"
            className="w-full inline-block py-3 bg-gray-900 text-white font-bold text-xs rounded-xl no-underline"
          >
            Trang Chủ Nhà Hàng
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 max-w-md mx-auto shadow-2xl relative font-sans">
      {!isStoreOpen && (
        <div className="bg-red-600 text-white text-xs py-2 px-4 text-center font-bold sticky top-0 z-40 shadow-sm flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/80 shrink-0"></span>
          <span>Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai (Tạm ngưng nhận đơn)</span>
        </div>
      )}
      {isStoreOpen && !isQrOrderEnabled && (
        <div className="bg-amber-600 text-white text-xs py-2 px-4 text-center font-bold sticky top-0 z-40 shadow-sm flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/80 shrink-0"></span>
          <span>Nhà hàng đang tạm dừng đặt món qua QR. Quý khách vui lòng gọi nhân viên để được phục vụ!</span>
        </div>
      )}
      <div id="customer-sticky-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-2xs">
        <header className="px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/50">
              QR ORDER
            </span>
            <h1 className="text-base font-extrabold text-gray-900 mt-0.5">{session ? session.table_name : 'Bàn Gọi Món'}</h1>
          </div>
          {!isStoreOpen ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium border border-gray-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Tạm ngưng phục vụ
            </div>
          ) : !isQrOrderEnabled ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Tạm dừng order QR
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-semibold border border-green-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Đang phục vụ
            </div>
          )}
        </header>
        <div className="bg-orange-50/90 border-t border-b border-orange-200/60 text-orange-950 text-[11px] py-1.5 px-3 flex items-center overflow-hidden">
          <div className="flex items-center gap-1.5 font-bold text-orange-800 shrink-0 pr-2 border-r border-orange-200 select-none">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${isStoreOpen ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span className="text-[10px] uppercase tracking-wider">Thông báo:</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap flex-1 ml-2">
            <div className="animate-marquee font-medium text-orange-900">
              {isStoreOpen
                ? (announcement || 'Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món • Món ăn sẽ được bếp chuẩn bị chu đáo và phục vụ tận bàn • Chúc quý khách ngon miệng!')
                : (closedAnnouncement || 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai. Kính chúc quý khách một ngày tốt lành!')}
            </div>
          </div>
        </div>
        <CategoryNav
          categories={menu.categories}
          hasBestSellers={menu.best_sellers && menu.best_sellers.length > 0}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
        />
      </div>
      <main className="pt-3">
        <BestSellerCarousel
          bestSellers={menu.best_sellers}
          onAddToCart={handleAddToCart}
          isStoreClosed={!isStoreOpen || !isQrOrderEnabled}
        />
        <MenuCategory
          categories={menu.categories}
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          isStoreClosed={!isStoreOpen || !isQrOrderEnabled}
        />
      </main>
      <CartFloatingBar
        cart={cart}
        onOpenCartModal={() => setIsModalOpen(true)}
        isStoreClosed={!isStoreOpen || !isQrOrderEnabled}
        isQrOrderDisabled={!isQrOrderEnabled}
      />
      <OrderStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cart={cart}
        orderStatus={orderStatus}
        onConfirmOrder={handleInitiateOrder}
        isSubmitting={isSubmitting}
        onClearCart={handleClearCart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onDeleteFromCart={handleDeleteFromCart}
        customerInfo={customerInfo}
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        isStoreClosed={!isStoreOpen || !isQrOrderEnabled}
        isQrOrderDisabled={!isQrOrderEnabled}
      />

      <CustomerInfoModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleCustomerSubmit}
        initialData={customerInfo}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
