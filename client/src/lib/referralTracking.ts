// Client-side referral tracking utilities for PushLap integration

interface ReferralData {
  affiliateId?: string;
  source?: string;
  campaign?: string;
  timestamp: string;
}

class ReferralTracker {
  private storageKey = 'liv8solar_referral';

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Get affiliate ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateId = urlParams.get('ref') || urlParams.get('affiliate') || urlParams.get('affiliateId');
    
    if (affiliateId) {
      // Store the referral information
      const referralData: ReferralData = {
        affiliateId,
        source: urlParams.get('source') || 'direct',
        campaign: urlParams.get('campaign') || 'default',
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage for persistence across page navigation
      localStorage.setItem(this.storageKey, JSON.stringify(referralData));
      
      // Set global variable for immediate access
      (window as any).affiliateId = affiliateId;
      
      // Store in cookie for server-side access (30 days)
      document.cookie = `affiliateId=${affiliateId}; path=/; max-age=${30 * 24 * 60 * 60}`;
      
      console.log('🔗 Referral tracked:', referralData);
    } else {
      // Check if we have stored referral data
      const stored = this.getStoredReferral();
      if (stored) {
        (window as any).affiliateId = stored.affiliateId;
        document.cookie = `affiliateId=${stored.affiliateId}; path=/; max-age=${30 * 24 * 60 * 60}`;
      }
    }
  }

  public getStoredReferral(): ReferralData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const data: ReferralData = JSON.parse(stored);
      
      // Check if referral is still valid (30 days)
      const referralDate = new Date(data.timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - referralDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysDiff > 30) {
        // Expired, remove it
        localStorage.removeItem(this.storageKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error retrieving referral data:', error);
      return null;
    }
  }

  public getCurrentAffiliateId(): string | null {
    const stored = this.getStoredReferral();
    return stored?.affiliateId || (window as any)?.affiliateId || null;
  }

  public trackFormSubmission(formType: string, leadData: any) {
    const affiliateId = this.getCurrentAffiliateId();
    const stored = this.getStoredReferral();
    
    if (affiliateId && typeof (window as any).createPushLapEmail === 'function') {
      // This function is provided by the Push Lap script
      (window as any).createPushLapEmail(leadData.email, `${leadData.firstName} ${leadData.lastName}`);
      
      console.log('📊 Form submission tracked for affiliate:', {
        affiliateId,
        formType,
        email: leadData.email,
        source: stored?.source,
        campaign: stored?.campaign
      });
    }
  }

  public generateReferralUrl(baseUrl: string = window.location.origin): string {
    const affiliateId = this.getCurrentAffiliateId();
    if (!affiliateId) {
      return baseUrl;
    }
    
    const url = new URL(baseUrl);
    url.searchParams.set('ref', affiliateId);
    return url.toString();
  }

  // Method to clear referral data (for testing or user privacy)
  public clearReferralData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.storageKey);
    document.cookie = 'affiliateId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    delete (window as any).affiliateId;
    console.log('🗑️ Referral data cleared');
  }
}

// Export singleton instance
export const referralTracker = new ReferralTracker();

// Export utility functions
export function getCurrentAffiliateId(): string | null {
  return referralTracker.getCurrentAffiliateId();
}

export function trackFormSubmission(formType: string, leadData: any): void {
  referralTracker.trackFormSubmission(formType, leadData);
}

export function generateReferralUrl(baseUrl?: string): string {
  return referralTracker.generateReferralUrl(baseUrl);
}