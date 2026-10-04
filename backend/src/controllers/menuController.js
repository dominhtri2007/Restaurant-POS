const db = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT c.id, c.name, c.created_at,
             COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name, c.created_at
      ORDER BY c.id ASC
    `);

    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tải danh mục.' });
  }
};

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống.' });
  }

  const cleanName = name.trim();
  if (cleanName.length > 100) {
    return res.status(400).json({ success: false, message: 'Tên danh mục không được vượt quá 100 ký tự.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [cleanName]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Danh mục này đã tồn tại.' });
    }

    const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [cleanName]);

    if (req.io) {
      req.io.emit('menu_updated');
    }

    return res.status(201).json({
      success: true,
      message: 'Thêm danh mục mới thành công!',
      data: { id: result.insertId, name: cleanName, product_count: 0 }
    });
  } catch (error) {
    console.error('createCategory error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi thêm danh mục.' });
  }
};

exports.updateCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);
  if (isNaN(categoryId) || categoryId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã danh mục không hợp lệ.' });
  }

  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống.' });
  }

  const cleanName = name.trim();
  if (cleanName.length > 100) {
    return res.status(400).json({ success: false, message: 'Tên danh mục không được vượt quá 100 ký tự.' });
  }

  try {
    const [result] = await db.query('UPDATE categories SET name = ? WHERE id = ?', [cleanName, categoryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
    }

    if (req.io) {
      req.io.emit('menu_updated');
    }

    return res.status(200).json({ success: true, message: 'Cập nhật danh mục thành công!' });
  } catch (error) {
    console.error('updateCategory error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi cập nhật danh mục.' });
  }
};

exports.deleteCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);
  if (isNaN(categoryId) || categoryId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã danh mục không hợp lệ.' });
  }

  try {
    const [prods] = await db.query('SELECT COUNT(id) AS cnt FROM products WHERE category_id = ?', [categoryId]);
    if (prods[0]?.cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Danh mục này đang có ${prods[0].cnt} món ăn. Vui lòng chuyển hoặc xóa các món trước khi xóa danh mục!`
      });
    }

    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
    }

    if (req.io) {
      req.io.emit('menu_updated');
    }

    return res.status(200).json({ success: true, message: 'Đã xóa danh mục thành công!' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi xóa danh mục.' });
  }
};

exports.getProducts = async (req, res) => {
  const { category_id, search } = req.query;

  try {
    let sql = `
      SELECT p.id, p.category_id, c.name AS category_name, p.name, p.price,
             p.image_url, p.is_best_seller, p.is_available, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id !== undefined && category_id !== '') {
      const catId = parseInt(category_id, 10);
      if (!isNaN(catId) && catId > 0) {
        sql += ' AND p.category_id = ?';
        params.push(catId);
      }
    }

    if (search && typeof search === 'string' && search.trim()) {

      const sanitizedSearch = search.trim().replace(/[%_\\]/g, '\\$&');
      sql += ' AND p.name LIKE ?';
      params.push(`%${sanitizedSearch}%`);
    }

    sql += ' ORDER BY p.category_id ASC, p.id ASC';

    const [products] = await db.query(sql, params);
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tải danh sách món ăn.' });
  }
};

exports.createProduct = async (req, res) => {
  const { category_id, name, price, image_url, is_best_seller, is_available } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Tên món ăn không được để trống.' });
  }

  const cleanName = name.trim();
  if (cleanName.length > 150) {
    return res.status(400).json({ success: false, message: 'Tên món ăn không được vượt quá 150 ký tự.' });
  }

  const catId = parseInt(category_id, 10);
  if (isNaN(catId) || catId <= 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn danh mục hợp lệ cho món ăn.' });
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0 || numPrice > 100000000) {
    return res.status(400).json({ success: false, message: 'Đơn giá không hợp lệ (phải từ 0 đến 100.000.000).' });
  }

  const cleanImageUrl = typeof image_url === 'string' && image_url.trim().length > 0 && image_url.trim().length <= 500
    ? image_url.trim()
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

  try {
    const [cats] = await db.query('SELECT id FROM categories WHERE id = ?', [catId]);
    if (cats.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh mục được chọn không tồn tại.' });
    }

    const [result] = await db.query(
      `INSERT INTO products (category_id, name, price, image_url, is_best_seller, is_available)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        catId,
        cleanName,
        numPrice,
        cleanImageUrl,
        Boolean(is_best_seller),
        is_available !== undefined ? Boolean(is_available) : true
      ]
    );

    if (req.io) {
      req.io.emit('menu_updated');
    }

    return res.status(201).json({
      success: true,
      message: 'Thêm món ăn mới thành công!',
      data: {
        id: result.insertId,
        category_id: catId,
        name: cleanName,
        price: numPrice,
        image_url: cleanImageUrl,
        is_best_seller: Boolean(is_best_seller),
        is_available: is_available !== undefined ? Boolean(is_available) : true
      }
    });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tạo món ăn mới.' });
  }
};

