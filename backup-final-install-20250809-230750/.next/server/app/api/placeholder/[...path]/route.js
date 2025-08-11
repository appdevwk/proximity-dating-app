(()=>{var e={};e.id=151,e.ids=[151],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4862:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>h,routeModule:()=>l,serverHooks:()=>u,workAsyncStorage:()=>c,workUnitAsyncStorage:()=>d});var s={};r.r(s),r.d(s,{GET:()=>n});var a=r(6559),i=r(8088),o=r(7719),p=r(2190);async function n(e,{params:t}){let{path:r}=await t,[s,a]=r,i=`
    <svg width="${s}" height="${a}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ec4899;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      <circle cx="${s/2}" cy="${a/3}" r="${Math.min(s,a)/8}" fill="white" opacity="0.9"/>
      <ellipse cx="${s/2}" cy="${2*a/3}" rx="${Math.min(s,a)/6}" ry="${Math.min(s,a)/4}" fill="white" opacity="0.9"/>
    </svg>
  `;return new p.NextResponse(i,{headers:{"Content-Type":"image/svg+xml","Cache-Control":"public, max-age=31536000, immutable"}})}let l=new a.AppRouteRouteModule({definition:{kind:i.RouteKind.APP_ROUTE,page:"/api/placeholder/[...path]/route",pathname:"/api/placeholder/[...path]",filename:"route",bundlePath:"app/api/placeholder/[...path]/route"},resolvedPagePath:"/home/z/my-project/src/app/api/placeholder/[...path]/route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:c,workUnitAsyncStorage:d,serverHooks:u}=l;function h(){return(0,o.patchFetch)({workAsyncStorage:c,workUnitAsyncStorage:d})}},4870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6487:()=>{},8335:()=>{},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[447,580],()=>r(4862));module.exports=s})();