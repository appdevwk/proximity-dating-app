'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/navigation';
import { 
  Activity, 
  Zap, 
  Users, 
  Database, 
  Settings, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Phone,
  MessageSquare,
  Mic,
  Volume2,
  Calendar,
  Search,
  BookOpen,
  Workflow,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for n8n workflow statistics
  const workflowStats = {
    prodExecutions: 0,
    failedExecutions: 0,
    failureRate: 0,
    avgRunTime: 0,
    timeSaved: '--'
  };

  // Mock system status
  const systemStatus = [
    { name: 'n8n Server', status: 'online', icon: Server },
    { name: 'Database', status: 'online', icon: Database },
    { name: 'AI Services', status: 'online', icon: Cpu },
    { name: 'Voice Services', status: 'online', icon: Mic },
    { name: 'Network', status: 'online', icon: Wifi },
    { name: 'Security', status: 'online', icon: Shield }
  ];

  // Quick links for workflows
  const quickLinks = [
    { title: 'n8n Workflow Dashboard', icon: Workflow, action: () => {} },
    { title: 'All Workflows', icon: BarChart3, action: () => {} },
    { title: 'Credentials', icon: Shield, action: () => {} },
    { title: 'Executions', icon: Activity, action: () => {} }
  ];

  // AI workflow examples
  const aiWorkflows = [
    { 
      title: 'Test a Simple AI Agent Example', 
      icon: Zap, 
      description: 'Basic AI agent functionality test',
      action: () => {}
    },
    { 
      title: 'Start OpenAI Workflow', 
      icon: MessageSquare, 
      description: 'Launch OpenAI-powered workflow',
      action: () => {}
    },
    { 
      title: 'Activate Voice Agent (Voiceflow)', 
      icon: Mic, 
      description: 'Enable voice-based AI assistant',
      action: () => {}
    },
    { 
      title: 'Appointment Scheduler (Voice Command)', 
      icon: Calendar, 
      description: 'Voice-controlled scheduling system',
      action: () => {}
    },
    { 
      title: 'Knowledge Search Chatbot', 
      icon: Search, 
      description: 'AI-powered knowledge base search',
      action: () => {}
    },
    { 
      title: 'Phone Voice Agent (Twilio)', 
      icon: Phone, 
      description: 'Telephony integration for voice AI',
      action: () => {}
    },
    { 
      title: 'Text-to-Speech Demo (ElevenLabs)', 
      icon: Volume2, 
      description: 'High-quality voice synthesis demo',
      action: () => {}
    },
    { 
      title: 'AI Voice Assistant & Chat (Experimental)', 
      icon: MessageSquare, 
      description: 'Advanced conversational AI',
      action: () => {}
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPath="/dashboard" />
      
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">WhiteKnight AI MASTER SERVER Dashboard</h1>
              <p className="text-muted-foreground">
                Your centralized control hub for n8n automations, AI, and forensic intelligence tools.
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Master Server
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    n8n Workflow Overview
                  </CardTitle>
                  <CardDescription>
                    Last 7 days performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{workflowStats.prodExecutions}</div>
                      <div className="text-sm text-muted-foreground">Prod. executions</div>
                      <Button variant="ghost" size="sm" className="mt-1">Details</Button>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{workflowStats.failedExecutions}</div>
                      <div className="text-sm text-muted-foreground">Failed prod. executions</div>
                      <Button variant="ghost" size="sm" className="mt-1">Details</Button>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{workflowStats.failureRate}%</div>
                      <div className="text-sm text-muted-foreground">Failure rate</div>
                      <Button variant="ghost" size="sm" className="mt-1">Details</Button>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{workflowStats.avgRunTime}s</div>
                      <div className="text-sm text-muted-foreground">Run time (avg.)</div>
                      <Button variant="ghost" size="sm" className="mt-1">Details</Button>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{workflowStats.timeSaved}</div>
                      <div className="text-sm text-muted-foreground">Time saved</div>
                      <Button variant="ghost" size="sm" className="mt-1">Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>
                    Rapid access to all major modules, automations, and AI voice/agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    {quickLinks.map((link, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start h-auto p-4"
                        onClick={link.action}
                      >
                        <link.icon className="mr-3 h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">{link.title}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Current health and performance of all services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {systemStatus.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <service.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        {getStatusBadge(service.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>My n8n Master Dashboard</CardTitle>
                    <CardDescription>
                      All workflows, AI tools, and voice assistant in one place.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-8">
                      <Workflow className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Workflow Management</h3>
                      <p className="text-muted-foreground mb-4">
                        Create, manage, and monitor all your n8n workflows from this central dashboard
                      </p>
                      <Button className="w-full">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Open Workflow Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Workflow Links</CardTitle>
                    <CardDescription>
                      Access your most used workflows instantly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {quickLinks.map((link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={link.action}
                        >
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.title}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-tools" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Tools & Voice Agents</CardTitle>
                  <CardDescription>
                    Test a Simple AI Agent Example - Tip: Use Quick Links above for rapid access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {aiWorkflows.map((workflow, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 justify-start"
                        onClick={workflow.action}
                      >
                        <workflow.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">{workflow.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {workflow.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    AI Voice Assistant & Chat (Experimental)
                  </CardTitle>
                  <CardDescription>
                    Chat with your n8n AI assistant using text (and, if enabled, voice). Microphone support will appear if the workflow supports it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">System Ready</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Welcome, White! Create Your First Workflow or Test a Simple AI Agent Example
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Mic className="w-4 h-4" />
                        <span className="text-sm font-medium">Voice Input</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Mic className="mr-2 h-4 w-4" />
                          Start Recording
                        </Button>
                        <Button variant="outline" size="sm">
                          <Volume2 className="mr-2 h-4 w-4" />
                          Test Speaker
                        </Button>
                      </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                      Tip: Use Quick Links above for rapid access to all major modules, automations, and AI voice/agents.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Server Information</CardTitle>
                    <CardDescription>
                      System specifications and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm text-muted-foreground">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm text-muted-foreground">62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Disk Space</span>
                        <span className="text-sm text-muted-foreground">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Network I/O</span>
                        <span className="text-sm text-muted-foreground">Normal</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Service Status</CardTitle>
                    <CardDescription>
                      Detailed status of all running services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {systemStatus.map((service, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <service.icon className="w-4 h-4" />
                            <span className="text-sm">{service.name}</span>
                          </div>
                          {getStatusBadge(service.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>
                    Recent system events and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>System initialized successfully</span>
                      <span className="text-muted-foreground ml-auto">2 min ago</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span>n8n workflow executed</span>
                      <span className="text-muted-foreground ml-auto">5 min ago</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span>AI service request processed</span>
                      <span className="text-muted-foreground ml-auto">8 min ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center text-sm text-muted-foreground border-t pt-6">
            © 2025 WhiteKnight | Digital Forensics & Anti-Trafficking Intelligence via n8n AI Automations
          </div>
        </div>
      </div>
    </div>
  );
}