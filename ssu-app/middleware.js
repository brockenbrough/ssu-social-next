import NextAuth from 'next-auth';
import { authConfig } from './app/lib/auth.config';
 
export default NextAuth(authConfig).auth;
 
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // Exclude API routes, Socket.IO endpoint, and common static assets from auth middleware
  matcher: ['/((?!api|socket\\.io|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)'],
};