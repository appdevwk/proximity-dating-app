import { NextRequest, NextResponse } from 'next/server';
import { DeviceManagementService } from '@/lib/services/mobile/device-management.service';

const deviceService = DeviceManagementService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, deviceId, ...data } = body;

    switch (action) {
      case 'register':
        return await handleRegister(data);
      case 'update':
        return await handleUpdate(deviceId, data);
      case 'unregister':
        return await handleUnregister(deviceId);
      case 'update-push-token':
        return await handleUpdatePushToken(deviceId, data);
      case 'toggle-notifications':
        return await handleToggleNotifications(deviceId, data);
      case 'update-last-active':
        return await handleUpdateLastActive(deviceId);
      case 'check-updates':
        return await handleCheckUpdates(deviceId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in mobile device API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const deviceId = searchParams.get('deviceId');
    const userId = searchParams.get('userId');

    switch (action) {
      case 'get-device':
        return await handleGetDevice(deviceId);
      case 'get-user-devices':
        return await handleGetUserDevices(userId);
      case 'get-stats':
        return await handleGetStats();
      case 'get-latest-version':
        return await handleGetLatestVersion(searchParams.get('platform'));
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in mobile device API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleRegister(data: any) {
  const { deviceId, platform, model, osVersion, appVersion, pushToken, userId, isNotificationsEnabled } = data;

  if (!deviceId || !platform || !userId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const device = await deviceService.registerDevice({
    deviceId,
    platform,
    model,
    osVersion,
    appVersion,
    pushToken,
    userId,
    isNotificationsEnabled: isNotificationsEnabled ?? true,
    lastActiveAt: new Date(),
  });

  return NextResponse.json({
    success: true,
    device,
  });
}

async function handleUpdate(deviceId: string, data: any) {
  if (!deviceId) {
    return NextResponse.json(
      { error: 'Device ID is required' },
      { status: 400 }
    );
  }

  const device = await deviceService.updateDevice(deviceId, data);

  if (!device) {
    return NextResponse.json(
      { error: 'Device not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    device,
  });
}

async function handleUnregister(deviceId: string) {
  if (!deviceId) {
    return NextResponse.json(
      { error: 'Device ID is required' },
      { status: 400 }
    );
  }

  const success = await deviceService.unregisterDevice(deviceId);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to unregister device' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}

async function handleUpdatePushToken(deviceId: string, data: any) {
  if (!deviceId || !data.pushToken) {
    return NextResponse.json(
      { error: 'Device ID and push token are required' },
      { status: 400 }
    );
  }

  const success = await deviceService.updatePushToken(deviceId, data.pushToken);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to update push token' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}

async function handleToggleNotifications(deviceId: string, data: any) {
  if (!deviceId || typeof data.enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'Device ID and enabled status are required' },
      { status: 400 }
    );
  }

  const success = await deviceService.toggleNotifications(deviceId, data.enabled);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to toggle notifications' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}

async function handleUpdateLastActive(deviceId: string) {
  if (!deviceId) {
    return NextResponse.json(
      { error: 'Device ID is required' },
      { status: 400 }
    );
  }

  const success = await deviceService.updateLastActive(deviceId);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to update last active time' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}

async function handleCheckUpdates(deviceId: string) {
  if (!deviceId) {
    return NextResponse.json(
      { error: 'Device ID is required' },
      { status: 400 }
    );
  }

  const updateInfo = await deviceService.checkForUpdates(deviceId);

  return NextResponse.json({
    success: true,
    updateInfo,
  });
}

async function handleGetDevice(deviceId: string | null) {
  if (!deviceId) {
    return NextResponse.json(
      { error: 'Device ID is required' },
      { status: 400 }
    );
  }

  const device = await deviceService.getDevice(deviceId);

  if (!device) {
    return NextResponse.json(
      { error: 'Device not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    device,
  });
}

async function handleGetUserDevices(userId: string | null) {
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const devices = await deviceService.getUserDevices(userId);

  return NextResponse.json({
    success: true,
    devices,
  });
}

async function handleGetStats() {
  const stats = await deviceService.getDeviceStats();

  return NextResponse.json({
    success: true,
    stats,
  });
}

async function handleGetLatestVersion(platform: string | null) {
  if (!platform || !['ios', 'android'].includes(platform)) {
    return NextResponse.json(
      { error: 'Valid platform is required (ios or android)' },
      { status: 400 }
    );
  }

  const version = await deviceService.getLatestAppVersion((platform as string).toUpperCase() as any);

  if (!version) {
    return NextResponse.json(
      { error: 'No version found for platform' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    version,
  });
}