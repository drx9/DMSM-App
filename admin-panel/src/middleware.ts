import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
    // TEMPORARY: Bypassing auth for development
    return NextResponse.next();

    /*
    // Skip middleware for login page and API routes
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Verify JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch (error) {
        // Token is invalid or expired
        return NextResponse.redirect(new URL('/login', request.url));
    }
    */
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
    ],
}; 