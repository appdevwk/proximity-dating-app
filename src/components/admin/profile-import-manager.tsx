'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ImportStats {
  totalProfiles: number;
  verifiedProfiles: number;
  externalProfiles: number;
  sources: number;
}

interface ImportResult {
  source: string;
  count: number;
}

interface ImportStatus {
  isImporting: boolean;
  currentSource: string;
  progress: number;
  totalProfiles: number;
  importedProfiles: number;
}

const availableSources = [
  { value: 'okcupid', label: 'OkCupid', description: 'Mainstream dating with public profiles' },
  { value: 'plentyoffish', label: 'Plenty of Fish', description: 'Free dating platform' },
  { value: 'adultfriendfinder', label: 'AdultFriendFinder', description: 'Adult dating platform' },
  { value: 'ashleymadison', label: 'Ashley Madison', description: 'Discreet adult dating' },
  { value: 'feeld', label: 'Feeld', description: 'Modern open-minded dating' },
];

export function ProfileImportManager() {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    currentSource: '',
    progress: 0,
    totalProfiles: 0,
    importedProfiles: 0,
  });
  const [selectedSource, setSelectedSource] = useState('');
  const [profileLimit, setProfileLimit] = useState(100);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/profiles/import?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load import statistics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load import statistics',
        variant: 'destructive',
      });
    }
  };

  const handleImportFromSource = async () => {
    if (!selectedSource) {
      toast({
        title: 'Error',
        description: 'Please select a source',
        variant: 'destructive',
      });
      return;
    }

    setImportStatus({
      isImporting: true,
      currentSource: selectedSource,
      progress: 0,
      totalProfiles: profileLimit,
      importedProfiles: 0,
    });

    try {
      const response = await fetch('/api/profiles/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: selectedSource,
          limit: profileLimit,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportStatus(prev => ({
          ...prev,
          progress: 100,
          importedProfiles: result.data.length,
        }));

        toast({
          title: 'Success',
          description: `Successfully imported ${result.data.length} profiles from ${selectedSource}`,
        });

        await loadStats();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to import profiles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import profiles',
        variant: 'destructive',
      });
    } finally {
      setImportStatus(prev => ({
        ...prev,
        isImporting: false,
      }));
    }
  };

  const handleImportFromPublicWeb = async () => {
    setImportStatus({
      isImporting: true,
      currentSource: 'Public Web',
      progress: 0,
      totalProfiles: 100,
      importedProfiles: 0,
    });

    try {
      const response = await fetch('/api/profiles/import?action=scrape-web');
      const result = await response.json();

      if (result.success) {
        setImportResults(result.data);
        setImportStatus(prev => ({
          ...prev,
          progress: 100,
          importedProfiles: result.data.reduce((sum: number, item: ImportResult) => sum + item.count, 0),
        }));

        toast({
          title: 'Success',
          description: `Successfully scraped profiles from public web sources`,
        });

        await loadStats();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to scrape profiles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to scrape profiles',
        variant: 'destructive',
      });
    } finally {
      setImportStatus(prev => ({
        ...prev,
        isImporting: false,
      }));
    }
  };

  const handleImportFromAllSources = async () => {
    setImportStatus({
      isImporting: true,
      currentSource: 'All Sources',
      progress: 0,
      totalProfiles: 250, // Approximate total
      importedProfiles: 0,
    });

    try {
      const response = await fetch('/api/profiles/import?action=import-all');
      const result = await response.json();

      if (result.success) {
        setImportResults(result.data);
        setImportStatus(prev => ({
          ...prev,
          progress: 100,
          importedProfiles: result.data.reduce((sum: number, item: ImportResult) => sum + item.count, 0),
        }));

        toast({
          title: 'Success',
          description: `Successfully imported profiles from all sources`,
        });

        await loadStats();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to import profiles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import profiles',
        variant: 'destructive',
      });
    } finally {
      setImportStatus(prev => ({
        ...prev,
        isImporting: false,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Import Manager</CardTitle>
          <CardDescription>
            Import real adult dating profiles from various sources to populate your app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import Profiles</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Data Source</Label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{source.label}</span>
                            <span className="text-sm text-muted-foreground">{source.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit">Profile Limit</Label>
                  <Input
                    id="limit"
                    type="number"
                    value={profileLimit}
                    onChange={(e) => setProfileLimit(parseInt(e.target.value) || 100)}
                    min="1"
                    max="1000"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImportFromSource}
                    disabled={importStatus.isImporting || !selectedSource}
                    className="flex-1"
                  >
                    {importStatus.isImporting && importStatus.currentSource === selectedSource
                      ? 'Importing...'
                      : 'Import from Selected Source'}
                  </Button>
                  <Button
                    onClick={handleImportFromAllSources}
                    disabled={importStatus.isImporting}
                    variant="outline"
                    className="flex-1"
                  >
                    {importStatus.isImporting && importStatus.currentSource === 'All Sources'
                      ? 'Importing...'
                      : 'Import from All Sources'}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImportFromPublicWeb}
                    disabled={importStatus.isImporting}
                    variant="outline"
                    className="flex-1"
                  >
                    {importStatus.isImporting && importStatus.currentSource === 'Public Web'
                      ? 'Scraping...'
                      : 'Scrape Public Web'}
                  </Button>
                </div>

                {importStatus.isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing from {importStatus.currentSource}</span>
                      <span>{importStatus.importedProfiles} / {importStatus.totalProfiles}</span>
                    </div>
                    <Progress value={importStatus.progress} className="w-full" />
                  </div>
                )}

                {importResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Import Results</h4>
                    <div className="space-y-1">
                      {importResults.map((result, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{result.source}</span>
                          <Badge variant="secondary">{result.count} profiles</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {stats ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProfiles}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Verified Profiles</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.verifiedProfiles}</div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((stats.verifiedProfiles / stats.totalProfiles) * 100)}% verification rate
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">External Profiles</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.externalProfiles}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.sources}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Loading statistics...
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}