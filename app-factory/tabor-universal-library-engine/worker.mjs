const types={html:"text/html; charset=utf-8",mjs:"text/javascript; charset=utf-8",css:"text/css; charset=utf-8",json:"application/json; charset=utf-8"};
export default {
  fetch(request){
    const url=new URL(request.url),head=request.method==="HEAD";
    if(request.method!=="GET"&&!head)return new Response(null,{status:405,headers:{Allow:"GET, HEAD"}});
    if(url.pathname==="/")return new Response(null,{status:302,headers:{Location:entry+url.search,"Cache-Control":"no-store"}});
    const path=url.pathname===entry?entry+"index.html":url.pathname;
    if(!Object.hasOwn(files,path))return new Response(head?null:"Not found",{status:404});
    const headers={"Content-Type":types[path.split(".").pop()],"Cache-Control":"no-cache","X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
    return new Response(head?null:files[path],{headers});
  }
};
