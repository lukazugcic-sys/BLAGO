import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const compiled=readFileSync(process.env.KAUBA_COMPILED || "/workspace/blago-backups/pohod-qa-20261108/KaubaScena.cjs","utf8");
const jsx=(type,props)=>({type,props});
const state={metci:0,metakRed:0,metakDogadaj:null};
const stubs={
 "react/jsx-runtime":{jsx,jsxs:jsx},
 "react":{useEffect:()=>{},useRef:v=>({current:v}),useState:v=>[v,()=>{}]},
 "@/lib/game/art":{ART:{ulica:"OLD-POSTER"},HUB_ART:{voda:"WATER-POSTER"},HUB_VIDEO:{zabava:"HUB-VIDEO"}},
 "@/lib/game/economy":{POTREBE_META:[]},
 "@/lib/utils":{cn:(...xs)=>xs.filter(x=>typeof x==="string").join(" ")},
 "@/lib/stores/gameStore":{useGameStore:f=>f(state)},
 "@/lib/game/sat":{useSekunda:()=>0},
 "./KaubaZivaUlica":{KaubaZivaUlica:"MAP"},
 "./VideoLoop":{VideoLoop:"VIDEO"},
};
const module={exports:{}};
runInNewContext(compiled,{module,exports:module.exports,require:n=>stubs[n]||{}});
const render=id=>module.exports.KaubaScena({id,doba:"dan",meni:null,imeNaselja:"Test",onHold:()=>{},onTap:()=>{},onOdabir:()=>{},onZatvori:()=>{}});
function nodes(v){if(!v||typeof v!=="object")return [];if(Array.isArray(v))return v.flatMap(nodes);return [v,...nodes(v.props?.children)];}
test("overview mounts map without legacy image or video",()=>{
 const all=nodes(render("selo"));assert.equal(all.filter(n=>n.type==="MAP").length,1);
 assert.equal(all.filter(n=>n.type==="img"||n.type==="VIDEO").length,0);
});
test("building detail keeps its poster",()=>{
 const all=nodes(render("voda"));assert.equal(all.filter(n=>n.type==="MAP").length,0);
 assert.equal(all.find(n=>n.type==="img")?.props.src,"WATER-POSTER");
});
test("building detail keeps its video",()=>{
 const all=nodes(render("zabava"));assert.equal(all.find(n=>n.type==="VIDEO")?.props.src,"HUB-VIDEO");
});
