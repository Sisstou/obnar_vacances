const assert = require('node:assert/strict');

const REF='rhxeclddohpwtpzkruzm';
const OWNER_ID='d4b045df-d356-4c25-be54-608bf76a17a2';
const TRAVELER_ID='c0a51947-db42-49f5-b215-74f8f6cc186b';
const ADMIN_ID='7d223c09-1df3-4438-ab55-9caa92eaefc2';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a4sAAAAASUVORK5CYII=','base64');
for(const k of ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','OWNER_EMAIL','OWNER_PASSWORD','TRAVELER_EMAIL','TRAVELER_PASSWORD','ADMIN_EMAIL','ADMIN_PASSWORD']) assert.ok(process.env[k],'Missing secret '+k);
const base=process.env.SUPABASE_URL.replace(/\/$/,'');
assert.equal(new URL(base).hostname,REF+'.supabase.co','Refusing non-Staging target');
const anon=process.env.SUPABASE_ANON_KEY, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
async function login(email,password){
 const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:anon,'content-type':'application/json'},body:JSON.stringify({email,password})});
 const d=await r.json();assert.equal(r.ok,true,'Auth failed '+r.status);return d.access_token;
}
async function storage(path,{method='GET',token,admin=false,bucket='property-images',body,upsert=false}={}){
 const headers={apikey:admin?service:anon};
 headers.Authorization='Bearer '+(admin?service:token);
 if(body){headers['content-type']='image/png';if(upsert)headers['x-upsert']='true';}
 const r=await fetch(base+'/storage/v1/object/'+bucket+'/'+path,{method,headers,body});
 const data=Buffer.from(await r.arrayBuffer());
 return {ok:r.ok,status:r.status,body:data};
}
async function api(path,{method='GET',token,admin=false,body,prefer}={}){
 const headers={apikey:admin?service:anon,Authorization:'Bearer '+(admin?service:token)};
 if(body!==undefined)headers['content-type']='application/json';
 if(prefer)headers.Prefer=prefer;
 const r=await fetch(base+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw;}
 if(!r.ok)throw new Error(method+' '+path+' '+r.status+': '+(d?.message||raw));
 return d;
}
const fixture={propertyId:null,propertyPath:null,ownerDocPath:null};
async function main(){
 const [owner,traveler,admin]=await Promise.all([
  login(process.env.OWNER_EMAIL,process.env.OWNER_PASSWORD),
  login(process.env.TRAVELER_EMAIL,process.env.TRAVELER_PASSWORD),
  login(process.env.ADMIN_EMAIL,process.env.ADMIN_PASSWORD)
 ]);
 const admins=await api('platform_admins?select=user_id,is_main_admin&user_id=eq.'+ADMIN_ID,{admin:true});
 assert.equal(admins.length,1);assert.equal(admins[0].is_main_admin,true);

 const p=await api('properties?select=id',{method:'POST',admin:true,prefer:'return=representation',body:[{
  owner_id:OWNER_ID,title_ar:'CI test fixture storage property',title_fr:'CI test fixture storage property',
  description_ar:'Temporary storage JWT fixture.',description_fr:'Temporary storage JWT fixture.',
  property_type:'apartment',bedrooms:1,bathrooms:1,capacity:2,price_per_night:1000,currency:'DZD',status:'draft'
 }]});
 fixture.propertyId=p[0].id;
 fixture.propertyPath=OWNER_ID+'/'+fixture.propertyId+'/ci-storage-image.png';
 fixture.ownerDocPath=OWNER_ID+'/ci-owner-document.png';

 // Seed a synthetic private owner document using the service role, then
 // verify that ordinary JWT users can only retrieve their own folder.
 let res=await storage(fixture.ownerDocPath,{method:'POST',admin:true,bucket:'owner-documents',body:PNG});
 assert.equal(res.ok,true,'Service seed of synthetic owner document failed: '+res.status);
 res=await storage(fixture.ownerDocPath,{token:owner,bucket:'owner-documents'});
 assert.equal(res.ok,true,'Owner could not read own private document: '+res.status);
 assert.deepEqual(res.body,PNG);
 console.log('PASS: owner can read own private owner-document object.');

 res=await storage(fixture.ownerDocPath,{token:traveler,bucket:'owner-documents'});
 assert.equal(res.ok,false,'Different traveler read another owner document.');
 console.log('PASS: another authenticated user cannot read owner-document object.');

 res=await storage(fixture.ownerDocPath,{token:admin,bucket:'owner-documents'});
 assert.equal(res.ok,true,'Main admin cannot read owner-document object: '+res.status);
 console.log('PASS: main admin can read owner-document object.');

 res=await storage(TRAVELER_ID+'/ci-forbidden-upload.png',{method:'POST',token:traveler,bucket:'owner-documents',body:PNG});
 assert.equal(res.ok,false,'Ordinary traveler uploaded owner verification document without owner request.');
 console.log('PASS: ordinary traveler cannot upload owner verification documents.');

 res=await storage(OWNER_ID+'/ci-forbidden-owner-upload.png',{method:'POST',token:owner,bucket:'owner-documents',body:PNG});
 assert.equal(res.ok,false,'Already-approved owner account should not upload a new owner verification request.');
 console.log('PASS: approved owner account cannot re-upload owner verification documents.');

 // Property images: owner can upload only beneath their own UID/property path.
 res=await storage(fixture.propertyPath,{method:'POST',token:owner,bucket:'property-images',body:PNG});
 assert.equal(res.ok,true,'Owner upload failed: '+res.status);
 console.log('PASS: property owner can upload image under own property path.');

 res=await storage(fixture.propertyPath,{token:owner,bucket:'property-images'});
 assert.equal(res.ok,true,'Owner cannot read own draft property image: '+res.status);
 assert.deepEqual(res.body,PNG);
 console.log('PASS: owner can read own draft property image.');

 res=await storage(fixture.propertyPath,{token:traveler,bucket:'property-images'});
 assert.equal(res.ok,false,'Non-owner read private draft property image.');
 console.log('PASS: non-owner cannot read draft property image.');

 res=await storage(fixture.propertyPath,{method:'POST',token:traveler,bucket:'property-images',body:PNG});
 assert.equal(res.ok,false,'Non-owner uploaded image into another owner property folder.');
 console.log('PASS: non-owner cannot upload to another owner property path.');

 res=await storage(OWNER_ID+'/'+fixture.propertyId+'/ci-storage-image.png',{method:'POST',token:owner,bucket:'property-images',body:PNG,upsert:true});
 assert.equal(res.ok,true,'Owner upsert/replace failed: '+res.status);
 console.log('PASS: owner can replace own image using upsert.');

 res=await storage(fixture.propertyPath,{method:'DELETE',token:traveler,bucket:'property-images'});
 assert.equal(res.ok,false,'Non-owner deleted property image.');
 console.log('PASS: non-owner cannot delete property image.');

 res=await storage(fixture.propertyPath,{method:'DELETE',token:owner,bucket:'property-images'});
 assert.equal(res.ok,true,'Owner could not delete own property image: '+res.status);
 console.log('PASS: owner can delete own property image.');

 // A different folder prefix must not be usable even when the property ID is known.
 res=await storage(TRAVELER_ID+'/'+fixture.propertyId+'/ci-wrong-prefix.png',{method:'POST',token:owner,bucket:'property-images',body:PNG});
 assert.equal(res.ok,false,'Owner uploaded using a mismatched UID folder prefix.');
 console.log('PASS: property image path UID must match authenticated owner.');

 console.log('PASS: storage access JWT end-to-end scenarios completed against isolated Staging.');
}
main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1;}).finally(async()=>{
 if(fixture.propertyPath){
  try{await api('properties?id=eq.'+fixture.propertyId,{method:'DELETE',admin:true});}catch(e){console.error('Property cleanup failed:',e.message);process.exitCode=1;}
 }
 if(fixture.ownerDocPath){
  try{await fetch(base+'/storage/v1/object/owner-documents',{method:'DELETE',headers:{apikey:service,Authorization:'Bearer '+service,'content-type':'application/json'},body:JSON.stringify({prefixes:[fixture.ownerDocPath]})});}catch(e){console.error('Owner document cleanup failed:',e.message);process.exitCode=1;}
 }
 if(fixture.propertyPath){
  try{await fetch(base+'/storage/v1/object/property-images',{method:'DELETE',headers:{apikey:service,Authorization:'Bearer '+service,'content-type':'application/json'},body:JSON.stringify({prefixes:[fixture.propertyPath]})});}catch(e){console.error('Property image cleanup failed:',e.message);process.exitCode=1;}
 }
 console.log('CLEANUP: synthetic Staging storage objects and property fixture cleanup attempted.');
});
