import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {return {name:"DecodeHire",short_name:"DecodeHire",start_url:"/dashboard",display:"standalone",background_color:"#090b16",theme_color:"#6d28d9",icons:[{src:"/icons/icon.svg",sizes:"any",type:"image/svg+xml"},{src:"/icons/maskable-icon.svg",sizes:"any",type:"image/svg+xml",purpose:"maskable"}]};}
