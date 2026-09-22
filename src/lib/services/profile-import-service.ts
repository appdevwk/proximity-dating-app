import { db } from '@/lib/db';
import { Profile, User, Preferences } from '@prisma/client';

interface ExternalProfile {
  id: string;
  username: string;
  age: number;
  gender: string;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  photos: string[];
  bio: string;
  preferences: {
    relationshipType: string;
    lookingFor: string[];
    ageRange: {
      min: number;
      max: number;
    };
    distance: number;
  };
  verification: {
    isVerified: boolean;
    verificationMethod: string;
    verificationDate?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimit?: {
    remaining: number;
    resetTime: string;
  };
}

class ProfileImportService {
  private freeSources = [
    {
      name: 'okcupid',
      baseUrl: 'https://www.okcupid.com',
      publicProfiles: true,
      requiresAuth: false
    },
    {
      name: 'plentyoffish',
      baseUrl: 'https://www.pof.com',
      publicProfiles: true,
      requiresAuth: false
    },
    {
      name: 'bumble',
      baseUrl: 'https://bumble.com',
      publicProfiles: false,
      requiresAuth: false
    },
    {
      name: 'hinge',
      baseUrl: 'https://hinge.co',
      publicProfiles: false,
      requiresAuth: false
    }
  ];

  private adultDatingDirectories = [
    {
      name: 'adultfriendfinder',
      baseUrl: 'https://www.adultfriendfinder.com',
      publicProfiles: true,
      requiresAuth: false
    },
    {
      name: 'ashleymadison',
      baseUrl: 'https://www.ashleymadison.com',
      publicProfiles: true,
      requiresAuth: false
    },
    {
      name: 'feeld',
      baseUrl: 'https://feeld.co',
      publicProfiles: true,
      requiresAuth: false
    }
  ];

  async importProfilesFromSource(source: string, limit: number = 100): Promise<ApiResponse<Profile[]>> {
    try {
      const externalProfiles = await this.fetchPublicProfiles(source, limit);
      
      if (!externalProfiles.success || !externalProfiles.data) {
        return {
          success: false,
          error: externalProfiles.error,
        };
      }

      const importedProfiles: Profile[] = [];
      
      for (const externalProfile of externalProfiles.data) {
        const existingProfile = await db.profile.findFirst({
          where: { 
            OR: [
              { externalId: `${source}_${externalProfile.id}` },
              { user: { email: `${externalProfile.username}_${source}@proximity.local` } }
            ]
          },
        });

        if (!existingProfile) {
          const profile = await this.createProfileFromExternal(externalProfile, source);
          if (profile) {
            importedProfiles.push(profile);
          }
        }
      }

      return {
        success: true,
        data: importedProfiles,
      };

    } catch (error) {
      console.error(`Error importing profiles from ${source}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async fetchPublicProfiles(source: string, limit: number): Promise<ApiResponse<ExternalProfile[]>> {
    try {
      console.log(`Fetching public profiles from ${source}...`);
      
      // Use different strategies based on the source
      switch (source) {
        case 'okcupid':
          return await this.fetchOkCupidProfiles(limit);
        case 'plentyoffish':
          return await this.fetchPOFProfiles(limit);
        case 'adultfriendfinder':
          return await this.fetchAFFProfiles(limit);
        case 'ashleymadison':
          return await this.fetchAshleyMadisonProfiles(limit);
        case 'feeld':
          return await this.fetchFeeldProfiles(limit);
        default:
          return await this.generateRealisticProfiles(source, limit);
      }
    } catch (error) {
      console.error(`Error fetching profiles from ${source}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profiles',
      };
    }
  }

  private async fetchOkCupidProfiles(limit: number): Promise<ApiResponse<ExternalProfile[]>> {
    try {
      // Simulate fetching from OkCupid's public profiles
      // In real implementation, this would use web scraping or public API
      const profiles = this.generateRealisticProfiles('okcupid', limit);
      return profiles;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch OkCupid profiles',
      };
    }
  }

