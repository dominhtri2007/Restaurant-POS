const db = require('../config/db');
const { hashPassword } = require('../utils/auth');
const QRCode = require('qrcode');

exports.getTables = async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.name, t.status, t.current_session_id, s.start_time,
        COALESCE((SELECT SUM(o.total_amount) FROM orders o WHERE o.session_id = t.current_session_id AND o.status != 'CANCELLED'), 0) AS current_total,
        EXISTS(SELECT 1 FROM orders o WHERE o.session_id = t.current_session_id AND o.status = 'SERVED') AS has_served,
        EXISTS(SELECT 1 FROM orders o WHERE o.session_id = t.current_session_id AND o.status IN ('PENDING_APPROVAL', 'PREPARING')) AS has_in_progress
      FROM tables t
      LEFT JOIN table_sessions s ON t.current_session_id = s.id
      ORDER BY t.id ASC
    `;
    const [tables] = await db.query(query);

    const formattedTables = tables.map(tb => {
      let displayStatus = tb.status;
      if (tb.status === 'IN_USE' && tb.has_served && !tb.has_in_progress) {
        displayStatus = 'SERVED';
      }
      return { ...tb, displayStatus, current_total: Number(tb.current_total) };
    });

    return res.status(200).json({ success: true, data: formattedTables });
  } catch (error) {
    console.error('getTables error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tải danh sách bàn.' });
  }
};

exports.getPendingOrders = async (req, res) => {
  return res.status(200).json({ success: true, data: [] });
};

exports.approveOrder = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Đã xác nhận đơn hàng!' });
};

exports.rejectOrder = async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId) || orderId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
  }

  try {
    const [orders] = await db.query('SELECT id, table_id, session_id FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });

    await db.query('UPDATE orders SET status = "CANCELLED" WHERE id = ?', [orderId]);
    const orderData = { order_id: orderId, table_id: orders[0].table_id, session_id: orders[0].session_id, status: 'CANCELLED' };

    if (req.io) {
      req.io.emit('order_rejected', orderData);
      req.io.emit('table_status_changed', { table_id: orders[0].table_id });
    }

    return res.status(200).json({ success: true, message: 'Đã hủy đơn hàng.', data: orderData });
  } catch (error) {
    console.error('rejectOrder error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi hủy đơn hàng.' });
  }
};

exports.markTableAllServed = async (req, res) => {
  const tableId = parseInt(req.params.id, 10);
  if (isNaN(tableId) || tableId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã bàn không hợp lệ.' });
  }

  try {
    const [tables] = await db.query('SELECT id, current_session_id FROM tables WHERE id = ?', [tableId]);
    if (tables.length === 0) return res.status(404).json({ success: false, message: 'Bàn không tồn tại.' });

    const sessionId = tables[0].current_session_id;
    if (sessionId) {
      await db.query('UPDATE orders SET status = "SERVED" WHERE session_id = ? AND status = "PREPARING"', [sessionId]);
    }

    if (req.io) {
      req.io.emit('table_status_changed', { table_id: tableId, status: 'SERVED' });
    }

    return res.status(200).json({ success: true, message: 'Đã cập nhật: Bếp đã lên đủ món!' });
  } catch (error) {
    console.error('markTableAllServed error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi cập nhật trạng thái bàn.' });
  }
};

exports.clearTable = async (req, res) => {
  const tableId = parseInt(req.params.id, 10);
  if (isNaN(tableId) || tableId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã bàn không hợp lệ.' });
  }

  const requestedPaymentMethod = req.body?.payment_method;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [tables] = await connection.query('SELECT * FROM tables WHERE id = ? FOR UPDATE', [tableId]);
    if (tables.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại.' });
    }

    const table = tables[0];
    let sessionId = table.current_session_id;
    let totalPaid = 0;

    if (!sessionId) {
      const [recentSessions] = await connection.query(
        'SELECT id FROM table_sessions WHERE table_id = ? ORDER BY id DESC LIMIT 1',
        [tableId]
      );
      if (recentSessions.length > 0) {
        sessionId = recentSessions[0].id;
      }
    }

    if (sessionId) {
      const [sumResult] = await connection.query(
        'SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE session_id = ? AND status != "CANCELLED"',
        [sessionId]
      );
      totalPaid = Number(sumResult[0].total);

      const finalPaymentMethod = requestedPaymentMethod || 'CASH';

      await connection.query(
        'UPDATE table_sessions SET status = "CLOSED", end_time = COALESCE(end_time, NOW()), payment_method = ? WHERE id = ?',
        [finalPaymentMethod, sessionId]
      );
      await connection.query('UPDATE orders SET status = "COMPLETED" WHERE session_id = ? AND status != "CANCELLED"', [sessionId]);
    }

    if (totalPaid === 0 && req.body) {
      const passedAmount = Number(req.body.total_amount || req.body.amount);
      if (!isNaN(passedAmount) && passedAmount > 0) {
        totalPaid = passedAmount;
      }
    }

    await connection.query('UPDATE tables SET status = "EMPTY", current_session_id = NULL WHERE id = ?', [tableId]);
    await connection.commit();

    const resultData = { table_id: tableId, table_name: table.name, total_paid: totalPaid, status: 'EMPTY' };

    if (req.io) {
      req.io.emit('table_cleared', resultData);
      req.io.emit('table_status_changed', resultData);
    }

    return res.status(200).json({
      success: true,
      message: `Đã dọn bàn ${table.name} thành công. Tổng tiền: ${totalPaid.toLocaleString('vi-VN')} đ`,
      data: resultData
    });
  } catch (error) {
    await connection.rollback();
    console.error('clearTable error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi dọn bàn.' });
  } finally {
    connection.release();
  }
};

exports.getTableOrders = async (req, res) => {
  const tableId = parseInt(req.params.id, 10);
  if (isNaN(tableId) || tableId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã bàn không hợp lệ.' });
  }

  try {
    const [tables] = await db.query(
      `SELECT t.id, t.name, t.status, t.current_session_id, s.start_time, s.session_token
       FROM tables t
       LEFT JOIN table_sessions s ON t.current_session_id = s.id
       WHERE t.id = ?`,
      [tableId]
    );

    if (tables.length === 0) {
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại.' });
    }

    const table = tables[0];
    let orders = [];
    let itemsSummary = [];
    let allItems = [];

    if (table.current_session_id) {
      const [orderRows] = await db.query(
        `SELECT id, customer_name, staff_name, order_source, customer_phone, note, total_amount, status, created_at
         FROM orders
         WHERE session_id = ? AND status != 'CANCELLED'
         ORDER BY id ASC`,
        [table.current_session_id]
      );

      for (const order of orderRows) {
        const [items] = await db.query(
          `SELECT oi.id, oi.order_id, oi.product_id, p.name AS product_name, p.image_url, oi.quantity, oi.price, (oi.quantity * oi.price) AS total_price, COALESCE(oi.status, 'PENDING') AS status
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );
        order.items = items;
      }
      orders = orderRows;

      const [summary] = await db.query(
        `SELECT oi.product_id, p.name AS product_name, p.image_url,
                SUM(oi.quantity) AS total_quantity,
                oi.price,
                SUM(oi.quantity * oi.price) AS line_total,
                o.status AS order_status
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.session_id = ? AND o.status != 'CANCELLED'
         GROUP BY oi.product_id, p.name, p.image_url, oi.price, o.status
         ORDER BY p.name ASC`,
        [table.current_session_id]
      );
      itemsSummary = summary;

      const [allItemRows] = await db.query(
        `SELECT oi.id, oi.order_id, oi.product_id, p.name AS product_name, p.image_url,
                oi.quantity, oi.price, (oi.quantity * oi.price) AS total_price,
                COALESCE(oi.status, 'PENDING') AS status,
                o.created_at AS order_time,
                o.status AS order_status
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.session_id = ? AND o.status != 'CANCELLED'
         ORDER BY oi.id ASC`,
        [table.current_session_id]
      );
      allItems = allItemRows;
    }

    return res.status(200).json({
      success: true,
      data: {
        table,
        orders,
        itemsSummary,
        allItems
      }
    });
  } catch (error) {
    console.error('getTableOrders error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tải danh sách món của bàn.' });
  }
};

