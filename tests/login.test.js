import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';

const bundle=await build({entryPoints:['public/js/portal/auth.js'],bundle:true,write:false,format:'iife',globalName:'authModule',plugins:[{name:'login-test-mocks',setup(b){
  b.onResolve({filter:/services\/supabase\.js$/},()=>({path:'db',namespace:'mock'}));
  b.onResolve({filter:/\/ui\.js$/},()=>({path:'ui',namespace:'mock'}));
  b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path==='db'?`export const db=globalThis.mockDb;export const configured=true;export async function result(q){const r=await q;if(r.error)throw r.error;return r.data}`:`export const field=()=>'';export const escapeHTML=String;export const showStatus=()=>{};export function bindForm(id,fn){globalThis.submit=fn;}`}));
}}]});
function setup(actualRole,selectedRole,{active=true,user=true,queryError=false}={}){
  let signouts=0,entered=0;const dummy={};
  const profile=actualRole===null?null:{id:'user-1',role:actualRole,active};
  const mockDb={auth:{getUser:async()=>({data:{user:user?{id:'user-1'}:null}}),signInWithPassword:async()=>({data:{}}),signOut:async()=>{signouts++;return{error:null}}},from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:profile,error:queryError?new Error('query failed'):null})})};
  const ctx=vm.createContext({mockDb,URLSearchParams,location:{search:`?role=${selectedRole}`},document:{documentElement:{},getElementById:()=>dummy,querySelector:()=>dummy}});
  vm.runInContext(bundle.outputFiles[0].text,ctx);
  ctx.authModule.loginView({innerHTML:'',querySelectorAll:()=>[]},async()=>{entered++});
  return {submit:()=>ctx.submit(new Map([['email','test@example.invalid'],['password','not-a-real-password']])),entered:()=>entered,signouts:()=>signouts};
}
test('login accepts each matching role and rejects all six mismatched portals',async()=>{
  for(const actual of ['parent','teacher','admin'])for(const chosen of ['parent','teacher','admin']){
    const s=setup(actual,chosen);
    if(actual===chosen){await s.submit();assert.equal(s.entered(),1);assert.equal(s.signouts(),0)}
    else{await assert.rejects(s.submit(),/does not match/);assert.equal(s.entered(),0);assert.ok(s.signouts()>0)}
  }
});
test('login never opens a dashboard for inactive, missing, unknown or unverifiable profiles',async()=>{
  for(const [role,options] of [['parent',{active:false}],[null,{}],['owner',{}],['parent',{user:false}],['parent',{queryError:true}]]){
    const s=setup(role,'parent',options);await assert.rejects(s.submit());assert.equal(s.entered(),0);assert.ok(s.signouts()>0);
  }
});
