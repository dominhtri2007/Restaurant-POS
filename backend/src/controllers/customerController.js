const crypto = require('crypto');
const db = require('../config/db');

const generateSessionToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

exports.scanTable = async (req, res) => {
  const tableId = parseInt(req.params.table_id, 10);
  if (isNaN(tableId) || tableId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã bàn không hợp lệ.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [tables] = await connection.query(
      'SELECT id, name, status, current_session_id FROM `tables` WHERE id = ? FOR UPDATE',
      [tableId]
    );

    if (tables.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại.' });
    }

    const table = tables[0];
    let sessionId = table.current_session_id;
    let sessionToken = null;

    if (sessionId) {
      const [existingSession] = await connection.query(
        'SELECT id, session_token, customer_name, customer_phone, note, status FROM `table_sessions` WHERE id = ? AND status = "ACTIVE"',
        [sessionId]
      );
      if (existingSession.length > 0) {
        sessionToken = existingSession[0].session_token;
        if (!sessionToken) {
          sessionToken = generateSessionToken();
          await connection.query('UPDATE `table_sessions` SET session_token = ? WHERE id = ?', [sessionToken, sessionId]);
        }
      } else {
        sessionId = null;
      }
    }

    if (!sessionId || table.status === 'EMPTY') {
      sessionToken = generateSessionToken();
      const [sessionResult] = await connection.query(
        'INSERT INTO `table_sessions` (table_id, session_token, status) VALUES (?, ?, "ACTIVE")',
        [tableId, sessionToken]
      );
      sessionId = sessionResult.insertId;

      await connection.query(
        'UPDATE `tables` SET status = "IN_USE", current_session_id = ? WHERE id = ?',
        [sessionId, tableId]
      );

      if (req.io) {
        req.io.emit('table_status_changed', {
          table_id: tableId,
          table_name: table.name,
          status: 'IN_USE',
          session_id: sessionId
        });
      }
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      data: {
        table_id: Number(table.id),
        table_name: table.name,
        session_id: sessionId,
        session_token: sessionToken,
        status: 'IN_USE'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('scanTable error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi quét bàn.' });
  } finally {
    connection.release();
  }
};

exports.getSessionByToken = async (req, res) => {
  const { token } = req.params;
  if (!token || typeof token !== 'string' || !/^[a-zA-Z0-9_-]{16,64}$/.test(token.trim())) {
    return res.status(400).json({ success: false, message: 'Mã phiên (token) không hợp lệ.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT s.id AS session_id, s.session_token, s.table_id, s.customer_name, s.customer_phone, s.note, s.status AS session_status,
              t.name AS table_name, t.status AS table_status
       FROM table_sessions s JOIN tables t ON s.table_id = t.id
       WHERE s.session_token = ? LIMIT 1`,
      [token.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Phiên gọi món không tồn tại. Vui lòng quét lại mã QR tại bàn!' });
    }

    const s = rows[0];
    if (s.session_status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        is_closed: true,
        message: 'Phiên của bàn này đã thanh toán xong. Vui lòng quét lại mã QR tại bàn để bắt đầu phiên mới!'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        table_id: s.table_id,
        table_name: s.table_name,
        session_id: s.session_id,
        session_token: s.session_token,
        customer_name: s.customer_name,
        customer_phone: s.customer_phone,
        note: s.note,
        status: s.table_status
      }
    });
  } catch (error) {
    console.error('getSessionByToken error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi xác thực phiên bàn.' });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT id, name FROM `categories` ORDER BY id ASC');
    const [products] = await db.query(
      'SELECT id, category_id, name, price, image_url, is_best_seller, is_available FROM `products` WHERE is_available = TRUE ORDER BY id ASC'
    );

    const bestSellers = products.filter(p => Boolean(p.is_best_seller));
    const categorizedMenu = categories.map(cat => ({
      category_id: cat.id,
      category_name: cat.name,
      items: products.filter(p => p.category_id === cat.id)
    }));

    return res.status(200).json({
      success: true,
      data: {
        best_sellers: bestSellers,
        categories: categorizedMenu
      }
    });
  } catch (error) {
    console.error('getMenu error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tải thực đơn.' });
  }
};

exports.createOrder = async (req, res) => {
  const { session_token, session_id, table_id, items, customer_name, customer_phone, note } = req.body;

  if (!session_token || typeof session_token !== 'string' || !/^[a-zA-Z0-9_-]{16,64}$/.test(session_token.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Mã phiên gọi món không hợp lệ hoặc đã hết hạn. Vui lòng quét lại mã QR tại bàn!'
    });
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ success: false, message: 'Danh sách món không hợp lệ (tối đa 50 món).' });
  }

  for (const it of items) {
    const pId = parseInt(it.product_id, 10);
    const qty = parseInt(it.quantity, 10);
    if (isNaN(pId) || pId <= 0 || isNaN(qty) || qty <= 0 || qty > 50) {
      return res.status(400).json({ success: false, message: 'Thông tin món hoặc số lượng không hợp lệ (1-50 món mỗi loại).' });
    }
  }

  const productIds = [...new Set(items.map((it) => parseInt(it.product_id, 10)))];
  if (productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách món ăn trống.' });
  }

  const cleanCustomerName = customer_name ? String(customer_name).trim().slice(0, 100) : null;
  const cleanCustomerPhone = customer_phone ? String(customer_phone).trim().slice(0, 20) : null;
  const cleanNote = note ? String(note).trim().slice(0, 500) : null;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [qrRows] = await connection.query("SELECT `value` FROM `restaurant_settings` WHERE `key` = 'enable_qr_order' LIMIT 1");
    if (qrRows.length > 0 && qrRows[0].value === 'false') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Nhà hàng hiện đang tạm dừng tính năng đặt món bằng mã QR. Quý khách vui lòng gọi nhân viên phục vụ!' });
    }
    const [sessionRows] = await connection.query(
      'SELECT s.id, s.table_id, s.status, t.name AS table_name FROM table_sessions s JOIN tables t ON s.table_id = t.id WHERE s.session_token = ? AND s.status = "ACTIVE" FOR UPDATE',
      [session_token.trim()]
    );

    if (sessionRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Phiên gọi món đã kết thúc hoặc không hợp lệ. Quý khách vui lòng quét lại mã QR tại bàn!'
      });
    }

    const currentSession = sessionRows[0];
    if (table_id && parseInt(table_id, 10) !== currentSession.table_id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Dữ liệu bàn không khớp với phiên làm việc hiện tại.' });
    }
    if (session_id && parseInt(session_id, 10) !== currentSession.id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Dữ liệu phiên không khớp.' });
    }

    const verifiedTableId = currentSession.table_id;
    const verifiedSessionId = currentSession.id;
    const tableName = currentSession.table_name || `Bàn ${verifiedTableId}`;

    if (cleanCustomerPhone) {
      try {
        await connection.query(
          `INSERT INTO \`customers\` (\`name\`, \`phone\`, \`note\`)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             \`name\` = VALUES(\`name\`),
             \`note\` = COALESCE(VALUES(\`note\`), \`note\`),
             \`updated_at\` = NOW()`,
          [cleanCustomerName || 'Khách hàng', cleanCustomerPhone, cleanNote]
        );
      } catch (custErr) {
        console.warn('[createOrder] Upsert customer notice:', custErr.message);
      }
    }

    if (cleanCustomerName || cleanCustomerPhone || cleanNote) {
      try {
        await connection.query(
          'UPDATE `table_sessions` SET `customer_name` = COALESCE(?, `customer_name`), `customer_phone` = COALESCE(?, `customer_phone`), `note` = COALESCE(?, `note`) WHERE `id` = ?',
          [cleanCustomerName, cleanCustomerPhone, cleanNote, verifiedSessionId]
        );
      } catch (sessErr) {
        console.warn('[createOrder] Update table_sessions notice:', sessErr.message);
      }
    }

    const [dbProducts] = await connection.query(
      'SELECT id, name, price, is_available FROM products WHERE id IN (?)',
      [productIds]
    );

    const productMap = new Map();
    dbProducts.forEach(p => productMap.set(p.id, p));

    let calculatedTotal = 0;
    const verifiedOrderItems = [];

    for (const it of items) {
      const pId = parseInt(it.product_id, 10);
      const qty = parseInt(it.quantity, 10);
      const prod = productMap.get(pId);

      if (!prod || !prod.is_available) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Món "${prod ? prod.name : 'không xác định'}" hiện đã hết hàng.`
        });
      }

      const unitPrice = Number(prod.price);
      calculatedTotal += unitPrice * qty;

      verifiedOrderItems.push({
        product_id: prod.id,
        product_name: prod.name,
        quantity: qty,
        price: unitPrice
      });
    }

    const [shifts] = await connection.query(
      'SELECT id, status, current_order_seq FROM pos_shifts ORDER BY id DESC LIMIT 1 FOR UPDATE'
    );
    let currentShift = shifts[0];
    if (!currentShift) {
      const [newShiftResult] = await connection.query(
        'INSERT INTO pos_shifts (shift_number, status, current_order_seq, opened_at, opened_by) VALUES (1, "OPEN", 0, NOW(), "system")'
      );
      currentShift = { id: newShiftResult.insertId, status: 'OPEN', current_order_seq: 0 };
    }
    if (currentShift.status !== 'OPEN') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai!'
      });
    }

    const nextDailyOrderNumber = (currentShift.current_order_seq || 0) + 1;
    await connection.query(
      'UPDATE pos_shifts SET current_order_seq = ? WHERE id = ?',
      [nextDailyOrderNumber, currentShift.id]
    );

    const [orderResult] = await connection.query(
      'INSERT INTO `orders` (session_id, table_id, daily_order_number, customer_name, customer_phone, note, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, "SERVED")',
      [verifiedSessionId, verifiedTableId, nextDailyOrderNumber, cleanCustomerName, cleanCustomerPhone, cleanNote, calculatedTotal]
    );
    const orderId = orderResult.insertId;

    const orderItemsValues = verifiedOrderItems.map(it => [orderId, it.product_id, it.quantity, it.price, 'DONE']);
    await connection.query(
      'INSERT INTO `order_items` (order_id, product_id, quantity, price, status) VALUES ?',
      [orderItemsValues]
    );

    await connection.commit();

    const orderPayload = {
      id: orderId,
      order_id: orderId,
      daily_order_number: nextDailyOrderNumber,
      order_number: nextDailyOrderNumber,
      session_id: verifiedSessionId,
      table_id: verifiedTableId,
      table_name: tableName,
      customer_name: cleanCustomerName,
      customer_phone: cleanCustomerPhone,
      note: cleanNote,
      total_amount: calculatedTotal,
      status: 'SERVED',
      created_at: new Date(),
      items: verifiedOrderItems
    };

    if (req.io) {
      req.io.emit('new_order', orderPayload);
      req.io.emit('table_status_changed', { table_id: verifiedTableId, status: 'IN_USE' });
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt món thành công! Nhà hàng đang chuẩn bị phục vụ quý khách.',
      data: orderPayload
    });
  } catch (error) {
    await connection.rollback();
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tạo đơn hàng.' });
  } finally {
    connection.release();
  }
};

exports.getStoreStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, shift_number, status, current_order_seq, opened_at, closed_at FROM pos_shifts ORDER BY id DESC LIMIT 1'
    );
    const shift = rows[0] || { status: 'OPEN', current_order_seq: 0, shift_number: 1 };

    let announcement = 'Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món • Món ăn sẽ được bếp chuẩn bị chu đáo và phục vụ tận bàn • Chúc quý khách ngon miệng!';
    let closedAnnouncement = 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai. Kính chúc quý khách một ngày tốt lành!';
    let enableQrOrder = true;
    let enableStaffOrder = true;
    try {
      const [settingRows] = await db.query(
        "SELECT `key`, `value` FROM `restaurant_settings` WHERE `key` IN ('announcement', 'closed_announcement', 'enable_qr_order', 'enable_staff_order')"
      );
      settingRows.forEach((r) => {
        if (r.key === 'announcement') announcement = r.value;
        if (r.key === 'closed_announcement') closedAnnouncement = r.value;
        if (r.key === 'enable_qr_order') enableQrOrder = r.value !== 'false';
        if (r.key === 'enable_staff_order') enableStaffOrder = r.value !== 'false';
      });
    } catch (_) {}
    return res.json({
      success: true,
      data: {
        is_open: shift.status === 'OPEN',
        status: shift.status,
        shift_id: shift.id,
        shift_number: shift.shift_number,
        current_order_seq: shift.current_order_seq,
        opened_at: shift.opened_at,
        closed_at: shift.closed_at,
        announcement,
        closed_announcement: closedAnnouncement,
        enable_qr_order: enableQrOrder,
        enable_staff_order: enableStaffOrder
      }
    });
  } catch (err) {
    console.error('getStoreStatus error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái máy.' });
  }
};

exports.getAnnouncement = async (req, res) => {
  try {
    const settings = {
      announcement: 'Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món • Món ăn sẽ được bếp chuẩn bị chu đáo và phục vụ tận bàn • Chúc quý khách ngon miệng!',
      closed_announcement: 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai. Kính chúc quý khách một ngày tốt lành!'
    };
    try {
      const [rows] = await db.query(
        "SELECT `key`, `value` FROM `restaurant_settings` WHERE `key` IN ('announcement', 'closed_announcement')"
      );
      rows.forEach((r) => {
        settings[r.key] = r.value;
      });
    } catch (_) {}

    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error('getAnnouncement error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải thông báo.' });
  }
};