exports.updateProduct = async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã món ăn không hợp lệ.' });
  }

  const { category_id, name, price, image_url, is_best_seller, is_available } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Món ăn không tồn tại.' });
    }

    const updates = [];
    const values = [];

    if (category_id !== undefined) {
      const catId = parseInt(category_id, 10);
      if (isNaN(catId) || catId <= 0) {
        return res.status(400).json({ success: false, message: 'Danh mục không hợp lệ.' });
      }
      updates.push('category_id = ?');
      values.push(catId);
    }

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName || cleanName.length > 150) {
        return res.status(400).json({ success: false, message: 'Tên món ăn không được để trống hoặc vượt quá 150 ký tự.' });
      }
      updates.push('name = ?');
      values.push(cleanName);
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0 || numPrice > 100000000) {
        return res.status(400).json({ success: false, message: 'Đơn giá không hợp lệ.' });
      }
      updates.push('price = ?');
      values.push(numPrice);
    }

    if (image_url !== undefined) {
      const cleanImg = String(image_url).trim();
      if (cleanImg.length > 500) {
        return res.status(400).json({ success: false, message: 'Đường dẫn ảnh quá dài (tối đa 500 ký tự).' });
      }
      updates.push('image_url = ?');
      values.push(cleanImg);
    }

    if (is_best_seller !== undefined) {
      updates.push('is_best_seller = ?');
      values.push(Boolean(is_best_seller));
    }

    if (is_available !== undefined) {
      updates.push('is_available = ?');
      values.push(Boolean(is_available));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu thay đổi.' });
    }

    values.push(productId);
    await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

    if (req.io) {
      req.io.emit('menu_updated');
    }

    return res.status(200).json({ success: true, message: 'Cập nhật món ăn thành công!' });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi cập nhật món ăn.' });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã món ăn không hợp lệ.' });
  }

  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Món ăn không tồn tại.' });
    }

    if (req.io) {
      req.io.emit('menu_updated');
    }

    return res.status(200).json({ success: true, message: 'Đã xóa món ăn thành công!' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi xóa món ăn.' });
  }
};

exports.toggleProductAvailability = async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ success: false, message: 'Mã món ăn không hợp lệ.' });
  }

  try {
    const [prods] = await db.query('SELECT id, name, is_available FROM products WHERE id = ?', [productId]);
    if (prods.length === 0) {
      return res.status(404).json({ success: false, message: 'Món ăn không tồn tại.' });
    }

    const newStatus = !prods[0].is_available;
    await db.query('UPDATE products SET is_available = ? WHERE id = ?', [newStatus, productId]);

    if (req.io) {
      req.io.emit('menu_updated');
    }

    return res.status(200).json({
      success: true,
      message: `Đã đổi trạng thái "${prods[0].name}" thành: ${newStatus ? 'Còn món' : 'Tạm hết món'}!`,
      data: { id: productId, is_available: newStatus }
    });
  } catch (error) {
    console.error('toggleProductAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi đổi trạng thái món ăn.' });
  }
};
