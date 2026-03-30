import { Request, Response, NextFunction } from 'express';

// Middleware chỉ cho phép truy cập file trong thư mục con của uploads, không cho phép truy cập trực tiếp uploads/
export function uploadsSubfolderOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Đường dẫn sau /uploads/
  const relPath = req.path.replace(/^\/uploads\//, '');
  // Nếu không có dấu / tức là truy cập trực tiếp uploads/ hoặc uploads/filename
  if (!relPath.includes('/')) {
    if (req.is('json')) {
      return res.status(403).json({ message: 'Access to this path is forbidden.' });
    } else {
      res.status(403).type('text/plain').send('Access to this path is forbidden.');
      return;
    }
  }
  next();
}
