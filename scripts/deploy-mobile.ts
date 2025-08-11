#!/usr/bin/env tsx

import { PrismaClient, Platform } from '@prisma/client';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface MobileDeploymentConfig {
  version: string;
  buildNumber: string;
  platform: 'ios' | 'android';
  isRequired: boolean;
  changelog: string[];
  downloadUrl: string;
  size: string;
}

async function main() {
  console.log('🚀 Starting mobile deployment process...');

  try {
    // Read mobile config
    const configPath = join(__dirname, '../mobile-config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));

    // Deploy for both platforms
    const platforms: ('ios' | 'android')[] = ['ios', 'android'];

    for (const platform of platforms) {
      console.log(`\n📱 Deploying for ${platform.toUpperCase()}...`);
      
      const platformConfig = config.platforms[platform];
      const deployment: MobileDeploymentConfig = {
        version: config.version,
        buildNumber: config.buildNumber,
        platform: platform as 'ios' | 'android',
        isRequired: false,
        changelog: [
          'Initial release',
          'Modern dating app interface',
          'Real-time messaging with Socket.IO',
          'Location-based matching',
          'Push notifications',
          'Profile verification',
          'Ad-supported free access model'
        ],
        downloadUrl: platformConfig.appStoreUrl,
        size: platformConfig.size
      };

      // Save app version to database
      const appVersion = await prisma.appVersion.upsert({
        where: {
          version_platform: {
            version: deployment.version,
            platform: platform === 'ios' ? Platform.IOS : Platform.ANDROID
          }
        },
        update: {
          buildNumber: deployment.buildNumber,
          isRequired: deployment.isRequired,
          changelog: JSON.stringify(deployment.changelog),
          downloadUrl: deployment.downloadUrl,
          size: deployment.size,
          releaseDate: new Date()
        },
        create: {
          version: deployment.version,
          buildNumber: deployment.buildNumber,
          platform: platform === 'ios' ? Platform.IOS : Platform.ANDROID,
          isRequired: deployment.isRequired,
          changelog: JSON.stringify(deployment.changelog),
          downloadUrl: deployment.downloadUrl,
          size: deployment.size,
          releaseDate: new Date()
        }
      });

      console.log(`✅ App version saved to database: ${appVersion.version} (${appVersion.platform})`);

      // Generate deployment files
      await generateDeploymentFiles(platform, deployment, config);
    }

    console.log('\n🎉 Mobile deployment completed successfully!');
    console.log('\n📋 Deployment Summary:');
    console.log(`   Version: ${config.version}`);
    console.log(`   Build: ${config.buildNumber}`);
    console.log(`   Platforms: iOS, Android`);
    console.log(`   iOS Size: ${config.platforms.ios.size}`);
    console.log(`   Android Size: ${config.platforms.android.size}`);
    console.log(`   iOS URL: ${config.platforms.ios.appStoreUrl}`);
    console.log(`   Android URL: ${config.platforms.android.appStoreUrl}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function generateDeploymentFiles(
  platform: 'ios' | 'android',
  deployment: MobileDeploymentConfig,
  config: any
) {
  const outputDir = join(__dirname, '../mobile-deployment', platform);
  
  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate deployment manifest
  const manifest = {
    version: deployment.version,
    buildNumber: deployment.buildNumber,
    platform,
    releaseDate: new Date().toISOString(),
    size: deployment.size,
    downloadUrl: deployment.downloadUrl,
    checksum: await generateChecksum(), // Placeholder for actual checksum
    changelog: deployment.changelog,
    minOSVersion: platform === 'ios' ? '14.0' : '8.0',
    features: config.features,
    security: config.security,
    deployment: config.deployment
  };

  // Save manifest
  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📄 Generated manifest: ${manifestPath}`);

  // Generate QR code data
  const qrData = {
    url: deployment.downloadUrl,
    platform,
    version: deployment.version,
    timestamp: new Date().toISOString()
  };

  const qrPath = join(outputDir, 'qr-data.json');
  writeFileSync(qrPath, JSON.stringify(qrData, null, 2));
  console.log(`📱 Generated QR data: ${qrPath}`);

  // Generate update check endpoint data
  const updateData = {
    currentVersion: deployment.version,
    platforms: {
      [platform]: {
        version: deployment.version,
        buildNumber: deployment.buildNumber,
        isRequired: deployment.isRequired,
        size: deployment.size,
        downloadUrl: deployment.downloadUrl,
        changelog: deployment.changelog
      }
    }
  };

  const updatePath = join(outputDir, 'update-info.json');
  writeFileSync(updatePath, JSON.stringify(updateData, null, 2));
  console.log(`🔄 Generated update info: ${updatePath}`);

  // Generate app store metadata
  const metadata = {
    title: config.appName,
    description: config.description,
    version: deployment.version,
    buildNumber: deployment.buildNumber,
    platform,
    size: deployment.size,
    author: config.author,
    website: config.website,
    support: config.support,
    features: {
      pushNotifications: config.features.pushNotifications.enabled,
      locationServices: config.features.location.enabled,
      cameraAccess: config.features.camera.enabled,
      offlineMode: config.features.offline.enabled
    },
    screenshots: [
      'https://proximity-dating.com/screenshots/screen1.png',
      'https://proximity-dating.com/screenshots/screen2.png',
      'https://proximity-dating.com/screenshots/screen3.png'
    ],
    keywords: [
      'dating',
      'match',
      'chat',
      'proximity',
      'location',
      'real-time',
      'messaging',
      'social'
    ],
    category: platform === 'ios' ? 'Social Networking' : 'Dating',
    contentRating: '17+',
    privacyPolicy: 'https://proximity-dating.com/privacy',
    termsOfService: 'https://proximity-dating.com/terms'
  };

  const metadataPath = join(outputDir, 'metadata.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`📋 Generated metadata: ${metadataPath}`);
}

async function generateChecksum(): Promise<string> {
  // Placeholder for actual checksum generation
  // In a real implementation, this would generate a SHA-256 checksum of the app binary
  return 'sha256:' + Math.random().toString(36).substring(7);
}

if (require.main === module) {
  main().catch(console.error);
}