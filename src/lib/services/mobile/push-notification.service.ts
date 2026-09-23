import { initializeApp, cert } from 'firebase-admin/app';
import type { App, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin (for push notifications)
let firebaseAdmin: App | null = null;

const initializeFirebase = () => {
  if (!firebaseAdmin) {
    // Note: You'll need to replace this with your actual Firebase service account credentials
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'proximity-dating-app',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    };

    firebaseAdmin = initializeApp({
      credential: cert(serviceAccount),
    }, 'proximity-dating');
  }
  return firebaseAdmin;
};

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PushNotificationService {
  private static instance: PushNotificationService;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private getFirebaseApp() {
    return initializeFirebase();
  }

  private getMessaging() {
    return getMessaging(this.getFirebaseApp());
  }

  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      const app = this.getFirebaseApp();
      
      // Get user's device tokens from database
      const deviceTokens = await this.getUserDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        return false;
      }

      // Group tokens by platform
      const androidTokens = deviceTokens.filter(token => token.platform === 'android').map(t => t.token);
      const iosTokens = deviceTokens.filter(token => token.platform === 'ios').map(t => t.token);

      const promises: Promise<any>[] = [];

      // Send to Android devices
      if (androidTokens.length > 0) {
        promises.push(
          this.getMessaging().sendEachForMulticast({
            tokens: androidTokens,
            notification: {
              title: payload.title,
              body: payload.body,
              imageUrl: payload.imageUrl,
            },
            data: payload.data || {},
            android: {
              notification: {
                sound: payload.sound || 'default',
                priority: 'high',
              },
            },
          })
        );
      }

      // Send to iOS devices
      if (iosTokens.length > 0) {
        promises.push(
          this.getMessaging().sendEachForMulticast({
            tokens: iosTokens,
            notification: {
              title: payload.title,
              body: payload.body,
              imageUrl: payload.imageUrl,
            },
            data: payload.data || {},
            apns: {
              payload: {
                aps: {
                  sound: payload.sound || 'default',
                  badge: payload.badge,
                  contentAvailable: true,
                },
              },
            },
          })
        );
      }

      const results = await Promise.all(promises);
      
      // Check for failures and remove invalid tokens
      results.forEach((result, index) => {
        if (result.responses) {
          result.responses.forEach((response, responseIndex) => {
            if (!response.success) {
              console.error('Failed to send notification:', response.error);
              // Remove invalid token from database
              const tokenIndex = index === 0 ? responseIndex : responseIndex + androidTokens.length;
              const token = index === 0 ? androidTokens[tokenIndex] : iosTokens[tokenIndex - androidTokens.length];
              if (token) {
                this.removeDeviceToken(token);
              }
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  async sendToMultipleUsers(userIds: string[], payload: PushNotificationPayload): Promise<boolean> {
    try {
      const promises = userIds.map(userId => this.sendToUser(userId, payload));
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      console.error('Error sending notifications to multiple users:', error);
      return false;
    }
  }

  async sendToAllUsers(payload: PushNotificationPayload): Promise<boolean> {
    try {
      // Get all device tokens from database
      const allDeviceTokens = await this.getAllDeviceTokens();
      const userIds = [...new Set(allDeviceTokens.map(token => token.userId))];
      return await this.sendToMultipleUsers(userIds, payload);
    } catch (error) {
      console.error('Error sending notifications to all users:', error);
      return false;
    }
  }

  async registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<boolean> {
    try {
      // Save device token to database
      await this.saveDeviceToken({
        token,
        platform,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  }

  async unregisterDeviceToken(token: string): Promise<boolean> {
    try {
      await this.removeDeviceToken(token);
      return true;
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return false;
    }
  }

  // Database methods (to be implemented with your actual database)
  private async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
    // Implement with your database (Prisma, etc.)
    // Example: return await prisma.deviceToken.findMany({ where: { userId } });
    return [];
  }

  private async getAllDeviceTokens(): Promise<DeviceToken[]> {
    // Implement with your database
    // Example: return await prisma.deviceToken.findMany();
    return [];
  }

  private async saveDeviceToken(deviceToken: DeviceToken): Promise<void> {
    // Implement with your database
    // Example: await prisma.deviceToken.create({ data: deviceToken });
  }

  private async removeDeviceToken(token: string): Promise<void> {
    // Implement with your database
    // Example: await prisma.deviceToken.delete({ where: { token } });
  }

  // Notification templates
  async sendMatchNotification(userId: string, matchName: string, matchImageUrl?: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      title: 'New Match! 🎉',
      body: `You matched with ${matchName}! Start chatting now.`,
      imageUrl: matchImageUrl,
      data: {
        type: 'match',
        matchName,
        screen: 'matches',
      },
    });
  }

  async sendMessageNotification(userId: string, senderName: string, message: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      title: `New message from ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      data: {
        type: 'message',
        screen: 'chat',
      },
    });
  }

  async sendLikeNotification(userId: string, likerName: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      title: 'Someone likes you! 💕',
      body: `${likerName} liked your profile. Like them back to match!`,
      data: {
        type: 'like',
        screen: 'discover',
      },
    });
  }

  async sendPromotionalNotification(userId: string, title: string, body: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      title,
      body,
      data: {
        type: 'promotional',
        screen: 'home',
      },
    });
  }
}