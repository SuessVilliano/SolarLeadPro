// TaskMagic webhook integration for form automation

interface TaskMagicWebhookPayload {
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
  formType: string; // consultation, qualification, calculator
  calculationData?: {
    monthlySavings?: string;
    yearOneSavings?: string;
    twentyYearSavings?: string;
    systemSize?: string;
  };
}

const TASKMAGIC_WEBHOOK_URL = 'https://apps.taskmagic.com/api/v1/webhooks/wYHfzIM5VmcUMO2T5iWhn';

export async function sendToTaskMagic(data: TaskMagicWebhookPayload): Promise<boolean> {
  try {
    const response = await fetch(TASKMAGIC_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LIV8Solar-Webhook/1.0',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('TaskMagic webhook failed:', response.status, response.statusText);
      return false;
    }

    console.log('📋 Lead data sent to TaskMagic successfully');
    return true;
  } catch (error) {
    console.error('TaskMagic webhook error:', error);
    return false;
  }
}

export function formatLeadForTaskMagic(
  lead: any,
  formType: string = 'consultation',
  calculation?: any
): TaskMagicWebhookPayload {
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
    formType,
    calculationData: calculation ? {
      monthlySavings: calculation.monthlySavings,
      yearOneSavings: calculation.yearOneSavings,
      twentyYearSavings: calculation.twentyYearSavings,
      systemSize: calculation.systemSize,
    } : undefined,
  };
}