const assert=require('node:assert/strict');
const REF='rhxeclddohpwtpzkruzm';
const TRAVELER_ID='c0a51947-db42-49f5-b215-74f8f6cc186b';
const OWNER_ID='d4b045df-d356-4c25-be54-608bf76a17a2';
const ADMIN_ID='7d223c09-1df3-4438-ab55-9caa92eaefc2';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a4sAAAAASUVORK5CYII=','base64');
for(const k of ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','TRAVELER_EMAIL','TRAVELER_PASSWORD','ADMIN_EMAIL','ADMIN_PASSWORD'])assert.ok(process.env[k],'Missing secret '+k);
const base=process.env.SUPABASE_URL.replace(/\/$/,'');assert.equal(new URL(base).hostname,REF+'.supabase.co','Refusing non-Staging target');
const anon=process.env.SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
async function login(email,password){const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:anon,'content-type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();assert.equal(r.ok,true,'Sign-in failed '+r.status);return d.access_token;}
async function api(path,{method='GET',token,admin=false,body,prefer}={}){const h={apikey:admin?service:anon,Authorization:'Bearer '+(admin?service:token)};if(body!==undefined)h['content-type']='application/json';if(prefer)h.Prefer=prefer;const r=await fetch(base+'/rest/v1/'+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});const raw=await r.text();let d=null;try{d=raw?JSON.parse(raw):null}catch{d=raw;}return {ok:r.ok,status:r.status,data:d,raw};}
async function storage(path,{method='POST',token,admin=false,body=PNG}={}){const h={apikey:admin?service:anon,Authorization:'Bearer '+(admin?service:token),'content-type':'image/png'};return fetch(base+'/storage/v1/object/owner-documents/'+path,{method,headers:h,body});}
const fixture={path:TRAVELER_ID+'/ci-owner-verification.png',id:null,profileChanged:false,uploaded:false};
async function main(){
 const [traveler,admin]=await Promise.all([login(process.env.TRAVELER_EMAIL,process.env.TRAVELER_PASSWORD),login(process.env.ADMIN_EMAIL,process.env.ADMIN_PASSWORD)]);
 const profile=await api('profiles?id=eq.'+TRAVELER_ID+'&select=id,role,requested_account_type',{admin:true});
 assert.equal(profile.ok,true);assert.equal(profile.data.length,1);
 assert.equal(profile.data[0].role,'traveler');assert.equal(profile.data[0].requested_account_type,'traveler');
 const changed=await api('profiles?id=eq.'+TRAVELER_ID,{method:'PATCH',admin:true,body:{requested_account_type:'owner'}});
 assert.equal(changed.ok,true);fixture.profileChanged=true;

 let res=await storage(fixture.path,{token:traveler});
 assert.equal(res.ok,true,'Eligible traveler owner-document upload failed: '+res.status+' '+await res.text());fixture.uploaded=true;
 console.log('PASS: traveler requesting owner status can upload a document under their own UID folder.');

 const insert=await api('owner_verifications?select=id,owner_id,document_path,status',{method:'POST',token:traveler,prefer:'return=representation',body:[{owner_id:TRAVELER_ID,document_path:fixture.path,status:'pending'}]});
 assert.equal(insert.ok,true,'Eligible owner-verification insert failed: '+insert.status+' '+insert.raw);
 fixture.id=insert.data[0].id;
 assert.equal(insert.data[0].status,'pending');
 console.log('PASS: eligible traveler can submit a pending owner-verification request.');

 const own=await api('owner_verifications?select=id,owner_id,status&id=eq.'+fixture.id,{token:traveler});
 assert.equal(own.ok,true);assert.equal(own.data.length,1);
 console.log('PASS: applicant can read their own verification request.');

 const other=await api('owner_verifications?select=id&id=eq.'+fixture.id,{token:admin});
 assert.equal(other.ok,true);assert.equal(other.data.length,1);
 console.log('PASS: main admin can read submitted verification request.');

 const bad=await api('owner_verifications',{method:'POST',token:traveler,body:[{owner_id:OWNER_ID,document_path:fixture.path,status:'pending'}]});
 assert.equal(bad.ok,false,'Applicant submitted verification for another user.');
 console.log('PASS: applicant cannot submit verification for another account.');

 const selfApprove=await api('owner_verifications',{method:'POST',token:traveler,body:[{owner_id:TRAVELER_ID,document_path:fixture.path,status:'approved'}]});
 assert.equal(selfApprove.ok,false,'Applicant inserted an already-approved verification.');
 console.log('PASS: applicant cannot self-approve by inserting an approved row.');

 const update=await api('owner_verifications?id=eq.'+fixture.id,{method:'PATCH',token:traveler,body:{status:'approved'}});
 assert.equal(update.ok,true,'RLS update request unexpectedly returned an HTTP error; checking persisted state.');
 const unchanged=await api('owner_verifications?select=status&id=eq.'+fixture.id,{token:traveler});
 assert.equal(unchanged.data[0].status,'pending');
 console.log('PASS: applicant cannot change pending request status.');

 const rpc=await fetch(base+'/rest/v1/rpc/approve_owner_verification',{method:'POST',headers:{apikey:anon,Authorization:'Bearer '+admin,'content-type':'application/json'},body:JSON.stringify({p_request_id:fixture.id})});
 assert.equal(rpc.ok,true,'Main admin approval RPC failed: '+rpc.status+' '+await rpc.text());
 const approved=await api('owner_verifications?select=status,reviewed_by&id=eq.'+fixture.id,{admin:true});
 assert.equal(approved.data[0].status,'approved');assert.equal(approved.data[0].reviewed_by,ADMIN_ID);
 console.log('PASS: main admin alone approves the owner-verification request.');

 const role=await api('profiles?select=role,requested_account_type&id=eq.'+TRAVELER_ID,{admin:true});
 assert.equal(role.data[0].role,'owner');
 console.log('PASS: approved request changes applicant profile role to owner.');

 const resubmit=await api('owner_verifications',{method:'POST',token:traveler,body:[{owner_id:TRAVELER_ID,document_path:fixture.path,status:'pending'}]});
 assert.equal(resubmit.ok,false,'Approved owner account resubmitted owner verification.');
 console.log('PASS: approved owner cannot submit a second owner-verification request.');
 console.log('PASS: owner-verification submission and approval JWT end-to-end scenarios completed against isolated Staging.');
}
main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1;}).finally(async()=>{
 if(fixture.profileChanged){const r=await api('profiles?id=eq.'+TRAVELER_ID,{method:'PATCH',admin:true,body:{role:'traveler',requested_account_type:'traveler'}});if(!r.ok){console.error('CLEANUP FAILURE: profile restoration failed',r.status,r.raw);process.exitCode=1;}else console.log('CLEANUP: test profile role and requested account type restored.');}
 if(fixture.id){const r=await api('owner_verifications?id=eq.'+fixture.id,{method:'DELETE',admin:true});if(!r.ok){console.error('CLEANUP FAILURE: verification row removal failed',r.status,r.raw);process.exitCode=1;}}
 if(fixture.uploaded){const r=await fetch(base+'/storage/v1/object/owner-documents',{method:'DELETE',headers:{apikey:service,Authorization:'Bearer '+service,'content-type':'application/json'},body:JSON.stringify({prefixes:[fixture.path]})});if(!r.ok){console.error('CLEANUP FAILURE: synthetic document removal failed',r.status,await r.text());process.exitCode=1;}}
 console.log('CLEANUP: temporary owner-verification row and synthetic document cleanup attempted.');
});