exports.addTableItem = async (req, res) => {
  const tableId = parseInt(req.params.id, 10);
  const { product_id, quantity = 1, price, status = 'DONE' } = req.body;

  if (isNaN(tableId) || tableId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã bàn không hợp lệ.' });
  }
  const cleanProductId = parseInt(product_id, 10);
  const cleanQuantity = parseInt(quantity, 10);
  if (isNaN(cleanProductId) || cleanProductId <= 0) {
    return res.status(400).json({ success: false, message: 'Món ăn không hợp lệ.' });
  }
  if (isNaN(cleanQuantity) || cleanQuantity <= 0) {
    return res.status(400).json({ success: false, message: 'Số lượng món phải lớn hơn 0.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [tables] = await connection.query('SELECT * FROM tables WHERE id = ? FOR UPDATE', [tableId]);
    if (tables.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại.' });
    }
    const table = tables[0];

    const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [cleanProductId]);
    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
    }
    const product = products[0];
    const itemPrice = price !== undefined && !isNaN(parseFloat(price)) ? parseFloat(price) : parseFloat(product.price);
    const itemStatus = status === 'PENDING' ? 'PENDING' : 'DONE';

    let sessionId = table.current_session_id;
    if (!sessionId) {
      const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const [sessResult] = await connection.query(
        'INSERT INTO `table_sessions` (table_id, session_token, status) VALUES (?, ?, "ACTIVE")',
        [tableId, sessionToken]
      );
      sessionId = sessResult.insertId;
      await connection.query('UPDATE tables SET status = "IN_USE", current_session_id = ? WHERE id = ?', [sessionId, tableId]);
    }

    let targetOrder = null;
    if (itemStatus === 'PENDING') {
      const [prepOrders] = await connection.query(
        'SELECT id, status FROM orders WHERE session_id = ? AND status = "PREPARING" ORDER BY id DESC LIMIT 1',
        [sessionId]
      );
      if (prepOrders.length > 0) {
        targetOrder = prepOrders[0];
      }
    } else {
      const [activeOrders] = await connection.query(
        'SELECT id, status FROM orders WHERE session_id = ? AND status IN ("SERVED", "PREPARING", "PENDING_APPROVAL") ORDER BY id DESC LIMIT 1',
        [sessionId]
      );
      if (activeOrders.length > 0) {
        targetOrder = activeOrders[0];
      }
    }

    let orderId;
    if (targetOrder) {
      orderId = targetOrder.id;
    } else {
      const initialOrderStatus = itemStatus === 'PENDING' ? 'PREPARING' : 'SERVED';
      const staffName = req.user?.full_name || req.user?.username || 'Thu ngân';
      const [newOrder] = await connection.query(
        'INSERT INTO orders (session_id, table_id, customer_name, staff_name, order_source, total_amount, status) VALUES (?, ?, NULL, ?, "STAFF", 0, ?)',
        [sessionId, tableId, staffName, initialOrderStatus]
      );
      orderId = newOrder.insertId;
    }

    const [insertResult] = await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price, status) VALUES (?, ?, ?, ?, ?)',
      [orderId, cleanProductId, cleanQuantity, itemPrice, itemStatus]
    );

    const [totalRes] = await connection.query(
      'SELECT COALESCE(SUM(quantity * price), 0) AS total FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const newTotal = Number(totalRes[0].total);
    await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [newTotal, orderId]);

    await connection.query('UPDATE tables SET status = "IN_USE" WHERE id = ? AND status = "EMPTY"', [tableId]);

    await connection.commit();

    if (req.io) {
      req.io.emit('table_status_changed', { table_id: tableId });
      req.io.emit('kitchen_order_updated', { table_id: tableId, order_id: orderId });
    }

    return res.status(200).json({
      success: true,
      message: `Đã thêm món "${product.name}" vào bàn thành công.`,
      data: { item_id: insertResult.insertId, order_id: orderId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('addTableItem error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi thêm món vào bàn.' });
  } finally {
    connection.release();
  }
};

