import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GetChannelStatsResponse, GetChannelStatsRequest } from '../../../proto/youtube_pb';
import { YouTubeServiceClient } from '../../../proto/youtube_grpc_webServiceClient';
import { useAuth } from '../../../contexts/AuthContext';

// --- Citibankdemobusinessinc Kernel Start ---
namespace Citibankdemobusinessinc {

  // Utility functions
  const generateRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateRandomDate = (start: Date, end: Date): string => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  // Shared Configuration Layer
  export const config = {
    apiBaseUrl: process.env.REACT_APP_YOUTUBE_API_BASE_URL || 'https://api.example.com',
    retryAttempts: 3,
    cacheExpirySeconds: 600,
  };

  // Shared Identity Layer (Placeholder)
  export const getUserId = (): string => {
    return 'user-' + generateRandomNumber(1000, 9999);
  };

  // Internal Event Bus (Basic Implementation)
  interface EventBus {
    listeners: { [key: string]: Function[] };
    subscribe: (event: string, callback: Function) => void;
    publish: (event: string, data: any) => void;
  }

  export const eventBus: EventBus = {
    listeners: {},
    subscribe: (event: string, callback: Function) => {
      if (!eventBus.listeners[event]) {
        eventBus.listeners[event] = [];
      }
      eventBus.listeners[event].push(callback);
    },
    publish: (event: string, data: any) => {
      if (eventBus.listeners[event]) {
        eventBus.listeners[event].forEach(callback => callback(data));
      }
    }
  };

  // Common Security Primitives (Placeholder)
  export const encryptData = (data: string): string => {
    // In reality, use a proper encryption library
    return `encrypted_${data}`;
  };

  export const decryptData = (encryptedData: string): string => {
    // In reality, use a proper decryption library
    return encryptedData.replace('encrypted_', '');
  };

  // --- Data Generation Utilities ---
  export namespace DataGen {
    export const generateChannelName = (): string => {
      const adjectives = ['Awesome', 'Cool', 'Amazing', 'Fantastic', 'Epic'];
      const topics = ['Gaming', 'Tech', 'Travel', 'Cooking', 'Music'];
      return `${adjectives[generateRandomNumber(0, adjectives.length - 1)]} ${topics[generateRandomNumber(0, topics.length - 1)]} Channel`;
    };

    export const generateViewsHistory = (startDate: Date, endDate: Date, numEntries: number = 5): { date: string, views: number }[] => {
      const history: { date: string, views: number }[] = [];
      for (let i = 0; i < numEntries; i++) {
        history.push({
          date: generateRandomDate(startDate, endDate),
          views: generateRandomNumber(1000, 100000)
        });
      }
      return history.sort((a, b) => a.date.localeCompare(b.date));
    };
  }

  // --- Logging and Telemetry ---
  export namespace Telemetry {
    export const logEvent = (event: string, data: any) => {
      console.log(`[Telemetry] Event: ${event}`, data);
      // In a real application, send this data to a telemetry service
    };
  }

  // --- Error Handling ---
  export namespace ErrorHandling {
    export const handleGenericError = (error: any, message: string = 'An unexpected error occurred.') => {
      console.error(`[Error] ${message}`, error);
      Telemetry.logEvent('error', { message, error });
      return message;
    };
  }

  // --- Compliance Automation ---
  export namespace Compliance {
    export const checkRegulatoryCompliance = (data: any): boolean => {
      // Placeholder for compliance checks
      console.log('[Compliance] Running regulatory compliance checks...');
      return true; // Assume compliant for now
    };
  }

  // --- Audit Simulation ---
  export namespace Audit {
    export const simulateAudit = (data: any): { passed: boolean, findings: string[] } => {
      console.log('[Audit] Simulating audit...');
      const passed = generateRandomNumber(0, 1) === 1;
      const findings = passed ? [] : ['Potential issue found in data processing.'];
      return { passed, findings };
    };
  }

