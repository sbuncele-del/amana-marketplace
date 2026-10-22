import {NextResponse} from "next/server";

// Retired marketplace integration; a future approved provider needs its own verified flow.
export async function POST() {
  return NextResponse.json({error:"Legacy payment operations are unavailable.",code:"LEGACY_PAYMENTS_DISABLED"},{status:503,headers:{"Cache-Control":"no-store"}});
}
