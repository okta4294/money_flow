import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In Next.js 16, "middleware" has been renamed to "proxy".
// Auth guard is handled client-side in layout components.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