  // --- Branch: Viewit.ChannelStats ---
  export namespace Viewit {
    export namespace ChannelStats {
      export interface ChannelStatsData {
        channelName: string;
        subscribers: number;
        viewsLast30Days: number;
        videosCount: number;
        viewsHistory: { date: string, views: number }[];
      }

      export const generateChannelStats = (): ChannelStatsData => {
        const channelName = DataGen.generateChannelName();
        const subscribers = generateRandomNumber(10000, 1000000);
        const viewsLast30Days = generateRandomNumber(50000, 5000000);
        const videosCount = generateRandomNumber(50, 500);
        const viewsHistory = DataGen.generateViewsHistory(new Date(new Date().setDate(new Date().getDate() - 30)), new Date());

        return {
          channelName,
          subscribers,
          viewsLast30Days,
          videosCount,
          viewsHistory,
        };
      };

      export const missionStatement = "Provide real-time, insightful YouTube channel analytics to empower content creators.";
      export const monetizationPath = "Premium analytics subscriptions with advanced features and personalized insights.";
      export const ipMoat = "Proprietary algorithms for predicting channel growth and engagement.";

      export const getChannelStats = async (channelId: string): Promise<ChannelStatsData> => {
        console.log(`[Citibankdemobusinessinc.Viewit.ChannelStats] Fetching stats for channel: ${channelId}`);
        Telemetry.logEvent('channel_stats_requested', { channelId });

        // Simulate API call with internal data generation
        const stats = generateChannelStats();

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(stats)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Channel stats compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(stats);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return stats;
      };
    }
  }

  // --- Branch: Monetizeit.AdRevenueOptimizer ---
  export namespace Monetizeit {
    export namespace AdRevenueOptimizer {
      export interface AdOptimizationData {
        channelId: string;
        estimatedRevenue: number;
        adPlacementSuggestions: string[];
      }

      export const generateAdOptimizationData = (channelId: string): AdOptimizationData => {
        const estimatedRevenue = generateRandomNumber(100, 10000);
        const adPlacementSuggestions = ['Pre-roll', 'Mid-roll', 'Banner'];

        return {
          channelId,
          estimatedRevenue,
          adPlacementSuggestions,
        };
      };

      export const missionStatement = "Maximize ad revenue for content creators through intelligent optimization strategies.";
      export const monetizationPath = "Percentage-based fee on increased ad revenue generated through our platform.";
      export const ipMoat = "AI-powered ad placement algorithms that adapt to viewer behavior.";

      export const optimizeAdRevenue = async (channelId: string): Promise<AdOptimizationData> => {
        console.log(`[Citibankdemobusinessinc.Monetizeit.AdRevenueOptimizer] Optimizing ad revenue for channel: ${channelId}`);
        Telemetry.logEvent('ad_revenue_optimization_requested', { channelId });

        // Simulate ad optimization with internal data generation
        const optimizationData = generateAdOptimizationData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(optimizationData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Ad revenue optimization compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(optimizationData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return optimizationData;
      };
    }
  }

  // --- Branch: Engageit.AudienceEngagementBooster ---
  export namespace Engageit {
    export namespace AudienceEngagementBooster {
      export interface EngagementBoostData {
        channelId: string;
        suggestedContentTopics: string[];
        engagementScore: number;
      }

      export const generateEngagementBoostData = (channelId: string): EngagementBoostData => {
        const suggestedContentTopics = ['Tutorials', 'Reviews', 'Vlogs'];
        const engagementScore = generateRandomNumber(50, 100);

        return {
          channelId,
          suggestedContentTopics,
          engagementScore,
        };
      };

      export const missionStatement = "Enhance audience engagement through data-driven content recommendations and interactive features.";
      export const monetizationPath = "Tiered subscription model offering increasing levels of engagement boosting features.";
      export const ipMoat = "Proprietary algorithms for predicting content virality and audience retention.";

