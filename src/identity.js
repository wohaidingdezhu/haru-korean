export async function identityFromHeaders(headers){
 const email=headers.get('oai-authenticated-user-email');if(!email)return null;
 let userId=headers.get('oai-authenticated-user-id');
 // Some Sites requests carry only verified email; hash it instead of storing it in progress rows.
 if(!userId){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(email.trim().toLowerCase()));userId='email:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
 let fullName=null;
 if(headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'){try{fullName=decodeURIComponent(headers.get('oai-authenticated-user-full-name')||'')||null;}catch{}}
 return {userId,email,fullName,displayName:fullName??email};
}