exports.updateOrderItem = async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const { quantity, price, product_id, status } = req.body;

  if (isNaN(itemId) || itemId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã món không hợp lệ.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT oi.*, o.table_id, o.session_id
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.id = ? FOR UPDATE`,
      [itemId]
    );

    if (items.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Món không tồn tại.' });
    }

    const currentItem = items[0];
    const orderId = currentItem.order_id;
    const tableId = currentItem.table_id;

    if (quantity !== undefined && parseInt(quantity, 10) <= 0) {
      await connection.query('DELETE FROM order_items WHERE id = ?', [itemId]);
    } else {
      let newProductId = currentItem.product_id;
      if (product_id !== undefined) {
        const cleanPid = parseInt(product_id, 10);
        if (!isNaN(cleanPid) && cleanPid > 0) {
          const [checkProd] = await connection.query('SELECT id, price FROM products WHERE id = ?', [cleanPid]);
          if (checkProd.length > 0) {
            newProductId = cleanPid;
          }
        }
      }

      let newQuantity = currentItem.quantity;
      if (quantity !== undefined) {
        const cleanQty = parseInt(quantity, 10);
        if (!isNaN(cleanQty) && cleanQty > 0) newQuantity = cleanQty;
      }

      let newPrice = currentItem.price;
      if (price !== undefined) {
        const cleanPrice = parseFloat(price);
        if (!isNaN(cleanPrice) && cleanPrice >= 0) newPrice = cleanPrice;
      }

      let newStatus = currentItem.status;
      if (status && (status === 'PENDING' || status === 'DONE')) {
        newStatus = status;
      }

      await connection.query(
        'UPDATE order_items SET product_id = ?, quantity = ?, price = ?, status = ? WHERE id = ?',
        [newProductId, newQuantity, newPrice, newStatus, itemId]
      );
    }

    const [totalRes] = await connection.query(
      'SELECT COALESCE(SUM(quantity * price), 0) AS total, COUNT(*) AS count FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const newTotal = Number(totalRes[0].total);
    const remainingCount = Number(totalRes[0].count);

    if (remainingCount === 0) {
      await connection.query('UPDATE orders SET status = "CANCELLED", total_amount = 0 WHERE id = ?', [orderId]);
    } else {
      await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [newTotal, orderId]);
    }

    await connection.commit();

    if (req.io) {
      req.io.emit('table_status_changed', { table_id: tableId });
      req.io.emit('kitchen_order_updated', { table_id: tableId, order_id: orderId });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật món thành công.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('updateOrderItem error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi cập nhật món.' });
  } finally {
    connection.release();
  }
};

exports.deleteOrderItem = async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId) || itemId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã món không hợp lệ.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT oi.*, o.table_id, o.session_id
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.id = ? FOR UPDATE`,
      [itemId]
    );

    if (items.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Món không tồn tại.' });
    }

    const currentItem = items[0];
    const orderId = currentItem.order_id;
    const tableId = currentItem.table_id;

    await connection.query('DELETE FROM order_items WHERE id = ?', [itemId]);

    const [totalRes] = await connection.query(
      'SELECT COALESCE(SUM(quantity * price), 0) AS total, COUNT(*) AS count FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const newTotal = Number(totalRes[0].total);
    const remainingCount = Number(totalRes[0].count);

    if (remainingCount === 0) {
      await connection.query('UPDATE orders SET status = "CANCELLED", total_amount = 0 WHERE id = ?', [orderId]);
    } else {
      await connection.query('UPDATE orders SET total_amount = ? WHERE id = ?', [newTotal, orderId]);
    }

    await connection.commit();

    if (req.io) {
      req.io.emit('table_status_changed', { table_id: tableId });
      req.io.emit('kitchen_order_updated', { table_id: tableId, order_id: orderId });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã xóa món thành công.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('deleteOrderItem error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi xóa món.' });
  } finally {
    connection.release();
  }
};

