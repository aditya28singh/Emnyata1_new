import { NextResponse } from 'next/server';

// Define allowed routes for each role - make sure casing matches what your API returns
const roleBasedRoutes = {
  'admin': ['/admin/manage-users', '/admin/meetings', '/admin/settings'],
  'mentor': ['/mentor/schedule', '/mentor/manage-slots'],
  'student': ['/student/slot-booking'],
};

// Define default routes for each role
const defaultRoutes = {
  'admin': '/admin/manage-users',
  'mentor': '/mentor/schedule', 
  'student': '/student/slot-booking'
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow access to the auth page and static assets
  if (
    pathname === '/' ||
    pathname === '/auth' ||
    pathname === '/select-role' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Retrieve the cookie values - checking for auth_session and user_id
  const authSession = req.cookies.get('auth_session')?.value;
  const user_id = req.cookies.get('user_id')?.value;
  const selectedRole = req.cookies.get('selectedRole')?.value;

  console.log('Middleware check:', { pathname, authSession, user_id, selectedRole });

  // If no authentication, redirect to the login page
  if (!authSession || !user_id) {
    console.log('No auth session or user ID, redirecting to login');
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    // If there's a role selected, check if the user is allowed to access the requested path
    if (selectedRole) {
      const role = selectedRole.toLowerCase();
      console.log(`Checking access for role: ${role}`);
      
      // Get allowed paths for this role
      const allowedPaths = roleBasedRoutes[role] || [];
      
      // Check if current path is allowed for this role
      const isAllowed = allowedPaths.some((allowedPath) => 
        pathname.startsWith(allowedPath)
      );

      // If not allowed, redirect to default route for this role
      if (!isAllowed) {
        console.log(`Path not allowed for role. Redirecting to default path.`);
        return NextResponse.redirect(new URL(defaultRoutes[role] || '/', req.url));
      }
      
      // Path is allowed for this role
      return NextResponse.next();
    } 
    else {
      // No role selected, redirect to role selection page
      if (pathname !== '/select-role') {
        console.log('No role selected, redirecting to role selection');
        return NextResponse.redirect(new URL('/select-role', req.url));
      }
      return NextResponse.next();
    }
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};