      export const boostAudienceEngagement = async (channelId: string): Promise<EngagementBoostData> => {
        console.log(`[Citibankdemobusinessinc.Engageit.AudienceEngagementBooster] Boosting audience engagement for channel: ${channelId}`);
        Telemetry.logEvent('audience_engagement_boost_requested', { channelId });

        // Simulate engagement boost with internal data generation
        const engagementData = generateEngagementBoostData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(engagementData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Audience engagement boost compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(engagementData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return engagementData;
      };
    }
  }

  // --- Branch: Protectit.CopyrightGuardian ---
  export namespace Protectit {
    export namespace CopyrightGuardian {
      export interface CopyrightProtectionData {
        channelId: string;
        copyrightViolationsDetected: number;
        takedownRequestsFiled: number;
      }

      export const generateCopyrightProtectionData = (channelId: string): CopyrightProtectionData => {
        const copyrightViolationsDetected = generateRandomNumber(0, 10);
        const takedownRequestsFiled = generateRandomNumber(0, 5);

        return {
          channelId,
          copyrightViolationsDetected,
          takedownRequestsFiled,
        };
      };

      export const missionStatement = "Safeguard content creators' intellectual property through proactive copyright monitoring and enforcement.";
      export const monetizationPath = "Subscription-based copyright protection services with varying levels of coverage.";
      export const ipMoat = "Advanced content fingerprinting technology for detecting copyright infringements.";

      export const protectCopyright = async (channelId: string): Promise<CopyrightProtectionData> => {
        console.log(`[Citibankdemobusinessinc.Protectit.CopyrightGuardian] Protecting copyright for channel: ${channelId}`);
        Telemetry.logEvent('copyright_protection_requested', { channelId });

        // Simulate copyright protection with internal data generation
        const protectionData = generateCopyrightProtectionData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(protectionData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Copyright protection compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(protectionData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return protectionData;
      };
    }
  }

  // --- Branch: Growit.ChannelGrowthAccelerator ---
  export namespace Growit {
    export namespace ChannelGrowthAccelerator {
      export interface GrowthAccelerationData {
        channelId: string;
        subscriberGrowthRate: number;
        recommendedStrategies: string[];
      }

      export const generateGrowthAccelerationData = (channelId: string): GrowthAccelerationData => {
        const subscriberGrowthRate = generateRandomNumber(1, 10);
        const recommendedStrategies = ['Collaborations', 'Cross-promotion', 'Targeted ads'];

        return {
          channelId,
          subscriberGrowthRate,
          recommendedStrategies,
        };
      };

      export const missionStatement = "Accelerate channel growth through data-driven strategies and personalized recommendations.";
      export const monetizationPath = "Performance-based fees on subscriber growth achieved through our platform.";
      export const ipMoat = "Predictive analytics for identifying optimal growth strategies based on channel characteristics.";

      export const accelerateChannelGrowth = async (channelId: string): Promise<GrowthAccelerationData> => {
        console.log(`[Citibankdemobusinessinc.Growit.ChannelGrowthAccelerator] Accelerating channel growth for channel: ${channelId}`);
        Telemetry.logEvent('channel_growth_acceleration_requested', { channelId });

        // Simulate growth acceleration with internal data generation
        const growthData = generateGrowthAccelerationData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(growthData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Channel growth acceleration compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(growthData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return growthData;
      };
    }
  }

  // --- Branch: Analyzeit.ContentPerformanceAnalyzer ---
  export namespace Analyzeit {
    export namespace ContentPerformanceAnalyzer {
      export interface ContentAnalysisData {
        channelId: string;
        topPerformingVideos: string[];
        averageWatchTime: number;
      }

      export const generateContentAnalysisData = (channelId: string): ContentAnalysisData => {
        const topPerformingVideos = ['Video 1', 'Video 2', 'Video 3'];
        const averageWatchTime = generateRandomNumber(60, 300);

        return {
          channelId,
          topPerformingVideos,
          averageWatchTime,
        };
      };