exports.getReportsSummary = async (req, res) => {
  try {
    const startDate = req.query.startDate || req.query.start_date || req.query.from_date || null;
    const endDate = req.query.endDate || req.query.end_date || req.query.to_date || null;
    const hasDateFilter = Boolean(startDate && endDate);

    const [todayResult] = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS today_revenue,
             COUNT(id) AS today_orders_count
      FROM orders
      WHERE status = 'COMPLETED'
        AND DATE(updated_at) = CURDATE()
    `);

    const [totalResult] = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total_revenue,
             COUNT(id) AS total_orders_count
      FROM orders
      WHERE status = 'COMPLETED'
    `);

    let rangeRevenue = Number(todayResult[0]?.today_revenue || 0);
    let rangeOrdersCount = Number(todayResult[0]?.today_orders_count || 0);

    if (hasDateFilter) {
      const [rangeResult] = await db.query(`
        SELECT COALESCE(SUM(total_amount), 0) AS range_revenue,
               COUNT(id) AS range_orders_count
        FROM orders
        WHERE status = 'COMPLETED'
          AND DATE(updated_at) >= ? AND DATE(updated_at) <= ?
      `, [startDate, endDate]);
      rangeRevenue = Number(rangeResult[0]?.range_revenue || 0);
      rangeOrdersCount = Number(rangeResult[0]?.range_orders_count || 0);
    }

    let dailyRevenue;
    if (hasDateFilter) {
      const [rows] = await db.query(`
        SELECT DATE_FORMAT(updated_at, '%d/%m') AS date_label,
               DATE_FORMAT(updated_at, '%d/%m/%Y') AS full_date,
               DATE(updated_at) AS order_date,
               COALESCE(SUM(total_amount), 0) AS revenue,
               COUNT(id) AS order_count
        FROM orders
        WHERE status = 'COMPLETED'
          AND DATE(updated_at) >= ? AND DATE(updated_at) <= ?
        GROUP BY DATE(updated_at), DATE_FORMAT(updated_at, '%d/%m'), DATE_FORMAT(updated_at, '%d/%m/%Y')
        ORDER BY DATE(updated_at) ASC
      `, [startDate, endDate]);
      dailyRevenue = rows;
    } else {
      const [rows] = await db.query(`
        SELECT DATE_FORMAT(updated_at, '%d/%m') AS date_label,
               DATE_FORMAT(updated_at, '%d/%m/%Y') AS full_date,
               DATE(updated_at) AS order_date,
               COALESCE(SUM(total_amount), 0) AS revenue,
               COUNT(id) AS order_count
        FROM orders
        WHERE status = 'COMPLETED'
          AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(updated_at), DATE_FORMAT(updated_at, '%d/%m'), DATE_FORMAT(updated_at, '%d/%m/%Y')
        ORDER BY DATE(updated_at) ASC
      `);
      dailyRevenue = rows;
    }

    let topProducts;
    if (hasDateFilter) {
      const [rows] = await db.query(`
        SELECT p.id, p.name, p.price,
               COALESCE(SUM(oi.quantity), 0) AS total_sold,
               COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'COMPLETED'
          AND DATE(o.updated_at) >= ? AND DATE(o.updated_at) <= ?
        GROUP BY p.id, p.name, p.price
        ORDER BY total_sold DESC
        LIMIT 50
      `, [startDate, endDate]);
      topProducts = rows;
    } else {
      const [rows] = await db.query(`
        SELECT p.id, p.name, p.price,
               COALESCE(SUM(oi.quantity), 0) AS total_sold,
               COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'COMPLETED'
        GROUP BY p.id, p.name, p.price
        ORDER BY total_sold DESC
        LIMIT 15
      `);
      topProducts = rows;
    }

    const sessionLimit = req.query.all === 'true' ? 200 : (parseInt(req.query.limit, 10) || 50);
    let recentSessions;
    if (hasDateFilter) {
      const [rows] = await db.query(`
        SELECT s.id, t.name AS table_name, s.start_time, s.end_time, s.payment_method,
               COALESCE((SELECT SUM(o.total_amount) FROM orders o WHERE o.session_id = s.id AND o.status = 'COMPLETED'), 0) AS session_total
        FROM table_sessions s
        JOIN tables t ON s.table_id = t.id
        WHERE s.status = 'CLOSED'
          AND DATE(COALESCE(s.end_time, s.start_time)) >= ? AND DATE(COALESCE(s.end_time, s.start_time)) <= ?
        ORDER BY s.end_time DESC
        LIMIT ?
      `, [startDate, endDate, sessionLimit]);
      recentSessions = rows;
    } else {
      const [rows] = await db.query(`
        SELECT s.id, t.name AS table_name, s.start_time, s.end_time, s.payment_method,
               COALESCE((SELECT SUM(o.total_amount) FROM orders o WHERE o.session_id = s.id AND o.status = 'COMPLETED'), 0) AS session_total
        FROM table_sessions s
        JOIN tables t ON s.table_id = t.id
        WHERE s.status = 'CLOSED'
        ORDER BY s.end_time DESC
        LIMIT ?
      `, [sessionLimit]);
      recentSessions = rows;
    }

    const storeInfo = {
      store_name: 'Winta Coffee & Restaurant',
      store_address: '123 Đường 3/2, Quận 10, TP. Hồ Chí Minh',
      store_phone: '0862.952.090 - 0862.952.091'
    };
    try {
      const [settingRows] = await db.query(
        "SELECT `key`, `value` FROM `restaurant_settings` WHERE `key` IN ('store_name', 'store_address', 'store_phone')"
      );
      settingRows.forEach(r => {
        storeInfo[r.key] = r.value;
      });
    } catch (e) {

    }

    return res.status(200).json({
      success: true,
      data: {
        startDate: startDate || null,
        endDate: endDate || null,
        range_revenue: rangeRevenue,
        range_orders_count: rangeOrdersCount,
        today_revenue: Number(todayResult[0]?.today_revenue || 0),
        today_orders_count: Number(todayResult[0]?.today_orders_count || 0),
        total_revenue: Number(totalResult[0]?.total_revenue || 0),
        total_orders_count: Number(totalResult[0]?.total_orders_count || 0),
        daily_revenue: dailyRevenue,
        top_products: topProducts,
        recent_sessions: recentSessions,
        store_info: storeInfo
      }
    });
  } catch (error) {
    console.error('getReportsSummary error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tạo báo cáo doanh thu.' });
  }
};

