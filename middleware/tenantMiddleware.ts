import { NextRequest, NextResponse } from 'next/server';

// Define a structure for tenant context (can be expanded)
interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  isSubdomainTenant: boolean;
}

// --- Configuration ---
// In a real application, this would likely come from a database lookup or environment variables.
const DEFAULT_TENANT_ID = 'default';
const DEFAULT_TENANT_SLUG = 'default';
const TENANT_HEADER_NAME = 'X-Tenant-ID'; // Example header for API calls

/**
 * Attempts to extract the tenant identifier from the request.
 * Priority: Subdomain > Header
 * @param req The NextRequest object.
 * @returns The tenant identifier string or null if not found.
 */
function extractTenantIdentifier(req: NextRequest): string | null {
  const host = req.headers.get('host');

  if (!host) {
    return null;
  }

  // 1. Check for Subdomain (e.g., tenant1.yourapp.com)
  // This logic assumes the main domain is known (e.g., 'yourapp.com').
  // For simplicity in this generic middleware, we'll look for the first part before the main domain.
  // A more robust solution would involve knowing the production domain.
  const parts = host.split('.');
  
  // Heuristic: If there are more than 2 parts (e.g., 'local.dev' is 2, 'tenant.local.dev' is 3)
  // and it's not a common TLD like 'co.uk', assume the first part is the subdomain.
  if (parts.length > 2 && !host.endsWith('.localhost')) {
    const subdomain = parts[0];
    // Simple check to avoid matching common prefixes if possible, though this is highly context-dependent.
    if (subdomain !== 'www' && subdomain !== 'api') {
        return subdomain;
    }
  }

  // 2. Check for Header (useful for API routes or explicit routing)
  const headerTenantId = req.headers.get(TENANT_HEADER_NAME);
  if (headerTenantId) {
    return headerTenantId;
  }

  return null;
}

/**
 * Mocks a function to resolve the tenant ID based on the identifier found.
 * In a real app, this would query a database.
 * @param identifier The subdomain or header value.
 * @returns A resolved TenantContext object.
 */
function resolveTenant(identifier: string): TenantContext {
    // Simple mapping for demonstration.
    // If the identifier matches a known tenant slug, return its ID.
    // Otherwise, treat the identifier itself as the slug/ID for a new or default tenant.
    
    const tenantId = `tenant_${identifier.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    return {
        tenantId: tenantId,
        tenantSlug: identifier.toLowerCase(),
        isSubdomainTenant: true, // Assuming if we found an identifier, it's via subdomain/explicit route
    };
}


/**
 * Next.js Middleware to identify the tenant context from the request.
 * This context is then attached to the request headers so that subsequent
 * API routes or Server Components can access it via headers or request context.
 */
export function middleware(req: NextRequest) {
  const identifier = extractTenantIdentifier(req);
  const res = NextResponse.next();

  let tenantContext: TenantContext;

  if (identifier) {
    // Tenant found, resolve context
    tenantContext = resolveTenant(identifier);
    console.log(`Tenant identified: ${tenantContext.tenantSlug} (${tenantContext.tenantId})`);
  } else {
    // No specific tenant found, use default
    tenantContext = {
      tenantId: DEFAULT_TENANT_ID,
      tenantSlug: DEFAULT_TENANT_SLUG,
      isSubdomainTenant: false,
    };
    console.log(`No tenant identifier found. Using default tenant.`);
  }

  // Attach tenant context to request headers so it's available downstream
  // Note: Headers are case-insensitive in HTTP, but Next.js often prefers canonical casing.
  res.headers.set('x-tenant-id', tenantContext.tenantId);
  res.headers.set('x-tenant-slug', tenantContext.tenantSlug);
  res.headers.set('x-is-subdomain-tenant', tenantContext.isSubdomainTenant.toString());

  // Optional: Rewrite the URL path if necessary (e.g., to strip the subdomain for internal routing)
  // Example: If host is 'tenantA.myapp.com/dashboard', rewrite to '/dashboard?tenant=tenantA'
  // For simplicity in this generic middleware, we skip URL rewriting unless explicitly required.
  
  return res;
}

// Configuration for which paths the middleware should run on
export const config = {
  // Match all paths except static assets, Next.js internal files, and API routes starting with /api/auth
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (if you have specific auth routes you don't want middleware to touch)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};