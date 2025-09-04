// Push Lap API integration for affiliate tracking

interface PushLapReferral {
  affiliateId?: string;
  name: string;
  email: string;
  referredUserExternalId?: string;
  plan?: string;
  status?: string;
}

interface PushLapSale {
  referralId: string; // The referral Id or email of the user who bought an item
  externalId?: string;
  externalInvoiceId?: string;
  totalEarned: number;
  commissionRate?: number;
}

class PushLapAPI {
  private apiKey: string;
  private baseUrl = 'https://www.pushlapgrowth.com/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async trackReferral(referralData: PushLapReferral): Promise<any> {
    try {
      // Get affiliate ID from various sources (URL params, cookies, global var)
      let affiliateId = referralData.affiliateId;
      
      if (!affiliateId && typeof globalThis !== 'undefined') {
        // Try to get from global variables or request context
        affiliateId = (globalThis as any)?.affiliateId || (globalThis as any)?.ref;
      }
      
      const body = {
        affiliateId: affiliateId,
        name: referralData.name,
        email: referralData.email,
        referredUserExternalId: referralData.referredUserExternalId,
        plan: referralData.plan || 'solar_lead',
        status: referralData.status || 'new_referral',
      };

      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      };

      const response = await fetch(`${this.baseUrl}/referrals`, options);
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Push Lap referral tracking failed:', result);
        return null;
      }

      console.log('✅ Push Lap referral tracked:', result);
      return result;
    } catch (error) {
      console.error('Push Lap referral API error:', error);
      return null;
    }
  }

  async trackSale(saleData: PushLapSale): Promise<any> {
    try {
      const body = {
        referralId: saleData.referralId, // This should be the email or ID from the original referral
        externalId: saleData.externalId,
        externalInvoiceId: saleData.externalInvoiceId,
        totalEarned: saleData.totalEarned,
        commissionRate: saleData.commissionRate || 0.10, // Default 10% commission
      };

      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      };

      const response = await fetch(`${this.baseUrl}/sales`, options);
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Push Lap sale tracking failed:', result);
        return null;
      }

      console.log('💰 Push Lap sale tracked:', result);
      return result;
    } catch (error) {
      console.error('Push Lap sale API error:', error);
      return null;
    }
  }
}

// Export singleton instance (will need API key from environment)
let pushLapAPI: PushLapAPI | null = null;

export function getPushLapAPI(): PushLapAPI | null {
  if (!process.env.PUSHLAP_API_KEY) {
    console.warn('PUSHLAP_API_KEY not set - Push Lap tracking disabled');
    return null;
  }
  
  if (!pushLapAPI) {
    pushLapAPI = new PushLapAPI(process.env.PUSHLAP_API_KEY);
  }
  
  return pushLapAPI;
}

// Helper function to track project completion/sale
export async function trackProjectSale(
  leadEmail: string,
  projectValue: number,
  projectId: string
): Promise<boolean> {
  const pushLapAPI = getPushLapAPI();
  if (!pushLapAPI) return false;
  
  const result = await pushLapAPI.trackSale({
    referralId: leadEmail, // Use lead email as referral identifier
    externalId: projectId,
    externalInvoiceId: `INV-${projectId}`,
    totalEarned: projectValue,
    commissionRate: 0.10, // 10% commission rate
  });
  
  return result !== null;
}

// Helper function to extract affiliate ID from request headers or params
export function extractAffiliateId(req: any): string | undefined {
  // Check URL params first
  const urlAffiliate = req.query?.ref || req.query?.affiliate || req.query?.affiliateId;
  if (urlAffiliate) return urlAffiliate;
  
  // Check request headers
  const headerAffiliate = req.headers['x-affiliate-id'] || req.headers['affiliate-id'];
  if (headerAffiliate) return headerAffiliate;
  
  // Check cookies
  const cookieAffiliate = req.cookies?.affiliateId || req.cookies?.ref;
  if (cookieAffiliate) return cookieAffiliate;
  
  return undefined;
}

export { PushLapAPI, type PushLapReferral, type PushLapSale };