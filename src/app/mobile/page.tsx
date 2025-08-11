'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Download, 
  Apple, 
  Smartphone as Android, 
  CheckCircle, 
  AlertCircle, 
  QrCode,
  Share2,
  Settings,
  Shield,
  Zap,
  Star,
  Users,
  Heart,
  MessageCircle,
  MapPin
} from 'lucide-react';
import { SaucyBackground } from '@/components/saucy-background';

interface MobileDeployment {
  platform: 'android' | 'ios';
  status: 'available' | 'beta' | 'coming-soon';
  version: string;
  size: string;
  features: string[];
  downloadUrl?: string;
  qrCode?: string;
}

export default function MobilePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios'>('android');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'downloading' | 'installing' | 'installed'>('idle');

  const mobileDeployments: MobileDeployment[] = [
    {
      platform: 'android',
      status: 'available',
      version: '1.0.0',
      size: '45MB',
      features: [
        'Full feature set',
        'Push notifications',
        'Offline mode',
        'Camera integration',
        'Location services',
        'Biometric login'
      ],
      downloadUrl: 'https://play.google.com/store/apps/details?id=com.proximity.dating',
      qrCode: '/api/qr/android'
    },
    {
      platform: 'ios',
      status: 'beta',
      version: '1.0.0-beta',
      size: '52MB',
      features: [
        'Full feature set',
        'Push notifications',
        'Face ID/Touch ID',
        'Apple Pay integration',
        'iCloud sync',
        'Widget support'
      ],
      downloadUrl: 'https://apps.apple.com/app/proximity-dating/id1234567890',
      qrCode: '/api/qr/ios'
    }
  ];

  const currentDeployment = mobileDeployments.find(d => d.platform === selectedPlatform);

  const handleDownload = async () => {
    setIsDownloading(true);
    setInstallStatus('downloading');
    
    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setInstallStatus('installing');
          
          // Simulate installation
          setTimeout(() => {
            setInstallStatus('installed');
            setIsDownloading(false);
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Proximity Dating App',
          text: 'Download the Proximity Dating App for Android and iOS!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const getStatusColor = (status: MobileDeployment['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'beta': return 'bg-yellow-500';
      case 'coming-soon': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: MobileDeployment['status']) => {
    switch (status) {
      case 'available': return 'Available Now';
      case 'beta': return 'Beta Version';
      case 'coming-soon': return 'Coming Soon';
      default: return 'Unknown';
    }
  };

  return (
    <SaucyBackground>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-pink-600 mb-4 drop-shadow-lg">
              PROXIMITY
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Take your dating experience mobile
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Smartphone className="w-5 h-5 mr-2" />
              Mobile Apps Available
            </Badge>
          </div>

          {/* Platform Selection */}
          <div className="flex justify-center mb-8">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-1 flex">
              <Button
                variant={selectedPlatform === 'android' ? 'default' : 'ghost'}
                onClick={() => setSelectedPlatform('android')}
                className="flex items-center gap-2"
              >
                <Android className="w-5 h-5" />
                Android
              </Button>
              <Button
                variant={selectedPlatform === 'ios' ? 'default' : 'ghost'}
                onClick={() => setSelectedPlatform('ios')}
                className="flex items-center gap-2"
              >
                <Apple className="w-5 h-5" />
                iOS
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* App Info */}
            <Card className="bg-black/70 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {selectedPlatform === 'android' ? (
                      <Android className="w-6 h-6 text-green-500" />
                    ) : (
                      <Apple className="w-6 h-6 text-gray-300" />
                    )}
                    {selectedPlatform === 'android' ? 'Android App' : 'iOS App'}
                  </CardTitle>
                  <Badge className={getStatusColor(currentDeployment?.status || 'coming-soon')}>
                    {getStatusText(currentDeployment?.status || 'coming-soon')}
                  </Badge>
                </div>
                <CardDescription>
                  Version {currentDeployment?.version} • {currentDeployment?.size}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Features</h3>
                  <div className="space-y-2">
                    {currentDeployment?.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Requirements</h3>
                  <div className="space-y-1 text-sm text-gray-400">
                    {selectedPlatform === 'android' ? (
                      <>
                        <div>• Android 8.0 or later</div>
                        <div>• 2GB RAM minimum</div>
                        <div>• 100MB storage space</div>
                      </>
                    ) : (
                      <>
                        <div>• iOS 14.0 or later</div>
                        <div>• iPhone 6s or later</div>
                        <div>• 150MB storage space</div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Section */}
            <Card className="bg-black/70 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-6 h-6" />
                  Download & Install
                </CardTitle>
                <CardDescription>
                  Get the app on your {selectedPlatform === 'android' ? 'Android' : 'iOS'} device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Download Progress */}
                {isDownloading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>
                        {installStatus === 'downloading' ? 'Downloading...' : 'Installing...'}
                      </span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <Progress value={downloadProgress} className="h-2" />
                  </div>
                )}

                {/* Install Status */}
                {installStatus === 'installed' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      App installed successfully! You can now open Proximity from your home screen.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <span className="flex items-center gap-2">
                        {installStatus === 'downloading' ? 'Downloading...' : 'Installing...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download for {selectedPlatform === 'android' ? 'Android' : 'iOS'}
                      </span>
                    )}
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share App
                  </Button>
                </div>

                {/* QR Code Section */}
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-3">Or scan QR code:</p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QrCode className="w-32 h-32 text-black" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Point your camera to download
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-black/70 backdrop-blur-sm border-gray-700 text-center">
              <CardContent className="pt-6">
                <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Lightning Fast</h3>
                <p className="text-gray-400 text-sm">
                  Optimized for mobile performance with instant loading and smooth animations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/70 backdrop-blur-sm border-gray-700 text-center">
              <CardContent className="pt-6">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Secure & Private</h3>
                <p className="text-gray-400 text-sm">
                  End-to-end encryption and advanced privacy controls for your safety.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/70 backdrop-blur-sm border-gray-700 text-center">
              <CardContent className="pt-6">
                <Star className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Premium Features</h3>
                <p className="text-gray-400 text-sm">
                  Access exclusive features and enhanced matching algorithms.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* App Preview */}
          <Card className="bg-black/70 backdrop-blur-sm border-gray-700 mb-12">
            <CardHeader>
              <CardTitle className="text-center">App Preview</CardTitle>
              <CardDescription className="text-center">
                See what the Proximity Dating App looks like on mobile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Mock phone screens */}
                <div className="bg-black rounded-lg p-4 mx-auto">
                  <div className="bg-gray-900 rounded-lg p-3 w-32 h-64 mx-auto">
                    <div className="bg-pink-600 h-8 rounded mb-2"></div>
                    <div className="space-y-2">
                      <div className="bg-gray-700 h-16 rounded"></div>
                      <div className="bg-gray-700 h-16 rounded"></div>
                      <div className="bg-gray-700 h-16 rounded"></div>
                    </div>
                    <div className="bg-pink-600 h-12 rounded mt-4"></div>
                  </div>
                </div>
                
                <div className="bg-black rounded-lg p-4 mx-auto">
                  <div className="bg-gray-900 rounded-lg p-3 w-32 h-64 mx-auto">
                    <div className="bg-pink-600 h-8 rounded mb-2"></div>
                    <div className="bg-gray-700 h-32 rounded mb-2"></div>
                    <div className="flex justify-between">
                      <div className="bg-pink-600 h-8 w-8 rounded-full"></div>
                      <div className="bg-pink-600 h-8 w-8 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black rounded-lg p-4 mx-auto">
                  <div className="bg-gray-900 rounded-lg p-3 w-32 h-64 mx-auto">
                    <div className="bg-pink-600 h-8 rounded mb-2"></div>
                    <div className="space-y-1">
                      <div className="bg-gray-700 h-3 rounded"></div>
                      <div className="bg-gray-700 h-3 rounded"></div>
                      <div className="bg-gray-700 h-3 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Find Your Match?
            </h2>
            <p className="text-gray-300 mb-8">
              Join thousands of users already enjoying the Proximity Dating App on their mobile devices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white">
                <Users className="w-5 h-5 mr-2" />
                Download Now
              </Button>
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <Heart className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SaucyBackground>
  );
}