      export const missionStatement = "Provide in-depth content performance analysis to optimize video strategy and audience engagement.";
      export const monetizationPath = "Subscription-based access to advanced content analytics and reporting tools.";
      export const ipMoat = "Proprietary algorithms for identifying key factors driving video performance.";

      export const analyzeContentPerformance = async (channelId: string): Promise<ContentAnalysisData> => {
        console.log(`[Citibankdemobusinessinc.Analyzeit.ContentPerformanceAnalyzer] Analyzing content performance for channel: ${channelId}`);
        Telemetry.logEvent('content_performance_analysis_requested', { channelId });

        // Simulate content analysis with internal data generation
        const analysisData = generateContentAnalysisData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(analysisData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Content performance analysis compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(analysisData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return analysisData;
      };
    }
  }

  // --- Branch: Collaborateit.CreatorCollaborationPlatform ---
  export namespace Collaborateit {
    export namespace CreatorCollaborationPlatform {
      export interface CollaborationData {
        channelId: string;
        potentialPartners: string[];
        collaborationScore: number;
      }

      export const generateCollaborationData = (channelId: string): CollaborationData => {
        const potentialPartners = ['Channel A', 'Channel B', 'Channel C'];
        const collaborationScore = generateRandomNumber(50, 100);

        return {
          channelId,
          potentialPartners,
          collaborationScore,
        };
      };

      export const missionStatement = "Facilitate meaningful collaborations between content creators to expand reach and audience engagement.";
      export const monetizationPath = "Commission-based fees on successful collaborations facilitated through our platform.";
      export const ipMoat = "Proprietary matching algorithms for identifying optimal collaboration opportunities.";

      export const facilitateCollaboration = async (channelId: string): Promise<CollaborationData> => {
        console.log(`[Citibankdemobusinessinc.Collaborateit.CreatorCollaborationPlatform] Facilitating collaboration for channel: ${channelId}`);
        Telemetry.logEvent('creator_collaboration_requested', { channelId });

        // Simulate collaboration facilitation with internal data generation
        const collaborationData = generateCollaborationData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(collaborationData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Creator collaboration compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(collaborationData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return collaborationData;
      };
    }
  }

  // --- Branch: Fundit.CrowdfundingAccelerator ---
  export namespace Fundit {
    export namespace CrowdfundingAccelerator {
      export interface CrowdfundingData {
        channelId: string;
        fundingGoal: number;
        fundingProgress: number;
      }

      export const generateCrowdfundingData = (channelId: string): CrowdfundingData => {
        const fundingGoal = generateRandomNumber(1000, 10000);
        const fundingProgress = generateRandomNumber(0, fundingGoal);

        return {
          channelId,
          fundingGoal,
          fundingProgress,
        };
      };

      export const missionStatement = "Empower content creators to fund their projects through strategic crowdfunding campaigns.";
      export const monetizationPath = "Percentage-based fees on successful crowdfunding campaigns facilitated through our platform.";
      export const ipMoat = "Proprietary campaign optimization algorithms for maximizing crowdfunding success.";

      export const accelerateCrowdfunding = async (channelId: string): Promise<CrowdfundingData> => {
        console.log(`[Citibankdemobusinessinc.Fundit.CrowdfundingAccelerator] Accelerating crowdfunding for channel: ${channelId}`);
        Telemetry.logEvent('crowdfunding_acceleration_requested', { channelId });

        // Simulate crowdfunding acceleration with internal data generation
        const crowdfundingData = generateCrowdfundingData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(crowdfundingData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Crowdfunding acceleration compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(crowdfundingData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return crowdfundingData;
      };
    }
  }

  // --- Branch: Learnit.CreatorEducationPlatform ---
  export namespace Learnit {
    export namespace CreatorEducationPlatform {
      export interface EducationData {
        channelId: string;
        availableCourses: string[];
        courseCompletionRate: number;
      }

