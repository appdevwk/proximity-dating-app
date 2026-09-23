'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/use-session';
import { Save, ArrowLeft, UserRound, Upload, MapPin, Navigation as NavigationIcon } from 'lucide-react';
import { AdBanner } from '@/components/ad-manager';
import type { GenderValue, UserMe } from '@/lib/types';

const GENDERS: GenderValue[] = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'];
const RELATIONSHIP_TYPES = ['CASUAL', 'SERIOUS', 'FRIENDSHIP', 'MARRIAGE', 'SUGAR_DATING', 'NSFW'];

export default function ProfileEditPage() {
  const router = useRouter();
  const { status } = useSession();
  const { toast } = useToast();

  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<GenderValue>('OTHER');
  const [interestedIn, setInterestedIn] = useState<GenderValue[]>([]);
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [approximating, setApproximating] = useState(false);
  const [showDistance, setShowDistance] = useState(true);
  const [profilePicture, setProfilePicture] = useState('');
  const [uploading, setUploading] = useState(false);
  const [relationshipType, setRelationshipType] = useState<string[]>([]);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(100);
  const [maxDistance, setMaxDistance] = useState(50);
  const [lookingFor, setLookingFor] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    void fetch('/api/user/me', { cache: 'no-store' })
      .then((response) =>
        response.ok ? (response.json() as Promise<UserMe>) : null
      )
      .then((data) => {
        if (!data) return;
        setMe(data);
        setDisplayName(data.profile?.displayName ?? data.user.name ?? '');
        setBio(data.profile?.bio ?? '');
        setGender(data.profile?.gender ?? 'OTHER');
        setInterestedIn(data.profile?.interestedIn ?? []);
        setLocation(data.profile?.location ?? '');
        setShowDistance(data.profile?.showDistance ?? true);
        setProfilePicture(data.profile?.profilePicture ?? '');
        setRelationshipType(data.preferences?.relationshipType ?? []);
        setMinAge(data.preferences?.minAge ?? 18);
        setMaxAge(data.preferences?.maxAge ?? 100);
        setMaxDistance(data.preferences?.maxDistance ?? 50);
        setLookingFor(data.preferences?.lookingFor ?? '');
      })
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, [status, router]);

  const toggleGender = (value: GenderValue) => {
    setInterestedIn((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleRelationship = (value: string) => {
    setRelationshipType((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const onUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/profiles/photo', { method: 'POST', body });
      if (response.status === 401) {
        router.replace('/');
        return;
      }
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (response.ok && data?.url) {
        setProfilePicture(data.url);
        toast({ title: 'Photo uploaded', description: 'Your new profile picture is ready.' });
      } else {
        toast({ title: 'Upload failed', description: data?.error ?? 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Upload failed', description: 'Network error, please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const persistLocation = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/user/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.status === 401) {
      router.replace('/');
      return;
    }
    const data = (await response.json().catch(() => null)) as {
      location?: string | null;
      error?: string;
    } | null;
    if (response.ok) {
      if (data?.location) setLocation(data.location);
      toast({ title: 'Location saved', description: "You'll now see nearby singles and distances." });
    } else {
      toast({
        title: 'Could not save location',
        description: data?.error ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const saveApproximateLocation = async () => {
    setApproximating(true);
    try {
      await persistLocation({ useIpApproximate: true });
    } catch {
      toast({ title: 'Network error', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setApproximating(false);
    }
  };

  const saveMyLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast({
        title: 'Location unavailable',
        description: 'Your browser does not support location services. You can type your city above instead.',
        variant: 'destructive',
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await persistLocation({ latitude, longitude });
        } catch {
          toast({ title: 'Network error', description: 'Please try again.', variant: 'destructive' });
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        const messages: Record<number, string> = {
          1: 'Location permission denied — you can still type your city above.',
          2: 'Could not determine your location.',
          3: 'Location request timed out.',
        };
        toast({
          title: 'Location unavailable',
          description: messages[error.code] ?? 'Could not get your location.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const save = async () => {
    if (displayName.trim().length < 2) {
      toast({ title: 'Check your name', description: 'Display name must be at least 2 characters.', variant: 'destructive' });
      return;
    }
    if (interestedIn.length === 0) {
      toast({ title: 'Pick a preference', description: 'Select at least one gender you are interested in.', variant: 'destructive' });
      return;
    }
    if (minAge > maxAge) {
      toast({ title: 'Age range problem', description: 'Min age cannot be greater than max age.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            displayName: displayName.trim(),
            bio: bio.trim() ? bio.trim() : null,
            gender,
            interestedIn,
            location: location.trim() ? location.trim() : null,
            showDistance,
            profilePicture: profilePicture.trim() ? profilePicture.trim() : null,
          },
          preferences: {
            minAge,
            maxAge,
            maxDistance,
            relationshipType,
            lookingFor: lookingFor.trim() ? lookingFor.trim() : null,
          },
        }),
      });

      if (response.status === 401) {
        router.replace('/');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setMe(data.me as UserMe);
        toast({ title: 'Profile saved', description: 'Your profile has been updated.' });
      } else {
        toast({ title: 'Could not save', description: data.error ?? 'Something went wrong.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
        <Navigation currentPath="/profile" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 animate-pulse">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
      <Navigation currentPath="/profile" />

      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-pink-400" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-pink-500" style={{ textShadow: '0 0 15px rgba(236,72,153,0.6)' }}>
              Edit Profile
            </h1>
            <p className="text-gray-400 text-sm mt-1">Tell potential matches who you are</p>
          </div>
        </div>

        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <CardTitle className="text-pink-400 flex items-center gap-2">
              <UserRound className="w-5 h-5" />
              About You
            </CardTitle>
            <CardDescription className="text-gray-500">
              {(me as any)?.ageVerified ? 'Your account is verified ✓' : 'Complete your profile to start matching'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300">Display Name</Label>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How should others see you?"
                className="bg-gray-800 border-pink-950 text-white placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Bio</Label>
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="A little about yourself…"
                maxLength={500}
                rows={4}
                className="bg-gray-800 border-pink-950 text-white placeholder-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500 text-right">{bio.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">I am</Label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setGender(option)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      gender === option
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent'
                        : 'bg-gray-800 text-gray-400 border-pink-950 hover:text-pink-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Interested in</Label>
              <div className="space-y-2">
                {GENDERS.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer"
                  >
                    <Checkbox
                      checked={interestedIn.includes(option)}
                      onCheckedChange={() => toggleGender(option)}
                      className="border-pink-700 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Location</Label>
              <Input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, State"
                className="bg-gray-800 border-pink-950 text-white placeholder-gray-500"
              />
              <Button
                type="button"
                onClick={() => void saveMyLocation()}
                disabled={locating}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {locating ? 'Locating…' : 'Use my current location'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void saveApproximateLocation()}
                disabled={approximating}
                className="w-full border-pink-800 text-pink-300 hover:bg-pink-950/40"
              >
                <NavigationIcon className="w-4 h-4 mr-2" />
                {approximating ? 'Approximating…' : 'Use approximate location instead'}
              </Button>
              <p className="text-xs text-gray-500">
                Your coordinates are stored privately. Only your city and distance are shown to other members.
              </p>
              <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer pt-1">
                <Checkbox
                  checked={showDistance}
                  onCheckedChange={(checked) => setShowDistance(checked === true)}
                  className="border-pink-700 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                />
                Show my distance to others
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-pink-800 bg-gray-800 flex items-center justify-center shrink-0">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserRound className="w-9 h-9 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Label
                      htmlFor="photo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90"
                    >
                      {uploading ? 'Uploading…' : 'Upload photo'}
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={uploading}
                        onChange={onUploadPhoto}
                      />
                    </Label>
                    <Input
                      value={profilePicture}
                      onChange={(event) => setProfilePicture(event.target.value)}
                      placeholder="…or paste an image URL"
                      className="bg-gray-800 border-pink-950 text-white placeholder-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WebP or GIF up to 5 MB. Stored on our server.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Looking for</Label>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_TYPES.map((option) => (
                  <Badge
                    key={option}
                    variant={relationshipType.includes(option) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      relationshipType.includes(option)
                        ? 'bg-pink-600 hover:bg-pink-700'
                        : 'text-gray-400 border-pink-900 hover:text-pink-300'
                    }`}
                    onClick={() => toggleRelationship(option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Age Range</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={18}
                  max={100}
                  value={minAge}
                  onChange={(event) => setMinAge(Number(event.target.value) || 18)}
                  className="bg-gray-800 border-pink-950 text-white"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  min={18}
                  max={100}
                  value={maxAge}
                  onChange={(event) => setMaxAge(Number(event.target.value) || 100)}
                  className="bg-gray-800 border-pink-950 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Max Distance (miles)</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={maxDistance}
                onChange={(event) => setMaxDistance(Number(event.target.value) || 50)}
                className="bg-gray-800 border-pink-950 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 text-gray-300 border-pink-900" onClick={() => router.push('/dashboard')}>
            Cancel
          </Button>
          <Button
            className="flex-[2] bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            onClick={save}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
        <div className="text-center py-6">
          <AdBanner slot="1234567892" />
        </div>
        <AdBanner slot="1234567894" />
      </div>
    </div>
  );
}