exports.getTablesWithQR = async (req, res) => {
  try {
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const clientHost = req.headers['x-forwarded-host'] || host.replace(':5000', ':3000');
    const customerBase = process.env.FRONTEND_URL || `${protocol}://${clientHost}`;

    const [tables] = await db.query('SELECT id, name, status, current_session_id FROM tables ORDER BY id ASC');

    const tablesWithQR = await Promise.all(
      tables.map(async (tb) => {
        const qrTargetUrl = `${customerBase}/scan/${tb.id}`;
        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
            width: 320,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
          });
        } catch (qrErr) {
          console.error(`QRCode generation error for table ${tb.id}:`, qrErr.message);
        }

        return {
          ...tb,
          qr_target_url: qrTargetUrl,
          qr_data_url: qrDataUrl,
          qr_image_url: qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrTargetUrl)}`
        };
      })
    );

    return res.status(200).json({ success: true, data: tablesWithQR });
  } catch (error) {
    console.error('getTablesWithQR error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tải danh sách mã QR bàn.' });
  }
};

exports.createTable = async (req, res) => {
  const { name, batch_prefix, batch_from, batch_to } = req.body;

  try {

    if (batch_prefix && batch_from !== undefined && batch_to !== undefined) {
      const from = parseInt(batch_from, 10);
      const to = parseInt(batch_to, 10);

      if (isNaN(from) || isNaN(to) || from > to || from < 1 || to - from > 50) {
        return res.status(400).json({
          success: false,
          message: 'Dải số bàn không hợp lệ (từ 1 đến 999, tối đa 50 bàn mỗi lần tạo).'
        });
      }

      const created = [];
      const skipped = [];
      const prefix = String(batch_prefix).trim();

      for (let i = from; i <= to; i++) {
        const paddedNum = i < 10 ? `0${i}` : `${i}`;
        const tableName = `${prefix} ${paddedNum}`.trim();

        const [existing] = await db.query('SELECT id FROM tables WHERE name = ?', [tableName]);
        if (existing.length > 0) {
          skipped.push(tableName);
          continue;
        }

        const [result] = await db.query('INSERT INTO tables (name, status) VALUES (?, "EMPTY")', [tableName]);
        created.push({ id: result.insertId, name: tableName, status: 'EMPTY' });
      }

      if (req.io) {
        req.io.emit('table_status_changed', { action: 'batch_created', count: created.length });
      }

      return res.status(201).json({
        success: true,
        message: `Đã tạo ${created.length} bàn thành công!${skipped.length > 0 ? ` (Bỏ qua ${skipped.length} bàn đã tồn tại: ${skipped.join(', ')})` : ''}`,
        data: created
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên bàn hợp lệ (1 - 50 ký tự).' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return res.status(400).json({ success: false, message: 'Tên bàn không được vượt quá 50 ký tự.' });
    }

    const [existing] = await db.query('SELECT id FROM tables WHERE name = ?', [trimmedName]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Bàn với tên "${trimmedName}" đã tồn tại.` });
    }

    const [result] = await db.query('INSERT INTO tables (name, status) VALUES (?, "EMPTY")', [trimmedName]);
    const newTable = { id: result.insertId, name: trimmedName, status: 'EMPTY' };

    if (req.io) {
      req.io.emit('table_status_changed', { action: 'created', table: newTable });
    }

    return res.status(201).json({
      success: true,
      message: `Đã tạo bàn "${trimmedName}" thành công!`,
      data: newTable
    });
  } catch (error) {
    console.error('createTable error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tạo bàn mới.' });
  }
};

