import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DeviceInfo {
  deviceId: string;
  platform: 'IOS' | 'android';
  model: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  userId: string;
  isNotificationsEnabled: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppVersion {
  version: string;
  buildNumber: string;
  platform: 'IOS' | 'android';
  releaseDate: Date;
  isRequired: boolean;
  changelog: string[];
  downloadUrl: string;
  size: string;
}

export class DeviceManagementService {
  private static instance: DeviceManagementService;

  static getInstance(): DeviceManagementService {
    if (!DeviceManagementService.instance) {
      DeviceManagementService.instance = new DeviceManagementService();
    }
    return DeviceManagementService.instance;
  }

  async registerDevice(deviceInfo: Omit<DeviceInfo, 'createdAt' | 'updatedAt'>): Promise<DeviceInfo> {
    try {
      // Check if device already exists
      const existingDevice = await prisma.device.findUnique({
        where: { deviceId: deviceInfo.deviceId },
      });

      if (existingDevice) {
        // Update existing device
        const updatedDevice = await prisma.device.update({
          where: { deviceId: deviceInfo.deviceId },
          data: {
            ...deviceInfo, platform: (deviceInfo.platform?.toUpperCase() as any),
            updatedAt: new Date(),
          },
        });
        return this.mapToDeviceInfo(updatedDevice);
      } else {
        // Create new device
        const newDevice = await prisma.device.create({
          data: {
            ...deviceInfo, platform: (deviceInfo.platform?.toUpperCase() as any),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        return this.mapToDeviceInfo(newDevice);
      }
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  async updateDevice(deviceId: string, updates: Partial<DeviceInfo>): Promise<DeviceInfo | null> {
    try {
      const updatedDevice = await prisma.device.update({
        where: { deviceId },
        data: {
          ...(updates as any),
          updatedAt: new Date(),
        },
      });
      return this.mapToDeviceInfo(updatedDevice);
    } catch (error) {
      console.error('Error updating device:', error);
      return null;
    }
  }

  async unregisterDevice(deviceId: string): Promise<boolean> {
    try {
      await prisma.device.delete({
        where: { deviceId },
      });
      return true;
    } catch (error) {
      console.error('Error unregistering device:', error);
      return false;
    }
  }

  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    try {
      const devices = await prisma.device.findMany({
        where: { userId },
        orderBy: { lastActiveAt: 'desc' },
      });
      return devices.map(device => this.mapToDeviceInfo(device));
    } catch (error) {
      console.error('Error getting user devices:', error);
      return [];
    }
  }

  async getDevice(deviceId: string): Promise<DeviceInfo | null> {
    try {
      const device = await prisma.device.findUnique({
        where: { deviceId },
      });
      return device ? this.mapToDeviceInfo(device) : null;
    } catch (error) {
      console.error('Error getting device:', error);
      return null;
    }
  }

  async updatePushToken(deviceId: string, pushToken: string): Promise<boolean> {
    try {
      await prisma.device.update({
        where: { deviceId },
        data: {
          pushToken,
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error updating push token:', error);
      return false;
    }
  }

  async toggleNotifications(deviceId: string, enabled: boolean): Promise<boolean> {
    try {
      await prisma.device.update({
        where: { deviceId },
        data: {
          isNotificationsEnabled: enabled,
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error toggling notifications:', error);
      return false;
    }
  }

  async updateLastActive(deviceId: string): Promise<boolean> {
    try {
      await prisma.device.update({
        where: { deviceId },
        data: {
          lastActiveAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error updating last active time:', error);
      return false;
    }
  }

  async getActiveUsersCount(): Promise<number> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const count = await prisma.device.count({
        where: {
          lastActiveAt: {
            gte: thirtyMinutesAgo,
          },
        },
      });
      return count;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
    }
  }

  async getDeviceStats(): Promise<{
    totalDevices: number;
    androidDevices: number;
    iosDevices: number;
    activeDevices: number;
    notificationsEnabled: number;
  }> {
    try {
      const [total, android, ios, active, notificationsEnabled] = await Promise.all([
        prisma.device.count(),
        prisma.device.count({ where: { platform: 'ANDROID' } }),
        prisma.device.count({ where: { platform: 'IOS' } }),
        prisma.device.count({
          where: {
            lastActiveAt: {
              gte: new Date(Date.now() - 30 * 60 * 1000),
            },
          },
        }),
        prisma.device.count({ where: { isNotificationsEnabled: true } }),
      ]);

      return {
        totalDevices: total,
        androidDevices: android,
        iosDevices: ios,
        activeDevices: active,
        notificationsEnabled,
      };
    } catch (error) {
      console.error('Error getting device stats:', error);
      return {
        totalDevices: 0,
        androidDevices: 0,
        iosDevices: 0,
        activeDevices: 0,
        notificationsEnabled: 0,
      };
    }
  }

  // App version management
  async getLatestAppVersion(platform: 'IOS' | 'android'): Promise<AppVersion | null> {
    try {
      const version = await prisma.appVersion.findFirst({
        where: { platform: platform?.toUpperCase() as any },
        orderBy: { releaseDate: 'desc' },
      });
      return version ? this.mapToAppVersion(version) : null;
    } catch (error) {
      console.error('Error getting latest app version:', error);
      return null;
    }
  }

  async getAppVersions(platform?: 'ios' | 'android'): Promise<AppVersion[]> {
    try {
      const versions = await prisma.appVersion.findMany({
        where: platform ? { platform } : {},
        orderBy: { releaseDate: 'desc' },
      });
      return versions.map(version => this.mapToAppVersion(version));
    } catch (error) {
      console.error('Error getting app versions:', error);
      return [];
    }
  }

  async createAppVersion(versionData: Omit<AppVersion, 'releaseDate'>): Promise<AppVersion> {
    try {
      const version = await prisma.appVersion.create({
        data: {
          ...versionData,
          releaseDate: new Date(),
        },
      });
      return this.mapToAppVersion(version);
    } catch (error) {
      console.error('Error creating app version:', error);
      throw error;
    }
  }

  async checkForUpdates(deviceId: string): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: AppVersion;
    isRequired: boolean;
  }> {
    try {
      const device = await prisma.device.findUnique({
        where: { deviceId },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const latestVersion = await this.getLatestAppVersion(device.platform);

      if (!latestVersion) {
        return {
          hasUpdate: false,
          currentVersion: device.appVersion,
          isRequired: false,
        };
      }

      const hasUpdate = this.compareVersions(device.appVersion, latestVersion.version) < 0;

      return {
        hasUpdate,
        currentVersion: device.appVersion,
        latestVersion: hasUpdate ? latestVersion : undefined,
        isRequired: latestVersion.isRequired,
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        hasUpdate: false,
        currentVersion: 'unknown',
        isRequired: false,
      };
    }
  }

  // Helper methods
  private mapToDeviceInfo(device: any): DeviceInfo {
    return {
      deviceId: device.deviceId,
      platform: device.platform,
      model: device.model,
      osVersion: device.osVersion,
      appVersion: device.appVersion,
      pushToken: device.pushToken,
      userId: device.userId,
      isNotificationsEnabled: device.isNotificationsEnabled,
      lastActiveAt: device.lastActiveAt,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }

  private mapToAppVersion(version: any): AppVersion {
    return {
      version: version.version,
      buildNumber: version.buildNumber,
      platform: version.platform,
      releaseDate: version.releaseDate,
      isRequired: version.isRequired,
      changelog: version.changelog,
      downloadUrl: version.downloadUrl,
      size: version.size,
    };
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }
}