// Google Sheets webhook integration for sending lead data

interface GoogleSheetsWebhookPayload {
  leadId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  monthlyBill?: string;
  homeSize?: number;
  roofType?: string;
  energyGoals?: string;
  leadSource: string;
  status: string;
  submittedAt: string;
  calculationData?: {
    monthlySavings?: string;
    yearOneSavings?: string;
    twentyYearSavings?: string;
    systemSize?: string;
  };
}

export async function sendToGoogleSheets(data: GoogleSheetsWebhookPayload): Promise<boolean> {
  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    console.warn('GOOGLE_SHEETS_WEBHOOK_URL not configured - skipping Google Sheets integration');
    return false;
  }

  try {
    const response = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Google Sheets webhook failed:', response.status, response.statusText);
      return false;
    }

    console.log('📊 Lead data sent to Google Sheets successfully');
    return true;
  } catch (error) {
    console.error('Google Sheets webhook error:', error);
    return false;
  }
}

export function formatLeadForGoogleSheets(
  lead: any,
  calculation?: any
): GoogleSheetsWebhookPayload {
  return {
    leadId: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    monthlyBill: lead.monthlyBill,
    homeSize: lead.homeSize,
    roofType: lead.roofType,
    energyGoals: lead.energyGoals,
    leadSource: lead.leadSource || 'website',
    status: lead.status || 'new',
    submittedAt: lead.createdAt,
    calculationData: calculation ? {
      monthlySavings: calculation.monthlySavings,
      yearOneSavings: calculation.yearOneSavings,
      twentyYearSavings: calculation.twentyYearSavings,
      systemSize: calculation.systemSize,
    } : undefined,
  };
}