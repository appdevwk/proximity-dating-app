'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { ProfileImportManager } from '@/components/admin/profile-import-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Shield,
  Users,
  Heart,
  MessageCircle,
  Activity,
  Ban,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import type { AdminStats } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const { status, isAdmin } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const isAuthedAndNotAdmin = status === 'authenticated' && !isAdmin;

  const loadStats = () => {
    void fetch('/api/admin/stats', { cache: 'no-store' })
      .then((response) => {
        if (response.status === 401) {
          router.replace('/');
          return null;
        }
        if (response.status === 403) {
          setForbidden(true);
          return null;
        }
        return response.json();
      })
      .then((data) => setStats(data as AdminStats | null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const toggleBan = async (userId: string, currentBanState: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBanned: !currentBanState }),
    });
    loadStats();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
        <Navigation currentPath="/portal/39867b93" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 animate-pulse">Loading admin data…</div>
        </div>
      </div>
    );
  }

  if (forbidden || (isAuthedAndNotAdmin)) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
        <Navigation currentPath="/portal/39867b93" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-pink-600/20 border border-pink-800 flex items-center justify-center">
            <Shield className="w-10 h-10 text-pink-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-pink-500">Admin access required</h1>
          <p className="text-gray-400 max-w-md">
            This area is restricted to Proximity administrators. Any changes to
            profiles, reports, or bans require an admin account.
          </p>
          <Button onClick={() => router.replace('/dashboard')} variant="outline">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const filteredUsers = (stats?.users ?? []).filter((user) => {
    const query = userSearch.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.profile?.displayName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
      <Navigation currentPath="/portal/39867b93" />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-pink-500" style={{ textShadow: '0 0 15px rgba(236,72,153,0.6)' }}>
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage users, reports, and platform statistics</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 text-pink-300 border-pink-800">
            <Shield className="w-4 h-4" />
            Admin
          </Badge>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard icon={<Users className="w-4 h-4" />} label="Users" value={stats.totalUsers} />
            <AdminStatCard icon={<Heart className="w-4 h-4" />} label="Matches" value={stats.acceptedMatches} />
            <AdminStatCard icon={<MessageCircle className="w-4 h-4" />} label="Messages" value={stats.totalMessages} />
            <AdminStatCard icon={<Activity className="w-4 h-4" />} label="Active (24h)" value={stats.activeToday} />
          </div>
        )}

        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <CardTitle className="text-pink-400">User Management</CardTitle>
            <CardDescription className="text-gray-500">
              Manage all registered users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users by name or email…"
                className="w-full bg-gray-800 border border-pink-950 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-pink-950">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">Profile</TableHead>
                    <TableHead className="text-gray-400">Verified</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-pink-950/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.profile?.profilePicture ?? undefined} />
                              <AvatarFallback className="bg-pink-800 text-white text-xs">
                                {(user.profile?.displayName ?? user.name ?? 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm text-white">
                                {user.profile?.displayName ?? user.name ?? '—'}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[140px]">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.profile?.location && (
                            <div className="text-xs text-gray-400">{user.profile.location}</div>
                          )}
                          <div className="text-xs text-gray-500">{user.profile?.gender}</div>
                        </TableCell>
                        <TableCell>
                          {user.ageVerified ? (
                            <Badge className="bg-green-900/60 text-green-300 border border-green-700/50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 border-gray-700">
                              <Clock className="w-3 h-3 mr-1" />
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isBanned ? (
                            <Badge className="bg-red-900/60 text-red-300 border border-red-700/50">
                              <Ban className="w-3 h-3 mr-1" />
                              Banned
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={user.isBanned ? 'default' : 'destructive'}
                            onClick={() => toggleBan(user.id, user.isBanned)}
                          >
                            {user.isBanned ? 'Unban' : 'Ban'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <CardTitle className="text-pink-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Reports
            </CardTitle>
            <CardDescription className="text-gray-500">
              {stats?.pendingReports ?? 0} pending report{(stats?.pendingReports ?? 0) !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(stats?.reports ?? []).length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-emerald-400/60 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">All clear — no reports to review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-pink-950/40"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        Report: <span className="text-pink-400">{report.reason}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Reported user: {report.reportedId}
                      </div>
                      {report.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{report.description}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        report.status === 'PENDING'
                          ? 'default'
                          : report.status === 'RESOLVED'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ProfileImportManager />
      </div>
    </div>
  );
}

function AdminStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-gray-900/60 border border-pink-950 rounded-2xl p-4">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <span className="text-pink-400">{icon}</span>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}