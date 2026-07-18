const prisma = require('../config/prisma');

async function logActivity(type, message, meta = '', vendorId = null) {
  try {
    let vid = vendorId;
    if (vid == null && meta && typeof meta === 'object' && meta.vendorId != null) {
      vid = meta.vendorId;
    }
    return await prisma.activity.create({
      data: {
        type,
        message,
        meta: typeof meta === 'string' ? meta : JSON.stringify(meta || ''),
        ...(vid != null ? { vendorId: Number(vid) } : {}),
      },
    });
  } catch (err) {
    console.warn('Activity log failed:', err.message);
    return null;
  }
}

module.exports = { logActivity };
