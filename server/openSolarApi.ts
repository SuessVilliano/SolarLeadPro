// OpenSolar API integration
// Handles authentication, prospect/project creation, and data retrieval
// API docs: https://developers.opensolar.com/

const OPENSOLAR_API_BASE = 'https://api.opensolar.com';

interface OpenSolarAuthConfig {
  username: string;
  password: string;
  orgId: string;
  token?: string;
  tokenExpiry?: Date;
}

interface OpenSolarContact {
  first_name: string;
  family_name: string;
  email: string;
  phone: string;
}

interface OpenSolarProjectCreate {
  identifier?: string;
  is_residential?: string;
  lead_source?: string;
  notes?: string;
  lat?: string;
  lon?: string;
  address?: string;
  locality?: string;
  state?: string;
  country_iso2?: string;
  zip?: string;
  contacts_new?: OpenSolarContact[];
}

interface OpenSolarProject {
  id: number;
  url: string;
  org_id: number;
  identifier: string;
  address: string;
  lat: string;
  lon: string;
  locality: string;
  state: string;
  zip: string;
  lead_source: string;
  notes: string;
  contacts: string[];
  systems: string[];
  stage: number;
  is_residential: string;
  [key: string]: any;
}

interface OpenSolarSystemDetails {
  uuid: string;
  id: number;
  name: string;
  kw_stc: number;
  output_annual_kwh: number;
  consumption_offset_percentage: number;
  module_quantity: number;
  battery_total_kwh: number;
  price_including_tax: number;
  price_excluding_tax: number;
  modules: Array<{
    manufacturer_name: string;
    code: string;
    quantity: number;
  }>;
  inverters: Array<{
    manufacturer_name: string;
    code: string;
    quantity: number;
    max_power_rating: number;
  }>;
  batteries: Array<{
    manufacturer_name: string;
    code: string;
    quantity: number;
  }>;
}

// Module-level auth state
let authConfig: OpenSolarAuthConfig | null = null;

function getConfig(): OpenSolarAuthConfig {
  if (!authConfig) {
    const username = process.env.OPENSOLAR_USERNAME;
    const password = process.env.OPENSOLAR_PASSWORD;
    const orgId = process.env.OPENSOLAR_ORG_ID;

    if (!username || !password || !orgId) {
      throw new Error(
        'OpenSolar not configured. Set OPENSOLAR_USERNAME, OPENSOLAR_PASSWORD, and OPENSOLAR_ORG_ID environment variables.'
      );
    }

    authConfig = { username, password, orgId };
  }
  return authConfig;
}

/**
 * Authenticate with OpenSolar and get a bearer token
 */
