export type UserRoleValue = 'USER' | 'ADMIN';

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRoleValue;
};

export type GenderValue = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';

export type MatchActionValue = 'LIKED' | 'DISLIKED' | 'SUPER_LIKED';

export type DiscoverProfile = {
  id: string;
  userId: string;
  displayName: string;
  age: number;
  gender: GenderValue;
  interestedIn: GenderValue[];
  location: string | null;
  bio: string | null;
  profilePicture: string | null;
  distanceMiles: number | null;
  userVerified: boolean;
};

export type ConversationUser = {
  userId: string;
  displayName: string;
  profilePicture: string | null;
  userVerified: boolean;
};

export type MessageOut = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
};

export type Conversation = {
  user: ConversationUser;
  matchedAt: string;
  lastMessage: MessageOut | null;
  unreadCount: number;
};

export type MatchSummary = {
  id: string;
  matchedAt: string;
  user: ConversationUser;
};

export type ProfileOut = {
  id: string;
  displayName: string;
  bio: string | null;
  age: number | null;
  gender: GenderValue;
  interestedIn: GenderValue[];
  location: string | null;
  profilePicture: string | null;
  isProfilePublic: boolean;
  showDistance: boolean;
  ageVerified: boolean;
};

export type UserPreferencesOut = {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  interestedIn: GenderValue[];
  relationshipType: string[];
  lookingFor: string | null;
};

export type UserStats = {
  matches: number;
  acceptedMatches: number;
  messages: number;
  unreadMessages: number;
  likesReceived: number;
};

export type UserMe = {
  user: {
    id: string;
    email: string;
    name: string | null;
    ageVerified: boolean;
    isBanned: boolean;
    createdAt: string;
  };
  profile: ProfileOut | null;
  preferences: UserPreferencesOut | null;
  stats: UserStats;
};

export type AdminStatsUser = {
  id: string;
  email: string;
  name: string | null;
  isBanned: boolean;
  ageVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  profile: {
    displayName: string;
    gender: GenderValue;
    location: string | null;
    profilePicture: string | null;
  } | null;
};

export type AdminStatsReport = {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export type AdminStats = {
  totalUsers: number;
  totalProfiles: number;
  totalMatches: number;
  acceptedMatches: number;
  totalMessages: number;
  activeToday: number;
  bannedUsers: number;
  pendingReports: number;
  users: AdminStatsUser[];
  reports: AdminStatsReport[];
};