exports.updateTable = async (req, res) => {
  const tableId = parseInt(req.params.id, 10);
  const { name } = req.body;

  if (isNaN(tableId) || tableId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã bàn không hợp lệ.' });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên bàn hợp lệ.' });
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 50) {
    return res.status(400).json({ success: false, message: 'Tên bàn không được vượt quá 50 ký tự.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM tables WHERE name = ? AND id != ?', [trimmedName, tableId]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Tên bàn "${trimmedName}" đã được sử dụng bởi bàn khác.` });
    }

    const [result] = await db.query('UPDATE tables SET name = ? WHERE id = ?', [trimmedName, tableId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn để cập nhật.' });
    }

    if (req.io) {
      req.io.emit('table_status_changed', { action: 'updated', table_id: tableId, name: trimmedName });
    }

    return res.status(200).json({ success: true, message: 'Cập nhật tên bàn thành công!' });
  } catch (error) {
    console.error('updateTable error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi cập nhật bàn.' });
  }
};

exports.deleteTable = async (req, res) => {
  const tableId = parseInt(req.params.id, 10);
  if (isNaN(tableId) || tableId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã bàn không hợp lệ.' });
  }

  try {
    const [tables] = await db.query('SELECT id, name, status, current_session_id FROM tables WHERE id = ?', [tableId]);
    if (tables.length === 0) {
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại.' });
    }

    const table = tables[0];
    if (table.status !== 'EMPTY' || table.current_session_id !== null) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa bàn "${table.name}" khi đang có khách hoặc phiên hoạt động. Vui lòng dọn bàn trước khi xóa.`
      });
    }

    const [activeOrders] = await db.query(
      "SELECT id FROM orders WHERE table_id = ? AND status IN ('PENDING_APPROVAL', 'PREPARING', 'SERVED') LIMIT 1",
      [tableId]
    );
    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Bàn "${table.name}" đang có đơn hàng chưa hoàn tất, không thể xóa.`
      });
    }

    await db.query('DELETE FROM tables WHERE id = ?', [tableId]);

    if (req.io) {
      req.io.emit('table_status_changed', { action: 'deleted', table_id: tableId });
    }

    return res.status(200).json({ success: true, message: `Đã xóa bàn "${table.name}" thành công!` });
  } catch (error) {
    console.error('deleteTable error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi xóa bàn.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, full_name, role, permissions, is_active, created_at, updated_at FROM users ORDER BY id ASC'
    );

    const { parsePermissions } = require('../middlewares/authMiddleware');

    const formattedUsers = users.map((u) => {
      const roleNum = Number(u.role);
      return {
        ...u,
        role: roleNum,
        permissions: parsePermissions(roleNum, u.permissions)
      };
    });

    return res.status(200).json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tải danh sách người dùng.' });
  }
};

exports.createUser = async (req, res) => {
  const { username, password, full_name, role, permissions } = req.body;

  if (!username || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ: Tên đăng nhập, Mật khẩu và Họ tên!'
    });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const cleanFullName = String(full_name).trim();

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
    return res.status(400).json({
      success: false,
      message: 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới (từ 3-30 ký tự).'
    });
  }

  if (cleanFullName.length === 0 || cleanFullName.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Họ tên không được vượt quá 100 ký tự.'
    });
  }

  if (String(password).length < 6 || String(password).length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải từ 6 đến 50 ký tự.'
    });
  }

  const roleNum = (role === 1 || role === '1' || role === 'admin') ? 1 : 0;
  const userPerms = roleNum === 1
    ? ['pos', 'kitchen', 'reports', 'menu', 'qrcodes', 'users', 'settings', 'staff_order']
    : (Array.isArray(permissions) && permissions.length > 0 ? permissions : ['staff_order']);

  try {
    const [existingUser] = await db.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập này đã tồn tại!' });
    }

    const hashedPassword = hashPassword(String(password));

    const [result] = await db.query(
      'INSERT INTO users (username, password, full_name, role, permissions, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [cleanUsername, hashedPassword, cleanFullName, roleNum, JSON.stringify(userPerms)]
    );

    return res.status(201).json({
      success: true,
      message: roleNum === 1 ? 'Tạo tài khoản quản trị viên thành công!' : 'Tạo tài khoản nhân viên thành công!',
      data: {
        id: result.insertId,
        username: cleanUsername,
        full_name: cleanFullName,
        role: roleNum,
        permissions: userPerms,
        is_active: 1
      }
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tạo tài khoản.' });
  }
};

exports.updateUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'ID tài khoản không hợp lệ.' });
  }

  const { full_name, role, permissions, is_active, password } = req.body;

  try {
    const [userRows] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại!' });
    }

    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      const cleanFullName = String(full_name).trim();
      if (!cleanFullName || cleanFullName.length > 100) {
        return res.status(400).json({ success: false, message: 'Họ tên không được vượt quá 100 ký tự.' });
      }
      updates.push('full_name = ?');
      values.push(cleanFullName);
    }

    if (role !== undefined) {
      const roleNum = (role === 1 || role === '1' || role === 'admin') ? 1 : 0;

      if (userId === 1 && roleNum !== 1) {
        return res.status(400).json({ success: false, message: 'Không thể thay đổi quyền của Quản trị viên gốc!' });
      }
      updates.push('role = ?');
      values.push(roleNum);
    }

    if (permissions !== undefined) {
      let permsToSave;
      if (Array.isArray(permissions)) {
        permsToSave = JSON.stringify(permissions);
      } else if (typeof permissions === 'string') {
        permsToSave = permissions;
      } else {
        permsToSave = JSON.stringify(['staff_order']);
      }

      if (userId === 1) {
        permsToSave = JSON.stringify(['pos', 'kitchen', 'reports', 'menu', 'qrcodes', 'users', 'settings', 'staff_order']);
      }
      updates.push('permissions = ?');
      values.push(permsToSave);
    }

    if (is_active !== undefined) {

      if (userId === 1 && !is_active) {
        return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản Quản trị viên gốc!' });
      }
      updates.push('is_active = ?');
      values.push(Boolean(is_active));
    }

    if (password && String(password).trim().length > 0) {
      if (String(password).length < 6 || String(password).length > 50) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 đến 50 ký tự.' });
      }
      updates.push('password = ?');
      values.push(hashPassword(String(password)));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có thông tin thay đổi.' });
    }

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    return res.status(200).json({ success: true, message: 'Cập nhật tài khoản thành công!' });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi cập nhật tài khoản.' });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: 'ID tài khoản không hợp lệ.' });
  }

  try {
    if (userId === 1) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản Quản trị viên gốc (ID 1)!'
      });
    }

    if (req.user && req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của chính mình!'
      });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
    }

    return res.status(200).json({ success: true, message: 'Đã xóa tài khoản thành công!' });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi xóa tài khoản.' });
  }
};

exports.getShiftStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, shift_number, status, current_order_seq, opened_at, closed_at, opened_by, closed_by FROM pos_shifts ORDER BY id DESC LIMIT 1'
    );
    const shift = rows[0] || { status: 'OPEN', current_order_seq: 0, shift_number: 1 };
    return res.json({
      success: true,
      data: {
        id: shift.id,
        is_open: shift.status === 'OPEN',
        status: shift.status,
        shift_number: shift.shift_number,
        current_order_seq: shift.current_order_seq,
        opened_at: shift.opened_at,
        closed_at: shift.closed_at,
        opened_by: shift.opened_by,
        closed_by: shift.closed_by
      }
    });
  } catch (error) {
    console.error('getShiftStatus error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi kiểm tra ca làm việc.' });
  }
};

exports.closeShift = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, status, shift_number FROM pos_shifts ORDER BY id DESC LIMIT 1');
    if (rows.length === 0 || rows[0].status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Máy hiện đã ở trạng thái ĐÓNG.' });
    }

    const [occupiedTables] = await db.query(
      "SELECT id, name, status, current_session_id FROM tables WHERE status != 'EMPTY' OR current_session_id IS NOT NULL"
    );

    const [activeOrders] = await db.query(
      `SELECT o.id, o.session_id, o.status, t.name AS table_name
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       WHERE o.status NOT IN ('COMPLETED', 'CANCELLED')`
    );

    const [activeSessions] = await db.query(
      `SELECT s.id, s.table_id, t.name AS table_name
       FROM table_sessions s
       LEFT JOIN tables t ON s.table_id = t.id
       WHERE s.status = 'ACTIVE'`
    );

    if (occupiedTables.length > 0 || activeOrders.length > 0 || activeSessions.length > 0) {
      const busyTableNames = Array.from(new Set([
        ...occupiedTables.map(t => t.name),
        ...activeOrders.map(o => o.table_name).filter(Boolean),
        ...activeSessions.map(s => s.table_name).filter(Boolean)
      ]));

      const issues = [];
      if (activeOrders.length > 0) {
        issues.push(`• Còn ${activeOrders.length} đơn hàng chưa xử lý / chưa hoàn tất`);
      }
      if (busyTableNames.length > 0) {
        issues.push(`• Còn ${busyTableNames.length} bàn chưa dọn (${busyTableNames.join(', ')})`);
      }

      return res.status(400).json({
        success: false,
        message: `KHÔNG THỂ ĐÓNG MÁY!\n\nĐiều kiện đóng máy: Tất cả đơn hàng phải được clear và toàn bộ bàn phải trống.\n\n${issues.join('\n')}\n\nVui lòng hoàn tất đơn, thanh toán và dọn bàn trống trước khi đóng máy!`,
        details: {
          activeOrdersCount: activeOrders.length,
          occupiedTablesCount: busyTableNames.length,
          busyTables: busyTableNames
        }
      });
    }

    const shiftId = rows[0].id;
    const operatorName = req.user?.full_name || req.user?.username || 'admin';
    await db.query(
      'UPDATE pos_shifts SET status = "CLOSED", closed_at = NOW(), closed_by = ? WHERE id = ?',
      [operatorName, shiftId]
    );

    if (req.io) {
      req.io.emit('pos_status_changed', {
        is_open: false,
        status: 'CLOSED',
        message: 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai.'
      });
    }

    return res.json({
      success: true,
      message: 'Đã đóng máy kết thúc ngày làm việc thành công! Hệ thống tạm ngưng nhận đơn.'
    });
  } catch (error) {
    console.error('closeShift error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi đóng máy.' });
  }
};

exports.openShift = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, status, shift_number FROM pos_shifts ORDER BY id DESC LIMIT 1');
    if (rows.length > 0 && rows[0].status === 'OPEN') {
      return res.status(400).json({ success: false, message: 'Máy hiện đang MỞ.' });
    }
    const nextShiftNumber = (rows[0]?.shift_number || 0) + 1;
    const operatorName = req.user?.full_name || req.user?.username || 'admin';
    await db.query(
      'INSERT INTO pos_shifts (shift_number, status, current_order_seq, opened_at, opened_by) VALUES (?, "OPEN", 0, NOW(), ?)',
      [nextShiftNumber, operatorName]
    );

    if (req.io) {
      req.io.emit('pos_status_changed', {
        is_open: true,
        status: 'OPEN',
        shift_number: nextShiftNumber,
        message: 'Nhà hàng đã mở máy bắt đầu ngày mới.'
      });
    }

    return res.json({
      success: true,
      message: `Đã mở máy bắt đầu ngày mới thành công! Số thứ tự đơn đặt lại từ 1.`,
      data: { shift_number: nextShiftNumber }
    });
  } catch (error) {
    console.error('openShift error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi mở máy.' });
  }
};

exports.getAnnouncementSettings = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT `key`, `value` FROM `restaurant_settings` WHERE `key` IN ('announcement', 'closed_announcement')"
    );
    const settings = {
      announcement: 'Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món • Món ăn sẽ được bếp chuẩn bị chu đáo và phục vụ tận bàn • Chúc quý khách ngon miệng!',
      closed_announcement: 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai. Kính chúc quý khách một ngày tốt lành!'
    };
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('getAnnouncementSettings error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải thông báo.' });
  }
};

exports.updateAnnouncementSettings = async (req, res) => {
  try {
    const { announcement, closed_announcement } = req.body;
    if (typeof announcement === 'string' && announcement.trim()) {
      await db.query(
        "INSERT INTO `restaurant_settings` (`key`, `value`) VALUES ('announcement', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [announcement.trim()]
      );
    }
    if (typeof closed_announcement === 'string' && closed_announcement.trim()) {
      await db.query(
        "INSERT INTO `restaurant_settings` (`key`, `value`) VALUES ('closed_announcement', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [closed_announcement.trim()]
      );
    }

    const [rows] = await db.query(
      "SELECT `key`, `value` FROM `restaurant_settings` WHERE `key` IN ('announcement', 'closed_announcement')"
    );
    const settings = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });

    if (req.io) {
      req.io.emit('announcement_updated', settings);
    }

    return res.json({
      success: true,
      message: 'Đã cập nhật thông báo chạy của nhà hàng thành công!',
      data: settings
    });
  } catch (error) {
    console.error('updateAnnouncementSettings error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo.' });
  }
};
