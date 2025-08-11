import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationService } from '@/lib/services/mobile/push-notification.service';

const pushService = PushNotificationService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'register-token':
        return await handleRegisterToken(data);
      case 'unregister-token':
        return await handleUnregisterToken(data);
      case 'send-to-user':
        return await handleSendToUser(data);
      case 'send-to-multiple':
        return await handleSendToMultiple(data);
      case 'send-to-all':
        return await handleSendToAll(data);
      case 'send-match-notification':
        return await handleSendMatchNotification(data);
      case 'send-message-notification':
        return await handleSendMessageNotification(data);
      case 'send-like-notification':
        return await handleSendLikeNotification(data);
      case 'send-promotional-notification':
        return await handleSendPromotionalNotification(data);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in mobile notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleRegisterToken(data: any) {
  const { userId, token, platform } = data;

  if (!userId || !token || !platform) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, token, platform' },
      { status: 400 }
    );
  }

  if (!['ios', 'android'].includes(platform)) {
    return NextResponse.json(
      { error: 'Invalid platform. Must be ios or android' },
      { status: 400 }
    );
  }

  const success = await pushService.registerDeviceToken(userId, token, platform as 'ios' | 'android');

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to register device token' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Device token registered successfully',
  });
}

async function handleUnregisterToken(data: any) {
  const { token } = data;

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  const success = await pushService.unregisterDeviceToken(token);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to unregister device token' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Device token unregistered successfully',
  });
}

async function handleSendToUser(data: any) {
  const { userId, title, body, imageUrl, sound, badge, data: notificationData } = data;

  if (!userId || !title || !body) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, title, body' },
      { status: 400 }
    );
  }

  const success = await pushService.sendToUser(userId, {
    title,
    body,
    imageUrl,
    sound,
    badge,
    data: notificationData || {},
  });

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Notification sent successfully',
  });
}

async function handleSendToMultiple(data: any) {
  const { userIds, title, body, imageUrl, sound, badge, data: notificationData } = data;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { error: 'userIds must be a non-empty array' },
      { status: 400 }
    );
  }

  if (!title || !body) {
    return NextResponse.json(
      { error: 'Missing required fields: title, body' },
      { status: 400 }
    );
  }

  const success = await pushService.sendToMultipleUsers(userIds, {
    title,
    body,
    imageUrl,
    sound,
    badge,
    data: notificationData || {},
  });

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Notifications sent to ${userIds.length} users`,
  });
}

async function handleSendToAll(data: any) {
  const { title, body, imageUrl, sound, badge, data: notificationData } = data;

  if (!title || !body) {
    return NextResponse.json(
      { error: 'Missing required fields: title, body' },
      { status: 400 }
    );
  }

  const success = await pushService.sendToAllUsers({
    title,
    body,
    imageUrl,
    sound,
    badge,
    data: notificationData || {},
  });

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Notifications sent to all users',
  });
}

async function handleSendMatchNotification(data: any) {
  const { userId, matchName, matchImageUrl } = data;

  if (!userId || !matchName) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, matchName' },
      { status: 400 }
    );
  }

  const success = await pushService.sendMatchNotification(userId, matchName, matchImageUrl);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send match notification' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Match notification sent successfully',
  });
}

async function handleSendMessageNotification(data: any) {
  const { userId, senderName, message } = data;

  if (!userId || !senderName || !message) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, senderName, message' },
      { status: 400 }
    );
  }

  const success = await pushService.sendMessageNotification(userId, senderName, message);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send message notification' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Message notification sent successfully',
  });
}

async function handleSendLikeNotification(data: any) {
  const { userId, likerName } = data;

  if (!userId || !likerName) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, likerName' },
      { status: 400 }
    );
  }

  const success = await pushService.sendLikeNotification(userId, likerName);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send like notification' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Like notification sent successfully',
  });
}

async function handleSendPromotionalNotification(data: any) {
  const { userId, title, body } = data;

  if (!userId || !title || !body) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, title, body' },
      { status: 400 }
    );
  }

  const success = await pushService.sendPromotionalNotification(userId, title, body);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to send promotional notification' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Promotional notification sent successfully',
  });
}