import { auth } from "@/auth"

export default auth((req) => {
    // Allow the request to proceed. 
    // Authentication is handled client-side in app/page.js which shows LoginScreen if not authenticated.
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
