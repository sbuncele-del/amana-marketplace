import {NextResponse,type NextRequest} from 'next/server';
export function proxy(request:NextRequest){
 const path=request.nextUrl.pathname.replace(/^\/algeria(?=\/|$)/,'');
 const locale=path.split('/')[1];
 const headers=new Headers(request.headers);
 headers.set('x-algeria-locale',['en','fr','ar'].includes(locale)?locale:'ar');
 return NextResponse.next({request:{headers}});
}
