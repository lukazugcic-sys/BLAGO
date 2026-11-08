import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
const source = readFileSync(new URL("../src/components/game/RaidModal.tsx", import.meta.url), "utf8");
function section(start, end) {
  const a = source.indexOf(start);
  assert.ok(a >= 0, `Missing source marker: ${start}`);
  const b = source.indexOf(end, a + start.length);
  assert.ok(b > a, `Missing end marker: ${end}`);
  return source.slice(a, b);
}
function handler(name, end, env) {
  const code = section(`  const ${name} =`, end);
  return runInNewContext(stripTypeScriptTypes(code + `\n${name};`), env);
}
function startHarness(overrides = {}) {
  let next = 0;
  const pending = new Map();
  const calls = [];
  const env = {
    lock: {current:false}, dead: {current:false}, telegraphUid:null,
    faza:"lista", telegraphT:{current:0}, HOLD_KADAR_MS:200,
    setTelegraphUid:()=>{}, osjeti:()=>{}, kreniOpsadu:(m)=>calls.push(m.uid),
    window:{clearTimeout:(id)=>pending.delete(id), setTimeout:(f)=>{pending.set(++next,f);return next;}},
    ...overrides,
  };
  const start = handler("kreniSMostom", "  const kreniOpsadu =", env);
  return {env,start,calls,pending,flush:()=>{const jobs=[...pending.values()];pending.clear();jobs.forEach(f=>f());}};
}
test("two same-tick POHOD clicks schedule only one siege",()=>{
  const h=startHarness(); h.start({uid:"npc-a"}); h.start({uid:"npc-a"});
  assert.equal(h.pending.size,1); h.flush(); assert.deepEqual(h.calls,["npc-a"]);
});
test("rapid clicks on different targets still start only the last queued target",()=>{
  const h=startHarness(); h.start({uid:"npc-a"}); h.start({uid:"npc-b"}); h.flush();
  assert.deepEqual(h.calls,["npc-b"]);
});
test("entry is blocked during a duel or while locked",()=>{
  for(const o of [{faza:"opsada"},{lock:{current:true}},{telegraphUid:"npc-a"}]){
    const h=startHarness(o); h.start({uid:"npc-a"}); assert.equal(h.pending.size,0);
  }
});
test("closing the modal cancels delayed siege work",()=>{
  const h=startHarness(); h.start({uid:"npc-a"}); h.env.dead.current=true; h.flush(); assert.equal(h.calls.length,0);
});
const listCode = section("    (async () => {", "    return () => {" );
async function targets({cloud=[], fail=false, userId="test-user"}={}) {
  let result,loading=true,requests=0;
  const env={ userId,cancelled:false,igracRazina:3,
    live:{cowboys:[{id:"live-a",connected:true,ime:"Mock",razina:3,drvo:10,kamen:10,zeljezo:10}]},
    withTimeout:async(p)=>p,
    listRaidTargets:async()=>{requests++;if(fail)throw Error("mock offline");return cloud;},
    setMete:(v)=>{result=v;},setUcitava:(v)=>{loading=v;},
    dohvatiLokalneMete:()=>[{uid:"npc-a",resursi:{drvo:5,kamen:5,zeljezo:5}}],
  };
  await runInNewContext(stripTypeScriptTypes(listCode),env);
  return {result,loading,requests};
}
test("network failure provides local NPC targets and preserves live labels",async()=>{
  const h=await targets({fail:true}); assert.equal(h.loading,false);
  assert.equal(h.result[0].uid,"live-a"); assert.equal(h.result[0].uzivo,true);
  assert.equal(h.result[1].uid,"npc-a");
});
test("empty cloud list uses local targets rather than an empty screen",async()=>{
  const h=await targets(); assert.equal(h.result.length,2); assert.equal(h.loading,false);
});
test("successful cloud list is used unchanged",async()=>{
  const cloud=[{uid:"cloud-a"}]; const h=await targets({cloud}); assert.equal(h.result,cloud);assert.equal(h.loading,false);
});
test("anonymous play needs no cloud request",async()=>{
  const h=await targets({userId:null}); assert.equal(h.requests,0);assert.equal(h.result[1].uid,"npc-a");
});
function victory(attack) {
  const phases=[],rewards=[];
  const env={lock:{current:false}, userId:"test-user",radKonja:0,jatoBrojRef:{current:0},
    jeNpcUid:(uid)=>uid.startsWith("npc"),attackPlayer:attack,withTimeout:async(p)=>p,
    playSfx:()=>{},flash:()=>{},setPlijen:()=>{},setPoruka:()=>{},
    setFaza:(v)=>phases.push(v),primiResurse:(v)=>rewards.push(v),
    izracunajPlijen:()=>({zlato:1}),plijenUkupno:(v)=>Object.values(v).reduce((a,b)=>a+b,0),
  };
  return {env,phases,rewards,finish:handler("zavrsiPobjedu","  const odigraj =",env)};
}
const meta={uid:"cloud-a",igracRazina:3,resursi:{drvo:10,kamen:10,zeljezo:10}};
test("concurrent cloud victory calls issue one request and one reward",async()=>{
  let resolve,requests=0;const response=new Promise(r=>{resolve=r;});
  const h=victory(()=>{requests++;return response;});
  const first=h.finish(meta); await h.finish(meta); assert.equal(requests,1);
  resolve({ok:true,stolen:{drvo:2,kamen:1,zeljezo:1}}); await first;
  assert.equal(h.rewards.length,1);assert.deepEqual(h.phases,["pobjeda"]);
});
test("failed attack cannot fabricate success or reward",async()=>{
  const h=victory(async()=>{throw Error("mock offline");});await h.finish(meta);
  assert.equal(h.rewards.length,0);assert.deepEqual(h.phases,["greska"]);assert.equal(h.env.lock.current,false);
});
test("blocked and missing targets give no reward",async()=>{
  for(const [response,phase] of [[{ok:true,blocked:true},"blokirano"],[{ok:false,reason:"missing"},"greska"]]){
    const h=victory(async()=>response);await h.finish(meta);assert.equal(h.rewards.length,0);assert.deepEqual(h.phases,[phase]);
  }
});
