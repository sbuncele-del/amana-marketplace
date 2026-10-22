import 'server-only';
import type {NextRequest} from 'next/server';
export function sameRequestOrigin(request:NextRequest){const origin=request.headers.get('origin');if(!origin)return true;try{const supplied=new URL(origin);const host=request.headers.get('host');const forwardedProtocol=request.headers.get('x-forwarded-proto')?.split(',')[0].trim();const protocol=forwardedProtocol?forwardedProtocol+':':request.nextUrl.protocol;return supplied.origin===request.nextUrl.origin||(supplied.host===host&&supplied.protocol===protocol);}catch{return false;}}
