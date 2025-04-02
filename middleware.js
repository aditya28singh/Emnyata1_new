import { NextResponse } from 'next/server';

// Define allowed routes for each role
const roleBasedRoutes = {
  ADMIN: ['/admin/manage-users', '/admin/meetings', '/admin/settings'],
  MENTOR: ['/mentor/schedule', '/mentor/manage-slots'],
  STUDENT: ['/student/slot-booking'],
};

// Define default routes for each role
const defaultRoutes = {
  ADMIN: '/admin/manage-users',
  MENTOR: '/mentor/schedule',
  STUDENT: '/student/slot-booking'
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow access to public routes, static assets, or API routes
  if (
    pathname === '/' ||
    pathname === '/select-role' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Retrieve the JWT token and selected role from cookies
  const token = req.cookies.get('token')?.value;
  const selectedRole = req.cookies.get('selectedRole')?.value;

  // If no token exists, redirect to the login page
  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    // Fetch user status and roles from the backend
    const response = await fetch('https://masai-connect-backend-w28f.vercel.app/api/get-user-status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const { status, roles } = await response.json();

    // Handle users with 'PENDING' status
    if (status === 'PENDING') {
      if (pathname.startsWith('/pending-approval') || pathname === '/') {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/pending-approval', req.url));
    }

    // Handle role selection and access for ACTIVE users
    if (status === 'ACTIVE') {
      if (roles.length > 1) {
        // Multiple roles: Handle role selection
        if (!selectedRole) {
          if (pathname !== '/select-role') {
            return NextResponse.redirect(new URL('/select-role', req.url));
          }
          return NextResponse.next();
        }

        // Validate access to allowed paths for the selected role
        const allowedPaths = roleBasedRoutes[selectedRole] || [];
        const isAllowed = allowedPaths.some((allowedPath) => pathname.startsWith(allowedPath));

        if (!isAllowed) {
          return NextResponse.redirect(new URL(defaultRoutes[selectedRole] || '/', req.url));
        }

        return NextResponse.next();
      } else if (roles.length === 1) {
        // Single role: Automatically direct the user to their role's dashboard
        const singleRole = roles[0];
        const allowedPaths = roleBasedRoutes[singleRole] || [];
        const isAllowed = allowedPaths.some((allowedPath) => pathname.startsWith(allowedPath));

        if (!isAllowed) {
          return NextResponse.redirect(new URL(defaultRoutes[singleRole] || '/', req.url));
        }

        return NextResponse.next();
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
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