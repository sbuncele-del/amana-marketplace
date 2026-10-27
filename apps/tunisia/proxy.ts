import {NextResponse,type NextRequest} from 'next/server';
export function proxy(request:NextRequest){
 const path=request.nextUrl.pathname.replace(/^\/tunisia(?=\/|$)/,'');
 const locale=path.split('/')[1];
 const headers=new Headers(request.headers);
 headers.set('x-tunisia-locale',['en','fr','ar'].includes(locale)?locale:'en');
 return NextResponse.next({request:{headers}});
}
