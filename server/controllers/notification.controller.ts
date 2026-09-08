import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import {
  getUserNotifications,
  getUserUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notification.service.js';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 30;
    const offset = parseInt(req.query.offset as string) || 0;

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(userId, Math.min(limit, 50), Math.max(offset, 0)),
      getUserUnreadCount(userId),
    ]);

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const unreadCount = await getUserUnreadCount(userId);
    res.json({ unreadCount });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await markNotificationAsRead(id, userId);
    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await markAllNotificationsAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
