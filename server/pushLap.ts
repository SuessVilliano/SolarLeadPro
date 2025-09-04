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
      const body = {
        affiliateId: referralData.affiliateId || (typeof window !== 'undefined' ? (window as any)?.affiliateId : undefined),
        name: referralData.name,
        email: referralData.email,
        referredUserExternalId: referralData.referredUserExternalId,
        plan: referralData.plan,
        status: referralData.status,
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
        referralId: saleData.referralId,
        externalId: saleData.externalId,
        externalInvoiceId: saleData.externalInvoiceId,
        totalEarned: saleData.totalEarned,
        commissionRate: saleData.commissionRate,
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

export { PushLapAPI, type PushLapReferral, type PushLapSale };