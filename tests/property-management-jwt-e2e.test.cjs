const assert = require('node:assert/strict');

const STAGING_REF = 'rhxeclddohpwtpzkruzm';
const OWNER_ID = 'd4b045df-d356-4c25-be54-608bf76a17a2';
const ADMIN_ID = '7d223c09-1df3-4438-ab55-9caa92eaefc2';
for (const key of ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','OWNER_EMAIL','OWNER_PASSWORD','ADMIN_EMAIL','ADMIN_PASSWORD']) {
  assert.ok(process.env[key], 'Missing GitHub Actions secret: ' + key);
}
const base = process.env.SUPABASE_URL.replace(/\/$/, '');
assert.equal(new URL(base).hostname, STAGING_REF + '.supabase.co', 'Refusing non-Staging target');
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function signIn(email,password) {
  const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:anon,'content-type':'application/json'},body:JSON.stringify({email,password})});
  const d=await r.json(); assert.equal(r.ok,true,'Sign-in failed: '+r.status); return d.access_token;
}
async function api(path,{method='GET',token,admin=false,body,prefer}={}) {
  const headers={apikey:admin?service:anon};
  if(admin && service.startsWith('eyJ')) headers.Authorization='Bearer '+service;
  else if(token) headers.Authorization='Bearer '+token;
  if(body!==undefined) headers['content-type']='application/json';
  if(prefer) headers.Prefer=prefer;
  const r=await fetch(base+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await r.text(); let d=null; try{d=raw?JSON.parse(raw):null;}catch{d=raw;}
  if(!r.ok) throw new Error(method+' '+path+' ('+r.status+'): '+(d?.message||raw));
  return d;
}
async function state(id) {
  const rows=await api('properties?select=id,status,title_ar,owner_id,price_per_night&id=eq.'+id,{admin:true});
  assert.equal(rows.length,1); return rows[0];
}
const fixture={id:null};
async function main(){
  const [owner,admin]=await Promise.all([
    signIn(process.env.OWNER_EMAIL,process.env.OWNER_PASSWORD),
    signIn(process.env.ADMIN_EMAIL,process.env.ADMIN_PASSWORD)
  ]);
  const adminRows=await api('platform_admins?select=user_id,is_main_admin&user_id=eq.'+ADMIN_ID,{admin:true});
  assert.equal(adminRows.length,1); assert.equal(adminRows[0].is_main_admin,true);
  const created=await api('properties?select=id',{method:'POST',admin:true,prefer:'return=representation',body:[{
    owner_id:OWNER_ID,title_ar:'CI test fixture property edit',title_fr:'CI test fixture property edit',
    description_ar:'Temporary Staging-only property update fixture.',description_fr:'Temporary Staging-only property update fixture.',
    property_type:'apartment',bedrooms:1,bathrooms:1,capacity:2,price_per_night:1000,currency:'DZD',status:'draft'
  }]});
  fixture.id=created?.[0]?.id; assert.ok(fixture.id);

  await api('properties?id=eq.'+fixture.id,{method:'PATCH',token:owner,body:{title_ar:'CI test fixture property owner edited'}});
  let row=await state(fixture.id);
  assert.equal(row.title_ar,'CI test fixture property owner edited');
  assert.equal(row.status,'draft');
  console.log('PASS: owner can edit own draft property through UPDATE grant and RLS.');

  await api('properties?id=eq.'+fixture.id,{method:'PATCH',token:owner,body:{status:'pending'}});
  row=await state(fixture.id); assert.equal(row.status,'pending');
  console.log('PASS: owner can submit draft property for review.');

  await api('properties?id=eq.'+fixture.id,{method:'PATCH',token:owner,body:{title_ar:'CI test fixture unauthorized pending edit'}});
  row=await state(fixture.id); assert.equal(row.title_ar,'CI test fixture property owner edited');
  console.log('PASS: owner cannot edit property after submission while pending.');

  await api('properties?id=eq.'+fixture.id,{method:'PATCH',token:owner,body:{status:'approved'}});
  row=await state(fixture.id); assert.equal(row.status,'pending');
  console.log('PASS: owner self-approval is blocked by RLS while pending.');

  await api('properties?id=eq.'+fixture.id,{method:'PATCH',token:owner,body:{title_ar:'CI test fixture unauthorized approved edit'}});
  row=await state(fixture.id); assert.equal(row.title_ar,'CI test fixture property owner edited');
  console.log('PASS: owner cannot edit approved property.');

  await api('properties?id=eq.'+fixture.id,{method:'PATCH',token:admin,body:{status:'approved'}});
  row=await state(fixture.id); assert.equal(row.status,'approved');
  console.log('PASS: main admin can approve property.');

  await api('properties?id=eq.'+fixture.id,{method:'PATCH',token:owner,body:{price_per_night:1}});
  row=await state(fixture.id); assert.equal(row.status,'approved'); assert.equal(Number(row.price_per_night),1000);
  console.log('PASS: owner cannot change approved property.');

  await api('properties?id=eq.'+fixture.id,{method:'DELETE',token:owner});
  row=await state(fixture.id); assert.equal(row.id,fixture.id);
  console.log('PASS: owner cannot delete property.');
  console.log('PASS: property management JWT end-to-end scenarios completed against isolated Staging.');
}
main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1;}).finally(async()=>{
  if(fixture.id){
    try{
      await api('notifications?entity_id=eq.'+fixture.id,{method:'DELETE',admin:true});
      await api('properties?id=eq.'+fixture.id,{method:'DELETE',admin:true});
      console.log('CLEANUP: temporary Staging property and related rows deleted.');
    }catch(e){console.error('CLEANUP FAILURE:',e.message);process.exitCode=1;}
  }
});