      export const generateEducationData = (channelId: string): EducationData => {
        const availableCourses = ['Video Editing', 'Audience Engagement', 'Monetization'];
        const courseCompletionRate = generateRandomNumber(50, 100);

        return {
          channelId,
          availableCourses,
          courseCompletionRate,
        };
      };

      export const missionStatement = "Provide comprehensive educational resources to empower content creators with the skills they need to succeed.";
      export const monetizationPath = "Subscription-based access to premium courses and educational materials.";
      export const ipMoat = "Exclusive content and expert instructors for creator education.";

      export const provideEducation = async (channelId: string): Promise<EducationData> => {
        console.log(`[Citibankdemobusinessinc.Learnit.CreatorEducationPlatform] Providing education for channel: ${channelId}`);
        Telemetry.logEvent('creator_education_requested', { channelId });

        // Simulate education provision with internal data generation
        const educationData = generateEducationData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(educationData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Creator education compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(educationData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return educationData;
      };
    }
  }

  // --- Branch: Manageit.ChannelManagementSuite ---
  export namespace Manageit {
    export namespace ChannelManagementSuite {
      export interface ManagementData {
        channelId: string;
        tasksCompleted: number;
        tasksPending: number;
      }

      export const generateManagementData = (channelId: string): ManagementData => {
        const tasksCompleted = generateRandomNumber(10, 50);
        const tasksPending = generateRandomNumber(5, 20);

        return {
          channelId,
          tasksCompleted,
          tasksPending,
        };
      };

      export const missionStatement = "Streamline channel management tasks to help content creators focus on creating great content.";
      export const monetizationPath = "Subscription-based access to a suite of channel management tools and features.";
      export const ipMoat = "Integrated workflow automation and task management for content creators.";

      export const manageChannel = async (channelId: string): Promise<ManagementData> => {
        console.log(`[Citibankdemobusinessinc.Manageit.ChannelManagementSuite] Managing channel: ${channelId}`);
        Telemetry.logEvent('channel_management_requested', { channelId });

        // Simulate channel management with internal data generation
        const managementData = generateManagementData(channelId);

        // Simulate compliance check
        if (!Compliance.checkRegulatoryCompliance(managementData)) {
          throw new ErrorHandling.handleGenericError(new Error('Compliance check failed.'), 'Channel management compliance check failed.');
        }

        // Simulate audit
        const auditResult = Audit.simulateAudit(managementData);
        if (!auditResult.passed) {
          console.warn('[Audit] Audit findings:', auditResult.findings);
        }

        return managementData;
      };
    }
  }

