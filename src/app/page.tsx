'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Navigation } from '@/components/navigation';
import { SaucyBackground } from '@/components/saucy-background';
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Camera, 
  Fingerprint, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Upload,
  User,
  Lock,
  Play,
  DollarSign,
  Clock,
  Target,
  Smartphone
} from 'lucide-react';

export default function Home() {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState<'discover' | 'matches' | 'messages'>('discover');
  const [verificationStep, setVerificationStep] = useState<'document' | 'facial' | 'biometric' | 'complete'>('document');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [adSession, setAdSession] = useState<{
    sessionId: string;
    adsRequired: number;
    adsWatched: number;
    completed: boolean;
    purpose: string;
  } | null>(null);
  const [currentAd, setCurrentAd] = useState<number>(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  // Mock data for demonstration
  const mockProfiles = [
    {
      id: '1',
      name: 'Sarah',
      age: 28,
      location: '2 miles away',
      bio: 'Adventure seeker looking for someone to explore life with. Love hiking, cooking, and deep conversations.',
      interests: ['Adventure', 'Cooking', 'Travel'],
      image: '/api/placeholder/300/400'
    },
    {
      id: '2',
      name: 'Mike',
      age: 32,
      location: '5 miles away',
      bio: 'Professional by day, artist by night. Looking for genuine connections and good vibes.',
      interests: ['Art', 'Music', 'Photography'],
      image: '/api/placeholder/300/400'
    }
  ];

  const mockAds = [
    {
      id: 'ad_1',
      title: 'Premium Dating Features',
      description: 'Unlock unlimited swipes and see who likes you!',
      duration: 30,
      reward: 0.50,
      type: 'VIDEO'
    },
    {
      id: 'ad_2',
      title: 'Meet Local Singles',
      description: 'Join thousands of verified singles in your area',
      duration: 30,
      reward: 0.50,
      type: 'VIDEO'
    }
  ];

  const AuthForm = () => (
    <Card className="w-full max-w-md mx-auto animate-fade-in bg-black/70 backdrop-blur-sm border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="text-[28px] md:text-[36px] font-black text-pink-600 drop-shadow-xl hover:text-pink-500 transition-colors cursor-pointer transform hover:scale-105 transition-transform"
                style={{ 
                  textShadow: '0 0 15px rgba(236, 72, 153, 0.9), 0 0 30px rgba(236, 72, 153, 0.7)',
                  letterSpacing: '0.03em'
                }}>
                PROXIMITY
              </CardTitle>
        <CardDescription className="text-gray-400">18+ Adult Dating App</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="login" className="text-gray-300 data-[state=active]:bg-pink-600 data-[state=active]:text-white">Login</TabsTrigger>
            <TabsTrigger value="register" className="text-gray-300 data-[state=active]:bg-pink-600 data-[state=active]:text-white">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
            </div>
            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">Login</Button>
            <div className="text-xs text-center text-gray-500">
              <DollarSign className="w-3 h-3 inline mr-1" />
              Watch 2 ads to login - Free access!
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-gray-300">Name</Label>
              <Input id="reg-name" placeholder="Enter your name" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-gray-300">Email</Label>
              <Input id="reg-email" type="email" placeholder="Enter your email" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-gray-300">Password</Label>
              <Input id="reg-password" type="password" placeholder="Create a password" className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-dob" className="text-gray-300">Date of Birth</Label>
              <Input id="reg-dob" type="date" className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <div className="text-xs text-gray-500">
              By registering, you confirm you are 18+ and agree to our Terms of Service
            </div>
            <Button 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setVerificationStep('document')}
            >
              Register & Verify
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const AdWatchingInterface = () => {
    if (!adSession) return null;

    const currentAdData = mockAds[currentAd];
    const progress = (adSession.adsWatched / adSession.adsRequired) * 100;

    const handleWatchAd = () => {
      setIsWatchingAd(true);
      setAdProgress(0);
      
      // Simulate ad watching
      const interval = setInterval(() => {
        setAdProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsWatchingAd(false);
            
            // Update ad session
            const newAdsWatched = adSession.adsWatched + 1;
            const completed = newAdsWatched >= adSession.adsRequired;
            
            setAdSession({
              ...adSession,
              adsWatched: newAdsWatched,
              completed
            });

            // Move to next ad or complete login
            if (completed) {
              // Login completed
              setShowAuth(false);
            } else {
              setCurrentAd(currentAd + 1);
            }
            
            return 100;
          }
          return prev + 2; // Increment by 2% every 100ms
        });
      }, 100);
    };

    return (
      <Card className="w-full max-w-md mx-auto animate-fade-in bg-black/70 backdrop-blur-sm border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-pink-400 flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5" />
            Watch Ads to Login
          </CardTitle>
          <CardDescription className="text-gray-400">
            Watch {adSession.adsRequired - adSession.adsWatched} more ad{adSession.adsRequired - adSession.adsWatched !== 1 ? 's' : ''} to access Proximity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Ad Progress</span>
              <span>{adSession.adsWatched}/{adSession.adsRequired} ads watched</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Ad */}
          <div className="ad-card">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{currentAdData.title}</h3>
            <p className="text-sm opacity-90 mb-4">{currentAdData.description}</p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentAdData.duration}s
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${currentAdData.reward}
              </span>
            </div>
          </div>

          {/* Ad Progress */}
          {isWatchingAd && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Watching Ad</span>
                <span>{adProgress}%</span>
              </div>
              <Progress value={adProgress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                Please watch the entire ad to continue
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleWatchAd}
            disabled={isWatchingAd}
          >
            {isWatchingAd ? (
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 animate-pulse" />
                Watching Ad...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Watch Ad ({currentAdData.duration}s)
              </span>
            )}
          </Button>

          {/* Rewards Info */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-300">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Earn Credits</span>
            </div>
            <p className="text-xs text-blue-400 mt-1">
              Each ad you watch earns you credits and supports free access to Proximity
            </p>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAuth(false)}
              className="text-gray-400 hover:text-white"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const VerificationProcess = () => {
    const steps = [
      { id: 'document', title: 'Document Verification', icon: Upload, completed: verificationStep !== 'document' },
      { id: 'facial', title: 'Facial Recognition', icon: Camera, completed: verificationStep === 'biometric' || verificationStep === 'complete' },
      { id: 'biometric', title: 'Biometric Scan', icon: Fingerprint, completed: verificationStep === 'complete' },
    ];

    const currentStepIndex = steps.findIndex(step => step.id === verificationStep);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    return (
      <Card className="w-full max-w-2xl mx-auto animate-fade-in bg-black/70 backdrop-blur-sm border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-pink-400 flex items-center justify-center gap-2">
            <Shield className="w-6 h-6" />
            Secure Verification
          </CardTitle>
          <CardDescription className="text-gray-400">
            Complete all verification steps to ensure a safe community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Verification Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`verification-step ${
                  verificationStep === step.id
                    ? 'active'
                    : step.completed
                    ? 'completed'
                    : ''
                }`}
              >
                <step.icon className={`w-8 h-8 mx-auto mb-2 ${
                  step.completed ? 'text-green-600' : verificationStep === step.id ? 'text-pink-600' : 'text-gray-400'
                }`} />
                <h3 className="text-sm font-medium">{step.title}</h3>
                {step.completed && <CheckCircle className="w-4 h-4 mx-auto mt-1 text-green-600" />}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="bg-gray-800/50 rounded-lg p-6">
            {verificationStep === 'document' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                  <Upload className="w-5 h-5" />
                  Upload Government ID
                </h3>
                <p className="text-sm text-gray-400">
                  Please upload a clear photo of your government-issued ID (Driver's License, Passport, or ID Card)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-400">Front of ID</p>
                    <Button variant="outline" size="sm" className="mt-2 text-gray-300 border-gray-600 hover:bg-gray-700">
                      Upload
                    </Button>
                  </div>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-400">Back of ID (if applicable)</p>
                    <Button variant="outline" size="sm" className="mt-2 text-gray-300 border-gray-600 hover:bg-gray-700">
                      Upload
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setVerificationStep('document')} className="text-gray-300 border-gray-600 hover:bg-gray-700">
                    Back
                  </Button>
                  <Button onClick={() => setVerificationStep('facial')} className="bg-pink-600 hover:bg-pink-700 text-white">
                    Continue to Facial Recognition
                  </Button>
                </div>
              </div>
            )}

            {verificationStep === 'facial' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                  <Camera className="w-5 h-5" />
                  Facial Recognition
                </h3>
                <p className="text-sm text-gray-400">
                  We'll use facial recognition to verify your identity and ensure you're a real person
                </p>
                <div className="bg-black rounded-lg p-8 text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-white" />
                  <p className="text-white text-sm">Position your face in the frame</p>
                  <div className="w-32 h-32 mx-auto mt-4 border-2 border-white rounded-lg flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Liveness detection enabled
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Age estimation active
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setVerificationStep('document')} className="text-gray-300 border-gray-600 hover:bg-gray-700">
                    Back
                  </Button>
                  <Button onClick={() => setVerificationStep('biometric')} className="bg-pink-600 hover:bg-pink-700 text-white">
                    Continue to Biometric Scan
                  </Button>
                </div>
              </div>
            )}

            {verificationStep === 'biometric' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                  <Fingerprint className="w-5 h-5" />
                  Biometric Scan
                </h3>
                <p className="text-sm text-gray-400">
                  Complete your verification with a biometric scan for maximum security
                </p>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8 text-center">
                  <Fingerprint className="w-16 h-16 mx-auto mb-4 text-white" />
                  <p className="text-white text-sm">Place your finger on the scanner</p>
                  <div className="w-32 h-32 mx-auto mt-4 border-2 border-white rounded-full flex items-center justify-center">
                    <Fingerprint className="w-12 h-12 text-gray-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Fingerprint authentication ready
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Secure encryption enabled
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setVerificationStep('facial')} className="text-gray-300 border-gray-600 hover:bg-gray-700">
                    Back
                  </Button>
                  <Button onClick={() => setVerificationStep('complete')} className="bg-pink-600 hover:bg-pink-700 text-white">
                    Complete Verification
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const DatingInterface = () => (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
          <Button
            variant={currentView === 'discover' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('discover')}
            className="flex items-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Discover
          </Button>
          <Button
            variant={currentView === 'matches' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('matches')}
            className="flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Matches
          </Button>
          <Button
            variant={currentView === 'messages' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('messages')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Messages
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {currentView === 'discover' && (
        <div className="swipe-container">
          <div className="swipe-profile">
          <div className="swipe-profile-image">
            <img 
              src="/api/placeholder/300/400" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
            <div className="swipe-profile-overlay">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Sarah, 28</h3>
                <div className="flex items-center text-white text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  2 miles away
                </div>
              </div>
              <p className="text-white text-sm mb-3">
                Adventure seeker looking for someone to explore life with. Love hiking, cooking, and deep conversations.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Adventure', 'Cooking', 'Travel'].map((interest, index) => (
                  <Badge key={index} variant="secondary" className="interest-tag">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="swipe-actions">
            <Button size="lg" className="swipe-button bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full w-14 h-14">
              <X className="w-6 h-6" />
            </Button>
            <Button size="lg" className="swipe-button bg-pink-600 hover:bg-pink-700 text-white rounded-full w-16 h-16">
              <Heart className="w-8 h-8" />
            </Button>
            <Button size="lg" className="swipe-button bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14">
              <Star className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {currentView === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProfiles.map((profile) => (
            <Card key={profile.id} className="profile-card card-hover">
              <div className="h-48 flex items-center justify-center">
                <img 
                  src={profile.image} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{profile.name}, {profile.age}</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    {profile.location}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{profile.bio}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
                  Message
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {currentView === 'messages' && (
        <div className="space-y-4">
          {mockProfiles.map((profile) => (
            <Card key={profile.id} className="flex items-center p-4 card-hover">
              <Avatar className="w-12 h-12 mr-4">
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold">{profile.name}, {profile.age}</h4>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-sm text-gray-600">Hey! How are you doing?</p>
              </div>
              <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                Reply
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <SaucyBackground>
      <Navigation currentPath={pathname} />
      
      <div className="container mx-auto px-4 py-8">
        {showAuth ? (
          <div className="space-y-6">
            {verificationStep === 'complete' ? <DatingInterface /> : <VerificationProcess />}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 animate-slide-up">
              <div className="space-y-4">
                <div className="relative">
                <h1 className="text-[32px] md:text-[48px] lg:text-[64px] xl:text-[80px] font-black text-pink-600 drop-shadow-2xl hover:text-pink-500 transition-colors cursor-pointer transform hover:scale-105 transition-transform animate-pulse" 
                    style={{ 
                      textShadow: '0 0 20px rgba(236, 72, 153, 0.9), 0 0 40px rgba(236, 72, 153, 0.7), 0 0 60px rgba(236, 72, 153, 0.5)',
                      letterSpacing: '0.05em'
                    }}>
                    PROXIMITY
                </h1>
                <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-30 -z-10 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 blur-2xl -z-10"></div>
              </div>
                <p className="text-xl text-gray-300">Find Your Perfect Match Nearby</p>
                <div className="flex justify-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    18+ Only
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location Based
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Ad Supported
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <Button 
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-lg px-8 py-3 text-white shadow-lg"
                  onClick={() => {
                    setAdSession({
                      sessionId: 'session_' + Date.now(),
                      adsRequired: 2,
                      adsWatched: 0,
                      completed: false,
                      purpose: 'login'
                    });
                    setShowAuth(true);
                  }}
                >
                  Get Started - Watch 2 Ads to Login
                </Button>
                <p className="text-sm text-gray-400">By continuing, you agree to our Terms of Service and confirm you are 18+ years old.</p>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-12 animate-slide-up">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-200">Free Access with Ads</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center p-6 card-hover bg-black/50 backdrop-blur-sm border-gray-700">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-200">Completely Free</h3>
                  <p className="text-sm text-gray-400">Watch just 2 ads to login and access all features. No credit card required.</p>
                </Card>
                <Card className="text-center p-6 card-hover bg-black/50 backdrop-blur-sm border-gray-700">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-200">Quick Access</h3>
                  <p className="text-sm text-gray-400">Each ad is only 30 seconds. Get instant access to the dating platform.</p>
                </Card>
                <Card className="text-center p-6 card-hover bg-black/50 backdrop-blur-sm border-gray-700">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-200">Secure & Private</h3>
                  <p className="text-sm text-gray-400">Your data is protected with advanced biometric verification.</p>
                </Card>
              </div>
            </div>

            {/* Security Section */}
            <div className="mt-12 animate-slide-up">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-200">Advanced Security</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center p-6 card-hover bg-black/50 backdrop-blur-sm border-gray-700">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-200">Biometric Authentication</h3>
                  <p className="text-sm text-gray-400">Advanced facial recognition and fingerprint verification powered by Verisign technology.</p>
                </Card>
                <Card className="text-center p-6 card-hover bg-black/50 backdrop-blur-sm border-gray-700">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-200">Identity Verification</h3>
                  <p className="text-sm text-gray-400">Government ID verification with liveness detection to ensure real users only.</p>
                </Card>
                <Card className="text-center p-6 card-hover bg-black/50 backdrop-blur-sm border-gray-700">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-200">Compliance & Safety</h3>
                  <p className="text-sm text-gray-400">Fully compliant with US and Florida regulations for adult dating platforms.</p>
                </Card>
              </div>
            </div>

            {/* Mobile Apps Section */}
            <div className="mt-12 animate-slide-up">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-200">Take Proximity Mobile</h2>
              <p className="text-center text-gray-400 mb-8">Download our mobile apps for the best dating experience on the go</p>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Android App */}
                <Card className="bg-black/70 backdrop-blur-sm border-gray-700 card-hover">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="text-green-500 font-bold text-xl">A</div>
                    </div>
                    <CardTitle className="text-green-400">Android App</CardTitle>
                    <CardDescription>Available on Google Play Store</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-400 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Full feature set</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Push notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Location services</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Offline mode</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <a href="/mobile" className="flex items-center justify-center gap-2">
                          Download for Android
                        </a>
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        Version 1.0.0 • 45MB
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* iOS App */}
                <Card className="bg-black/70 backdrop-blur-sm border-gray-700 card-hover">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gray-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="text-gray-300 font-bold text-xl">i</div>
                    </div>
                    <CardTitle className="text-gray-300">iOS App</CardTitle>
                    <CardDescription>Available on App Store</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-400 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span>Full feature set</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span>Face ID/Touch ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span>iCloud sync</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span>Widget support</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                        <a href="/mobile" className="flex items-center justify-center gap-2">
                          Download for iOS
                        </a>
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        Version 1.0.0 • 52MB
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-8">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Mobile Apps Available Now
                </Badge>
              </div>
            </div>

            {/* App Preview */}
            <div className="mt-12 animate-slide-up">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-200">App Preview</h2>
              <div className="bg-black/80 backdrop-blur-sm rounded-lg shadow-2xl p-4 max-w-sm mx-auto border border-gray-700">
                <div className="flex items-center justify-between p-4 bg-black/60 shadow-sm mb-4 rounded-lg">
                  <h1 className="text-[28px] md:text-[36px] font-black text-pink-600 drop-shadow-xl hover:text-pink-500 transition-colors cursor-pointer transform hover:scale-105 transition-transform"
                      style={{ 
                        textShadow: '0 0 15px rgba(236, 72, 153, 0.9), 0 0 30px rgba(236, 72, 153, 0.7)',
                        letterSpacing: '0.03em'
                      }}>
                      PROXIMITY
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                      <Shield className="w-5 h-5 mr-1" />
                      Admin
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-700 text-white">U</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex justify-around p-2 bg-gray-900 mb-4 rounded-lg">
                  <Button variant="default" className="flex-1 bg-pink-600 hover:bg-pink-700">Discover</Button>
                  <Button variant="ghost" className="flex-1 text-gray-300 hover:text-white">Matches</Button>
                  <Button variant="ghost" className="flex-1 text-gray-300 hover:text-white">Messages</Button>
                </div>
                <DatingInterface />
              </div>
            </div>
          </div>
        )}
      </div>
    </SaucyBackground>
  );
}