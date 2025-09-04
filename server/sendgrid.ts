import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      ...(params.text && { text: params.text }),
      ...(params.html && { html: params.html }),
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Email templates for different form types
export const emailTemplates = {
  newLead: (leadData: any) => ({
    subject: `🌟 New Lead Submission - ${leadData.firstName} ${leadData.lastName}`,
    html: `
      <h2>New Lead Submission</h2>
      <p><strong>Name:</strong> ${leadData.firstName} ${leadData.lastName}</p>
      <p><strong>Email:</strong> ${leadData.email}</p>
      <p><strong>Phone:</strong> ${leadData.phone}</p>
      <p><strong>Address:</strong> ${leadData.address || 'Not provided'}</p>
      <p><strong>Monthly Bill:</strong> ${leadData.monthlyBill ? `$${leadData.monthlyBill}` : 'Not provided'}</p>
      <p><strong>Home Size:</strong> ${leadData.homeSize ? leadData.homeSize + ' sq ft' : 'Not provided'}</p>
      <p><strong>Roof Type:</strong> ${leadData.roofType || 'Not provided'}</p>
      <p><strong>Energy Goals:</strong> ${leadData.energyGoals || 'Not provided'}</p>
      <p><strong>Lead Source:</strong> ${leadData.leadSource || 'website'}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    `,
    text: `New Lead: ${leadData.firstName} ${leadData.lastName} (${leadData.email}) - ${leadData.phone}`
  }),

  solarCalculation: (calculationData: any) => ({
    subject: `💡 Solar Calculation Performed - Potential ${calculationData.monthlySavings}/month savings`,
    html: `
      <h2>Solar Calculation Performed</h2>
      <p><strong>Monthly Bill:</strong> $${calculationData.monthlyBill}</p>
      <p><strong>Home Size:</strong> ${calculationData.homeSize} sq ft</p>
      <p><strong>Roof Type:</strong> ${calculationData.roofType}</p>
      <hr>
      <h3>Estimated Savings:</h3>
      <p><strong>Monthly Savings:</strong> $${calculationData.monthlySavings}</p>
      <p><strong>Year One Savings:</strong> $${calculationData.yearOneSavings}</p>
      <p><strong>20-Year Savings:</strong> $${calculationData.twentyYearSavings}</p>
      <p><strong>System Size:</strong> ${calculationData.systemSize}</p>
      <p><strong>Calculated:</strong> ${new Date().toLocaleString()}</p>
    `,
    text: `Solar Calculation: $${calculationData.monthlyBill} bill → $${calculationData.monthlySavings}/month savings`
  }),

  consultation: (consultationData: any, leadData: any) => ({
    subject: `📅 Consultation Scheduled - ${leadData.firstName} ${leadData.lastName}`,
    html: `
      <h2>Consultation Scheduled</h2>
      <p><strong>Client:</strong> ${leadData.firstName} ${leadData.lastName}</p>
      <p><strong>Email:</strong> ${leadData.email}</p>
      <p><strong>Phone:</strong> ${leadData.phone}</p>
      <p><strong>Notes:</strong> ${consultationData.notes}</p>
      <p><strong>Status:</strong> ${consultationData.status}</p>
      <p><strong>Scheduled:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p>Please follow up with the client within 24 hours to confirm the appointment.</p>
    `,
    text: `Consultation scheduled for ${leadData.firstName} ${leadData.lastName} (${leadData.email})`
  })
};