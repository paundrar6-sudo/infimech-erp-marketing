import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak: Token otentikasi tidak ditemukan.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'marketing_erp_secret_key_123!@#');
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau kadaluarsa.' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Akses ditolak: User tidak teridentifikasi.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki wewenang untuk melakukan aksi ini.' });
    }

    next();
  };
};