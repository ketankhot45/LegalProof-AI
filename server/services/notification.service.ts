import prisma from '../utils/db.js';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}

export interface BroadcastNotificationParams {
  type: string;
  title: string;
  message: string;
  link?: string | null;
}

/**
 * Creates a persistent notification for a specific user.
 */
export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { userId, type, title, message, link } = params;
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Creates a persistent notification for all Administrator users.
 */
export const notifyAdmins = async (params: BroadcastNotificationParams) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (!admins.length) return [];

    return await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      })),
    });
  } catch (error) {
    console.error('Failed to notify admins:', error);
    return [];
  }
};

/**
 * Creates a persistent notification for all verified active Investigators.
 */
export const notifyInvestigators = async (params: BroadcastNotificationParams) => {
  try {
    const investigators = await prisma.user.findMany({
      where: { role: 'INVESTIGATOR', isEmailVerified: true },
      select: { id: true },
    });

    if (!investigators.length) return [];

    return await prisma.notification.createMany({
      data: investigators.map((inv) => ({
        userId: inv.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      })),
    });
  } catch (error) {
    console.error('Failed to notify investigators:', error);
    return [];
  }
};

/**
 * Retrieves notifications for a given user ordered by creation date descending.
 */
export const getUserNotifications = async (userId: string, limit = 30, offset = 0) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
};

/**
 * Retrieves count of unread notifications for a user.
 */
export const getUserUnreadCount = async (userId: string) => {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

/**
 * Marks a single notification as read if it belongs to the authenticated user.
 */
export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  return await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // IDOR protection: strictly scopes update to current user
    },
    data: {
      isRead: true,
    },
  });
};

/**
 * Marks all notifications for a user as read.
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};