async function authenticate(): Promise<string> {
  const config = getConfig();

  // Return cached token if still valid (refresh 1 hour before expiry)
  if (config.token && config.tokenExpiry && new Date() < config.tokenExpiry) {
    return config.token;
  }

  const response = await fetch(`${OPENSOLAR_API_BASE}/api-token-auth/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenSolar auth failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  config.token = data.token;
  // Tokens expire after 7 days, refresh after 6
  config.tokenExpiry = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);

  console.log('OpenSolar: Authenticated successfully');
  return config.token!;
}

/**
 * Make an authenticated API request to OpenSolar
 */
async function apiRequest(
  method: string,
  path: string,
  body?: any
): Promise<any> {
  const token = await authenticate();
  const config = getConfig();
  const url = `${OPENSOLAR_API_BASE}/api/orgs/${config.orgId}${path}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenSolar API error (${method} ${path}): ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Create a prospect (project) in OpenSolar from lead data
 */
export async function createProspect(leadData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  monthlyBill?: string;
  homeSize?: number;
  roofType?: string;
  energyGoals?: string;
  leadSource?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zip?: string;
}): Promise<OpenSolarProject> {
  const projectData: OpenSolarProjectCreate = {
    identifier: `LIV8-${Date.now()}`,
    is_residential: '1',
    lead_source: leadData.leadSource || 'LIV8 Solar Website',
    notes: buildProjectNotes(leadData),
    address: leadData.address,
    locality: leadData.city,
    state: leadData.state,
    country_iso2: 'US',
    zip: leadData.zip,
    contacts_new: [
      {
        first_name: leadData.firstName,
        family_name: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone,
      },
    ],
  };

  if (leadData.latitude && leadData.longitude) {
    projectData.lat = leadData.latitude.toString();
    projectData.lon = leadData.longitude.toString();
  }

  const project = await apiRequest('POST', '/projects/', projectData);

  console.log('OpenSolar: Prospect created', {
    projectId: project.id,
    identifier: project.identifier,
    address: project.address,
  });

  return project;
}

function buildProjectNotes(leadData: {
  monthlyBill?: string;
  homeSize?: number;
  roofType?: string;
  energyGoals?: string;
}): string {
  const lines: string[] = ['Submitted via LIV8 Solar website'];

  if (leadData.monthlyBill) {
    lines.push(`Monthly electric bill: $${leadData.monthlyBill}`);
  }
  if (leadData.homeSize) {
    lines.push(`Home size: ${leadData.homeSize} sq ft`);
  }
  if (leadData.roofType) {
    lines.push(`Roof type: ${leadData.roofType}`);
  }
  if (leadData.energyGoals) {
    lines.push(`Energy goals: ${leadData.energyGoals}`);
  }

  return lines.join('\n');
}

/**
 * Get a project by ID from OpenSolar
 */
export async function getProject(projectId: number): Promise<OpenSolarProject> {
  return apiRequest('GET', `/projects/${projectId}/`);
}

/**
 * Update a project in OpenSolar
 */
export async function updateProject(
  projectId: number,
  updates: Partial<OpenSolarProjectCreate>
): Promise<OpenSolarProject> {
  return apiRequest('PATCH', `/projects/${projectId}/`, updates);
}

/**
 * List all projects from OpenSolar
 */
export async function listProjects(): Promise<OpenSolarProject[]> {
  const data = await apiRequest('GET', '/projects/');
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Get system details (panels, inverters, batteries, pricing) for a project
 */
export async function getSystemDetails(projectId: number): Promise<OpenSolarSystemDetails[]> {
  const data = await apiRequest('GET', `/projects/${projectId}/systems/details/`);
  return Array.isArray(data) ? data : data.results || [];
}

/**
 * Get a system design image URL
 */
export function getSystemImageUrl(projectId: number, systemUuid: string, width = 500, height = 500): string {
  const config = getConfig();
  return `${OPENSOLAR_API_BASE}/api/orgs/${config.orgId}/projects/${projectId}/systems/${systemUuid}/image/?width=${width}&height=${height}`;
}

/**
 * Search contacts in OpenSolar by email
 */
export async function findContactByEmail(email: string): Promise<any> {
  const data = await apiRequest('GET', `/contacts/?search=${encodeURIComponent(email)}`);
  const results = Array.isArray(data) ? data : data.results || [];
  return results.length > 0 ? results[0] : null;
}

/**
 * Create a webhook in OpenSolar to receive project updates
 */
export async function createWebhook(
  endpoint: string,
  triggerFields: string[] = ['project.stage'],
  payloadFields: string[] = [
    'project.address',
    'project.contacts_data',
    'project.systems.price_including_tax',
    'project.systems.modules',
    'project.systems.inverters',
    'project.systems.batteries',
    'project.systems.kw_stc',
    'project.systems.output_annual_kwh',
  ]
): Promise<any> {
  return apiRequest('POST', '/webhooks/', {
    endpoint,
    enabled: true,
    debug: false,
    trigger_fields: triggerFields,
    payload_fields: payloadFields,
  });
}

/**
 * Get a summarized view of an OpenSolar project for the client portal
 */
export async function getProjectSummary(projectId: number): Promise<{
  project: OpenSolarProject;
  systems: OpenSolarSystemDetails[];
  summary: {
    address: string;
    stage: number;
    systemCount: number;
    totalCapacityKw: number;
    totalPanels: number;
    totalBatteryKwh: number;
    estimatedAnnualOutput: number;
    estimatedPrice: number;
    panelManufacturers: string[];
    inverterManufacturers: string[];
    batteryManufacturers: string[];
  };
}> {
  const [project, systems] = await Promise.all([
    getProject(projectId),
    getSystemDetails(projectId),
  ]);

  const panelManufacturers = new Set<string>();
  const inverterManufacturers = new Set<string>();
  const batteryManufacturers = new Set<string>();

  let totalCapacity = 0;
  let totalPanels = 0;
  let totalBattery = 0;
  let totalAnnualOutput = 0;
  let totalPrice = 0;

  for (const system of systems) {
    totalCapacity += system.kw_stc || 0;
    totalPanels += system.module_quantity || 0;
    totalBattery += system.battery_total_kwh || 0;
    totalAnnualOutput += system.output_annual_kwh || 0;
    totalPrice += system.price_including_tax || 0;

    for (const m of system.modules || []) {
      if (m.manufacturer_name) panelManufacturers.add(m.manufacturer_name);
    }
    for (const inv of system.inverters || []) {
      if (inv.manufacturer_name) inverterManufacturers.add(inv.manufacturer_name);
    }
    for (const bat of system.batteries || []) {
      if (bat.manufacturer_name) batteryManufacturers.add(bat.manufacturer_name);
    }
  }

  return {
    project,
    systems,
    summary: {
      address: project.address,
      stage: project.stage,
      systemCount: systems.length,
      totalCapacityKw: Math.round(totalCapacity * 10) / 10,
      totalPanels,
      totalBatteryKwh: Math.round(totalBattery * 10) / 10,
      estimatedAnnualOutput: Math.round(totalAnnualOutput),
      estimatedPrice: Math.round(totalPrice),
      panelManufacturers: Array.from(panelManufacturers),
      inverterManufacturers: Array.from(inverterManufacturers),
      batteryManufacturers: Array.from(batteryManufacturers),
    },
  };
}

/**
 * Check if OpenSolar integration is configured
 */
export function isOpenSolarConfigured(): boolean {
  return !!(
    process.env.OPENSOLAR_USERNAME &&
    process.env.OPENSOLAR_PASSWORD &&
    process.env.OPENSOLAR_ORG_ID
  );
}