  // --- Master Orchestration Layer ---
  export namespace Orchestration {
    export const orchestrateServices = async (channelId: string) => {
      console.log('[Citibankdemobusinessinc.Orchestration] Orchestrating services for channel:', channelId);

      try {
        const channelStats = await Viewit.ChannelStats.getChannelStats(channelId);
        const adOptimization = await Monetizeit.AdRevenueOptimizer.optimizeAdRevenue(channelId);
        const engagementBoost = await Engageit.AudienceEngagementBooster.boostAudienceEngagement(channelId);
        const copyrightProtection = await Protectit.CopyrightGuardian.protectCopyright(channelId);
        const growthAcceleration = await Growit.ChannelGrowthAccelerator.accelerateChannelGrowth(channelId);
        const contentAnalysis = await Analyzeit.ContentPerformanceAnalyzer.analyzeContentPerformance(channelId);
        const collaboration = await Collaborateit.CreatorCollaborationPlatform.facilitateCollaboration(channelId);
        const crowdfunding = await Fundit.CrowdfundingAccelerator.accelerateCrowdfunding(channelId);
        const education = await Learnit.CreatorEducationPlatform.provideEducation(channelId);
        const management = await Manageit.ChannelManagementSuite.manageChannel(channelId);

        console.log('[Citibankdemobusinessinc.Orchestration] Services orchestrated successfully.');
        Telemetry.logEvent('services_orchestrated', { channelId });

        return {
          channelStats,
          adOptimization,
          engagementBoost,
          copyrightProtection,
          growthAcceleration,
          contentAnalysis,
          collaboration,
          crowdfunding,
          education,
          management,
        };

      } catch (error) {
        console.error('[Citibankdemobusinessinc.Orchestration] Error orchestrating services:', error);
        ErrorHandling.handleGenericError(error, 'Failed to orchestrate services.');
        return null;
      }
    };
  }
}
// --- Citibankdemobusinessinc Kernel End ---

// Mock API calls for demonstration purposes. In a real app, these would call the backend service.
const mockFetchChannelStats = (channelId: string): Promise<GetChannelStatsResponse.AsObject> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        channelName: `Mock Channel ${channelId}`,
        subscribers: Math.floor(Math.random() * 1000000),
        viewsLast30Days: Math.floor(Math.random() * 5000000),
        videosCount: Math.floor(Math.random() * 500) + 50,
        viewsHistory: [
          { date: '2023-10-01', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-08', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-15', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-22', views: Math.floor(Math.random() * 100000) },
          { date: '2023-10-29', views: Math.floor(Math.random() * 100000) },
        ],
      };
      resolve(mockData);
    }, 1500);
  });
};

interface YouTubeChannelStatsProps {
  channelId: string;
}

interface ChannelStats {
  channelName: string;
  subscribers: number;
  viewsLast30Days: number;
  videosCount: number;
  viewsHistory: { date: string, views: number }[];
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
};

const YouTubeChannelStats: React.FC<YouTubeChannelStatsProps> = ({ channelId }) => {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useAuth(); // Assuming AuthContext provides a way to get tokens for service calls

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real application, you would use the YouTubeServiceClient
        // const token = await getAuthToken();
        // const request = new GetChannelStatsRequest();
        // request.setChannelId(channelId);
        // const client = new YouTubeServiceClient(process.env.REACT_APP_YOUTUBE_API_BASE_URL!, null);
        // const response = await client.getChannelStats(request, { 'Authorization': `Bearer ${token}` });
        // const data = response.toObject() as unknown as ChannelStats; // Simplified mapping
        
        // Mock API call
        // const data = await mockFetchChannelStats(channelId);
        // setStats(data as unknown as ChannelStats);

        // Use Citibankdemobusinessinc.Viewit.ChannelStats
        const data = await Citibankdemobusinessinc.Viewit.ChannelStats.getChannelStats(channelId);
        setStats({
          channelName: data.channelName,
          subscribers: data.subscribers,
          viewsLast30Days: data.viewsLast30Days,
          videosCount: data.videosCount,
          viewsHistory: data.viewsHistory,
        });

        // Orchestrate other services
        Citibankdemobusinessinc.Orchestration.orchestrateServices(channelId);

      } catch (err) {
        console.error("Error fetching YouTube stats:", err);
        setError(Citibankdemobusinessinc.ErrorHandling.handleGenericError(err, "Failed to load YouTube channel statistics. Please check the connection."));
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchStats();
    }
  }, [channelId, getAuthToken]);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading YouTube Stats...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography color="textSecondary">No statistics available for this channel ID.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          YouTube Channel Stats: {stats.channelName}
        </Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">Subscribers</Typography>
            <Typography variant="h5" color="primary">
              {formatNumber(stats.subscribers)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">Views (Last 30 Days)</Typography>
            <Typography variant="h5" color="primary">
              {formatNumber(stats.viewsLast30Days)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">Total Videos</Typography>
            <Typography variant="h5" color="primary">
              {stats.videosCount}
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Views History (Recent Weeks)
        </Typography>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stats.viewsHistory}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatNumber(value)} />
              <Tooltip formatter={(value: number) => [formatNumber(value), 'Views']} />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} name="Daily Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default YouTubeChannelStats;