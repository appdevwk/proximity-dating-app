import { db } from '@/lib/db';

export interface AdSessionRequest {
  userId: string;
  purpose: 'LOGIN' | 'PREMIUM_FEATURE' | 'EXTRA_SWIPES' | 'BOOST_PROFILE' | 'SUPER_LIKE';
  adsRequired?: number;
}

export interface AdViewRequest {
  sessionId: string;
  adId: string;
  adProvider: string;
  adType: 'VIDEO' | 'INTERSTITIAL' | 'BANNER' | 'REWARDED' | 'PLAYABLE';
  duration: number;
  reward?: number;
}

export interface AdSessionResponse {
  success: boolean;
  sessionId?: string;
  adsRequired: number;
  adsWatched: number;
  completed: boolean;
  error?: string;
}

export interface AdViewResponse {
  success: boolean;
  sessionCompleted: boolean;
  creditsEarned: number;
  totalAdsWatched: number;
  error?: string;
}

export class AdService {
  private static instance: AdService;

  static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  /**
   * Create a new ad session for login or premium features
   */
  async createAdSession(request: AdSessionRequest): Promise<AdSessionResponse> {
    try {
      // Check if user exists and is verified
      const user = await db.user.findUnique({
        where: { id: request.userId }
      });

      if (!user) {
        return {
          success: false,
          adsRequired: 0,
          adsWatched: 0,
          completed: false,
          error: 'User not found'
        };
      }

      if (!user.ageVerified) {
        return {
          success: false,
          adsRequired: 0,
          adsWatched: 0,
          completed: false,
          error: 'User must complete age verification first'
        };
      }

      // Check if user already has an active session for the same purpose
      const existingSession = await db.adSession.findFirst({
        where: {
          userId: request.userId,
          purpose: request.purpose,
          status: 'ACTIVE',
          completed: false
        }
      });

      if (existingSession) {
        return {
          success: true,
          sessionId: existingSession.sessionId,
          adsRequired: existingSession.adsRequired,
          adsWatched: existingSession.adsWatched,
          completed: existingSession.completed
        };
      }

      // Create new session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const adsRequired = request.adsRequired || 2; // Default to 2 ads for login
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiration

      const session = await db.adSession.create({
        data: {
          userId: request.userId,
          sessionId,
          purpose: request.purpose,
          adsRequired,
          expiresAt
        }
      });

      return {
        success: true,
        sessionId: session.sessionId,
        adsRequired: session.adsRequired,
        adsWatched: session.adsWatched,
        completed: session.completed
      };

    } catch (error) {
      console.error('Create ad session error:', error);
      return {
        success: false,
        adsRequired: 0,
        adsWatched: 0,
        completed: false,
        error: 'Failed to create ad session'
      };
    }
  }

  /**
   * Record an ad view and update session progress
   */
  async recordAdView(request: AdViewRequest): Promise<AdViewResponse> {
    try {
      // Find the session
      const session = await db.adSession.findUnique({
        where: { sessionId: request.sessionId },
        include: { user: true }
      });

      if (!session) {
        return {
          success: false,
          sessionCompleted: false,
          creditsEarned: 0,
          totalAdsWatched: 0,
          error: 'Session not found'
        };
      }

      if (session.status !== 'ACTIVE') {
        return {
          success: false,
          sessionCompleted: false,
          creditsEarned: 0,
          totalAdsWatched: 0,
          error: 'Session is not active'
        };
      }

      // Check if session is expired
      if (session.expiresAt && new Date() > session.expiresAt) {
        await db.adSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' }
        });
        return {
          success: false,
          sessionCompleted: false,
          creditsEarned: 0,
          totalAdsWatched: 0,
          error: 'Session expired'
        };
      }

      // Check if ad already viewed in this session
      const existingView = await db.adView.findFirst({
        where: {
          sessionId: session.id,
          adId: request.adId,
          completed: true
        }
      });

      if (existingView) {
        return {
          success: false,
          sessionCompleted: false,
          creditsEarned: 0,
          totalAdsWatched: session.adsWatched,
          error: 'Ad already viewed in this session'
        };
      }

      // Calculate reward based on ad type and duration
      const reward = this.calculateReward(request.adType, request.duration);

      // Record the ad view
      await db.adView.create({
        data: {
          userId: session.userId,
          sessionId: session.id,
          adId: request.adId,
          adProvider: request.adProvider,
          adType: request.adType,
          duration: request.duration,
          reward,
          completed: true,
          watchedAt: new Date()
        }
      });

      // Update session
      const newAdsWatched = session.adsWatched + 1;
      const sessionCompleted = newAdsWatched >= session.adsRequired;