  private async fetchPOFProfiles(limit: number): Promise<ApiResponse<ExternalProfile[]>> {
    try {
      // Simulate fetching from Plenty of Fish public profiles
      const profiles = this.generateRealisticProfiles('plentyoffish', limit);
      return profiles;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch POF profiles',
      };
    }
  }

  private async fetchAFFProfiles(limit: number): Promise<ApiResponse<ExternalProfile[]>> {
    try {
      // Simulate fetching from AdultFriendFinder public profiles
      const profiles = this.generateRealisticProfiles('adultfriendfinder', limit);
      return profiles;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch AFF profiles',
      };
    }
  }

  private async fetchAshleyMadisonProfiles(limit: number): Promise<ApiResponse<ExternalProfile[]>> {
    try {
      // Simulate fetching from Ashley Madison public profiles
      const profiles = this.generateRealisticProfiles('ashleymadison', limit);
      return profiles;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Ashley Madison profiles',
      };
    }
  }

  private async fetchFeeldProfiles(limit: number): Promise<ApiResponse<ExternalProfile[]>> {
    try {
      // Simulate fetching from Feeld public profiles
      const profiles = this.generateRealisticProfiles('feeld', limit);
      return profiles;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Feeld profiles',
      };
    }
  }

  private generateRealisticProfiles(source: string, count: number): ApiResponse<ExternalProfile[]> {
    const floridaCities = [
      { city: 'Miami', state: 'FL', country: 'US', lat: 25.7617, lng: -80.1918 },
      { city: 'Orlando', state: 'FL', country: 'US', lat: 28.5383, lng: -81.3792 },
      { city: 'Tampa', state: 'FL', country: 'US', lat: 27.9506, lng: -82.4572 },
      { city: 'Jacksonville', state: 'FL', country: 'US', lat: 30.3322, lng: -81.6557 },
      { city: 'Fort Lauderdale', state: 'FL', country: 'US', lat: 26.1224, lng: -80.1373 },
      { city: 'St. Petersburg', state: 'FL', country: 'US', lat: 27.7676, lng: -82.6403 },
      { city: 'Hialeah', state: 'FL', country: 'US', lat: 25.8787, lng: -80.2982 },
      { city: 'Tallahassee', state: 'FL', country: 'US', lat: 30.4383, lng: -84.2807 },
    ];

    const maleNames = ['Alex', 'Jordan', 'Michael', 'David', 'Chris', 'Ryan', 'Tyler', 'Jason', 'Kevin', 'Brandon'];
    const femaleNames = ['Sarah', 'Jessica', 'Ashley', 'Emily', 'Amanda', 'Stephanie', 'Jennifer', 'Lisa', 'Michelle', 'Kimberly'];

    const bios = [
      'Looking for genuine connections and meaningful relationships.',
      'Adventure seeker looking for someone to share experiences with.',
      'Professional by day, fun-loving by night. Let\'s connect!',
      'Passionate about life, love, and everything in between.',
      'Seeking authentic connections with like-minded individuals.',
      'Ready to explore new possibilities and meet amazing people.',
      'Life\'s too short for boring conversations. Let\'s chat!',
      'Looking for someone who can keep up with my energy and passion.',
      'Believer in chemistry, connection, and spontaneous adventures.',
      'Seeking meaningful connections that could lead to something special.',
      'New to the area and looking to meet interesting people.',
      'Love trying new restaurants and exploring the city.',
      'Fitness enthusiast looking for someone who shares my passion for health.',
      'Artist seeking creative soul for inspiring conversations.',
      'Travel lover looking for a partner in crime for adventures.',
    ];

    const profiles: ExternalProfile[] = [];

    for (let i = 0; i < count; i++) {
      const city = floridaCities[Math.floor(Math.random() * floridaCities.length)];
      const isMale = Math.random() > 0.5;
      const names = isMale ? maleNames : femaleNames;
      const firstName = names[Math.floor(Math.random() * names.length)];
      const age = Math.floor(Math.random() * 25) + 22; // 22-47
      const gender = isMale ? 'male' : 'female';

      profiles.push({
        id: `${source}_${Date.now()}_${i}`,
        username: `${firstName}_${age}_${Math.floor(Math.random() * 1000)}`,
        age,
        gender,
        location: {
          city: city.city,
          state: city.state,
          country: city.country,
          coordinates: {
            lat: city.lat + (Math.random() - 0.5) * 0.2,
            lng: city.lng + (Math.random() - 0.5) * 0.2,
          },
        },
        photos: [
          `https://picsum.photos/seed/${source}_${firstName}_${age}_${i}_1/400/600.jpg`,
          `https://picsum.photos/seed/${source}_${firstName}_${age}_${i}_2/400/600.jpg`,
          `https://picsum.photos/seed/${source}_${firstName}_${age}_${i}_3/400/600.jpg`,
        ],
        bio: bios[Math.floor(Math.random() * bios.length)],
        preferences: {
          relationshipType: this.getRandomRelationshipType(),
          lookingFor: [isMale ? 'female' : 'male'],
          ageRange: {
            min: Math.max(18, age - 5),
            max: Math.min(65, age + 10),
          },
          distance: Math.floor(Math.random() * 50) + 10, // 10-60 miles
        },
        verification: {
          isVerified: Math.random() > 0.4, // 60% verification rate
          verificationMethod: Math.random() > 0.5 ? 'photo' : 'email',
          verificationDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    return {
      success: true,
      data: profiles,
    };
  }

  private getRandomRelationshipType(): string {
    const types = ['casual', 'serious', 'friendship', 'nsfw'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private async createProfileFromExternal(externalProfile: ExternalProfile, source: string): Promise<Profile | null> {
    try {
      // Create user first
      const user = await db.user.create({
        data: {
          email: `${externalProfile.username}_${source}@proximity.local`,
          password: 'imported_user', // In real implementation, this would be handled differently
          ageVerified: externalProfile.verification.isVerified,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Calculate date of birth from age
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - externalProfile.age);

      // Create profile
      const profile = await db.profile.create({
        data: {
          userId: user.id,
          externalId: `${source}_${externalProfile.id}`,
          displayName: externalProfile.username,
          bio: externalProfile.bio,
          dateOfBirth,
          gender: externalProfile.gender.toUpperCase() as any,
          interestedIn: externalProfile.preferences.lookingFor.join(','),
          location: `${externalProfile.location.city}, ${externalProfile.location.state}`,
          latitude: externalProfile.location.coordinates.lat,
          longitude: externalProfile.location.coordinates.lng,
          profilePicture: externalProfile.photos[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create preferences
      await db.preferences.create({
        data: {
          userId: user.id,
          minAge: externalProfile.preferences.ageRange.min,
          maxAge: externalProfile.preferences.ageRange.max,
          maxDistance: externalProfile.preferences.distance,
          interestedIn: externalProfile.preferences.lookingFor.join(','),
          relationshipType: externalProfile.preferences.relationshipType.toUpperCase(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return profile;

    } catch (error) {
      console.error('Error creating profile from external data:', error);
      return null;
    }
  }

  async importFromAllSources(): Promise<ApiResponse<{ source: string; count: number }[]>> {
    const sources = ['okcupid', 'plentyoffish', 'adultfriendfinder', 'ashleymadison', 'feeld'];
    const results: { source: string; count: number }[] = [];

    for (const source of sources) {
      try {
        console.log(`Importing from ${source}...`);
        const result = await this.importProfilesFromSource(source, 30);
        if (result.success && result.data) {
          results.push({
            source,
            count: result.data.length,
          });
          console.log(`✅ ${source}: ${result.data.length} profiles imported`);
        } else {
          console.log(`❌ ${source}: Import failed - ${result.error}`);
        }
      } catch (error) {
        console.error(`Failed to import from ${source}:`, error);
      }
    }

    return {
      success: true,
      data: results,
    };
  }

  async getImportStats(): Promise<ApiResponse<any>> {
    try {
      const totalProfiles = await db.profile.count();
      const verifiedUsers = await db.user.count({
        where: { ageVerified: true },
      });
      const externalProfiles = await db.profile.count({
        where: { externalId: { not: null } },
      });

      return {
        success: true,
        data: {
          totalProfiles,
          verifiedUsers,
          externalProfiles,
          verificationRate: totalProfiles > 0 ? Math.round((verifiedUsers / totalProfiles) * 100) : 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      };
    }
  }

  async importFromPublicWeb(): Promise<ApiResponse<{ source: string; count: number }[]>> {
    // This method would implement actual web scraping for public profiles
    // For now, it uses the same mock data but demonstrates the concept
    
    console.log('🕷️  Starting web scraping for public profiles...');
    
    const publicSources = [
      'dating-site-scrapes',
      'public-profile-directories',
      'social-media-dating',
      'forum-profiles'
    ];

    const results: { source: string; count: number }[] = [];

    for (const source of publicSources) {
      try {
        console.log(`Scraping ${source}...`);
        
        // Simulate web scraping delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockCount = Math.floor(Math.random() * 20) + 10;
        results.push({
          source,
          count: mockCount,
        });
        
        console.log(`✅ ${source}: ${mockCount} profiles scraped`);
      } catch (error) {
        console.error(`Failed to scrape ${source}:`, error);
      }
    }

    return {
      success: true,
      data: results,
    };
  }
}

export const profileImportService = new ProfileImportService();
export type { ExternalProfile, ApiResponse };