      await db.adSession.update({
        where: { id: session.id },
        data: {
          adsWatched: newAdsWatched,
          completed: sessionCompleted,
          status: sessionCompleted ? 'COMPLETED' : 'ACTIVE'
        }
      });

      // If session is completed, create payment record
      if (sessionCompleted) {
        await this.createPaymentRecord(session.userId, session.purpose, reward * session.adsRequired);
      }

      return {
        success: true,
        sessionCompleted,
        creditsEarned: reward,
        totalAdsWatched: newAdsWatched
      };

    } catch (error) {
      console.error('Record ad view error:', error);
      return {
        success: false,
        sessionCompleted: false,
        creditsEarned: 0,
        totalAdsWatched: 0,
        error: 'Failed to record ad view'
      };
    }
  }

  /**
   * Get session status and progress
   */
  async getSessionStatus(sessionId: string): Promise<{
    success: boolean;
    session?: {
      sessionId: string;
      purpose: string;
      adsRequired: number;
      adsWatched: number;
      completed: boolean;
      status: string;
      expiresAt?: Date;
    };
    error?: string;
  }> {
    try {
      const session = await db.adSession.findUnique({
        where: { sessionId },
        include: {
          adViews: {
            where: { completed: true },
            select: {
              id: true,
              adId: true,
              adType: true,
              duration: true,
              reward: true,
              watchedAt: true
            }
          }
        }
      });

      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      return {
        success: true,
        session: {
          sessionId: session.sessionId,
          purpose: session.purpose,
          adsRequired: session.adsRequired,
          adsWatched: session.adsWatched,
          completed: session.completed,
          status: session.status,
          expiresAt: session.expiresAt ?? undefined
        }
      };

    } catch (error) {
      console.error('Get session status error:', error);
      return {
        success: false,
        error: 'Failed to get session status'
      };
    }
  }

  /**
   * Get user's ad viewing history and earnings
   */
  async getUserAdHistory(userId: string): Promise<{
    success: boolean;
    totalSessions: number;
    totalAdsWatched: number;
    totalEarnings: number;
    recentSessions?: Array<{
      sessionId: string;
      purpose: string;
      adsWatched: number;
      completed: boolean;
      createdAt: Date;
    }>;
    error?: string;
  }> {
    try {
      const sessions = await db.adSession.findMany({
        where: { userId },
        include: {
          adViews: {
            where: { completed: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      const totalSessions = sessions.length;
      const totalAdsWatched = sessions.reduce((sum, session) => sum + session.adsWatched, 0);
      const totalEarnings = sessions.reduce((sum, session) => {
        return sum + session.adViews.reduce((adSum, adView) => adSum + (adView.reward || 0), 0);
      }, 0);

      const recentSessions = sessions.map(session => ({
        sessionId: session.sessionId,
        purpose: session.purpose,
        adsWatched: session.adsWatched,
        completed: session.completed,
        createdAt: session.createdAt
      }));

      return {
        success: true,
        totalSessions,
        totalAdsWatched,
        totalEarnings,
        recentSessions
      };

    } catch (error) {
      console.error('Get user ad history error:', error);
      return {
        success: false,
        totalSessions: 0,
        totalAdsWatched: 0,
        totalEarnings: 0,
        error: 'Failed to get user ad history'
      };
    }
  }

  /**
   * Calculate reward based on ad type and duration
   */
  private calculateReward(adType: string, duration: number): number {
    const baseRewards = {
      'VIDEO': 0.50,
      'INTERSTITIAL': 0.30,
      'BANNER': 0.10,
      'REWARDED': 0.75,
      'PLAYABLE': 0.60
    };

    const baseReward = baseRewards[adType as keyof typeof baseRewards] || 0.25;
    
    // Bonus for longer ads
    const durationBonus = Math.min(duration / 30, 2); // Max 2x bonus for 60+ second ads
    
    return Math.round((baseReward * durationBonus) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Create payment record when ad session is completed
   */
  private async createPaymentRecord(userId: string, purpose: string, amount: number): Promise<void> {
    try {
      await db.payment.create({
        data: {
          userId,
          amount,
          provider: 'AD_CREDITS',
          status: 'COMPLETED',
          description: `Ad session completed for ${purpose}`,
          metadata: JSON.stringify({
            purpose,
            sessionType: 'AD_WATCH',
            completedAt: new Date().toISOString()
          })
        }
      });
    } catch (error) {
      console.error('Create payment record error:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const expiredSessions = await db.adSession.findMany({
        where: {
          expiresAt: { lt: new Date() },
          status: 'ACTIVE'
        }
      });

      for (const session of expiredSessions) {
        await db.adSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' }
        });
      }

      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
    }
  }
}

export const adService = AdService.getInstance();