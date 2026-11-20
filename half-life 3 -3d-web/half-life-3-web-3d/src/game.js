import * as THREE from "three";

const $ = id => document.getElementById(id);
const ui = {
  title:$("title"), pause:$("pause"), end:$("end"), hud:$("hud"), hint:$("hint"),
  objective:$("objective-text"), health:$("health"), healthBar:$("health-bar"),
  ammo:$("ammo"), toast:$("toast"), interact:$("interact"), damage:$("damage-flash"),
  map:$("map"), endHeading:$("end-heading"), endCopy:$("end-copy"),
  nextChapter:$("next-chapter"), sectorName:$("sector-name"), sectorNumber:$("sector-number"),
  chapterMeta:$("chapter-meta"), titleCopy:$("title-copy")
};
const renderer = new THREE.WebGLRenderer({canvas:$("game"),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const levelRoot = new THREE.Group();
levelRoot.name = "AFTERSIGNAL level";
scene.add(levelRoot);
scene.background = new THREE.Color(0x111a1b);
scene.fog = new THREE.FogExp2(0x111a1b,0.027);
const camera = new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.06,70);
camera.position.set(2,1.68,2);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const keys = new Set();
const SAVE_KEY = "aftersignal.campaign.v1";
function loadCampaign(){
 try{
  const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  return {
   unlockedChapter:Math.max(1,Math.min(2,Number(saved.unlockedChapter)||1)),
   currentChapter:Math.max(1,Math.min(2,Number(saved.currentChapter)||1)),
   checkpoint:typeof saved.checkpoint==="string"?saved.checkpoint:null
  };
 }catch{return {unlockedChapter:1,currentChapter:1,checkpoint:null};}
}
const campaign=loadCampaign();
function saveCampaign(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(campaign));}catch{}}
const world = {chapter:campaign.currentChapter,running:false,ended:false,locked:false,health:100,ammo:18,maxAmmo:18,reload:0,fireCd:0,damageCd:0,toastTime:0,objective:0,terminal:false,doorOpen:false,relay:false,coolantRestored:false,score:0};
const player = {position:new THREE.Vector3(2,1.68,2),radius:.34,speed:4.2};
const blockers = [];
const enemies = [];
const interactables = [];
const effects = [];
const level = {minX:0,maxX:30,minZ:0,maxZ:26};
const mat = (color,roughness=.86,metalness=.05)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const materials = {
  wall:mat(0x65716a),dark:mat(0x343e3a),floor:mat(0x3b423c),trim:mat(0x8a795e,.65,.25),
  metal:mat(0x56615c,.42,.6),panel:mat(0x263a38,.5,.35),amber:mat(0xc28d48,.5,.3),
  light: new THREE.MeshStandardMaterial({color:0x8ec7b8,emissive:0x32685d,emissiveIntensity:1.2}),
  enemy:mat(0x4e625d,.62,.2),warden:mat(0x35423f,.48,.34),enemyDark:mat(0x263331,.72,.15),red:new THREE.MeshStandardMaterial({color:0xb95f42,emissive:0x6b2115,emissiveIntensity:1.4})
};
scene.add(new THREE.HemisphereLight(0x9aafa9,0x20251f,1.05));
const keyLight=new THREE.DirectionalLight(0xd9d0b4,2.0);keyLight.position.set(-7,13,8);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-25;keyLight.shadow.camera.right=25;keyLight.shadow.camera.top=25;keyLight.shadow.camera.bottom=-25;scene.add(keyLight);

function addBox(x,y,z,sx,sy,sz,material,solid=true){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;levelRoot.add(mesh);
 if(solid) blockers.push({mesh,minX:x-sx/2,maxX:x+sx/2,minZ:z-sz/2,maxZ:z+sz/2});
 return mesh;
}
function addPointLight(x,y,z,color=0x9ac7bb,intensity=13,range=8){
 const light=new THREE.PointLight(color,intensity,range,2);light.position.set(x,y,z);levelRoot.add(light);
 const fixture=new THREE.Mesh(new THREE.BoxGeometry(1.1,.08,.18),new THREE.MeshBasicMaterial({color}));fixture.position.set(x,3.92,z);levelRoot.add(fixture);
}
function addRoomShell(){
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,26),materials.floor);floor.rotation.x=-Math.PI/2;floor.position.set(15,0,13);floor.receiveShadow=true;levelRoot.add(floor);
 const ceil=new THREE.Mesh(new THREE.PlaneGeometry(30,26),mat(0x28312f));ceil.rotation.x=Math.PI/2;ceil.position.set(15,4.4,13);levelRoot.add(ceil);
 addBox(15,2.2,0,30,4.4,.5,materials.wall);addBox(15,2.2,26,30,4.4,.5,materials.wall);
 addBox(0,2.2,13,.5,4.4,26,materials.wall);addBox(30,2.2,13,.5,4.4,26,materials.wall);
 // Structural wall sections create connected lab wings and a central passage.
 addBox(5.2,2.1,4.8,.45,4.2,4.4,materials.wall);addBox(5.2,2.1,9.2,.45,4.2,2.8,materials.wall);
 addBox(9.4,2.1,10.4,5.4,4.2,.45,materials.wall);
 addBox(15.2,2.1,5.1,.45,4.2,5.2,materials.wall);addBox(15.2,2.1,9.3,.45,4.2,2.5,materials.wall);
 addBox(8,2.1,15.2,6.2,4.2,.45,materials.wall);
 addBox(20.6,2.1,15.3,7.8,4.2,.45,materials.wall);
 addBox(9.8,2.1,20.1,.45,4.2,4.2,materials.wall);
 addBox(19.4,2.1,20.1,.45,4.2,4.2,materials.wall);
 // Reinforced columns, pipes and wall trims.
 for(const [x,z] of [[2,2],[8,2],[14,2],[22,2],[28,2],[2,13],[28,13],[2,24],[8,24],[15,24],[22,24],[28,24]]){
  addBox(x,2.05,z,.28,4.1,.28,materials.trim,false);
 }
 for(let x=2;x<29;x+=4){addBox(x,4.08,13,.16,.16,25,materials.dark,false);}
 addPointLight(3,3.7,3);addPointLight(11,3.7,4);addPointLight(19,3.7,4,0xb68b5c,10,7);
 addPointLight(25,3.7,12);addPointLight(5,3.7,18,0x75a99e,12,8);addPointLight(15,3.7,18);addPointLight(25,3.7,22,0xc28d48,13,8);
 // Consoles and crates used as cover / landmarks.
 addConsole(5.7,7.3);addConsole(22.5,5.5);addCrate(12,2,6.2);addCrate(24,2,17.5);addCrate(6.5,2,18.2);
}
function addConsole(x,z){
 addBox(x,.62,z,1.25,1.24,.72,materials.metal);
 const screen=new THREE.Mesh(new THREE.BoxGeometry(.84,.55,.045),materials.light);screen.position.set(x,.95,z-.39);levelRoot.add(screen);
 addBox(x,1.3,z,.1,.12,.12,materials.amber,false);
}
function addCrate(x,y,z){addBox(x,.7,z,1.2,1.4,1.2,materials.dark);addBox(x,1.42,z,.92,.05,.92,materials.trim,false);}
function makeTerminal(x,z,label,type){
 const group=new THREE.Group();group.position.set(x,0,z);levelRoot.add(group);
 const base=new THREE.Mesh(new THREE.BoxGeometry(.8,1.25,.6),materials.metal);base.position.y=.65;base.castShadow=true;group.add(base);
 const screen=new THREE.Mesh(new THREE.BoxGeometry(.58,.44,.035),materials.light);screen.position.set(0,1.02,-.32);group.add(screen);
 const lamp=new THREE.PointLight(0x77cbb6,1.3,2);lamp.position.set(0,1.3,-.4);group.add(lamp);
 interactables.push({group,x,z,label,type,used:false,range:1.7});
}
function makeDoor(x=17.2,z=11.4,label="SECURITY BULKHEAD"){
 const group=new THREE.Group();group.position.set(x,0,z);levelRoot.add(group);
 const panel=new THREE.Mesh(new THREE.BoxGeometry(.28,3.8,2.5),materials.metal);panel.position.y=1.9;panel.castShadow=true;group.add(panel);
 for(let offset=-1.05;offset<=1.05;offset+=.7){const stripe=new THREE.Mesh(new THREE.BoxGeometry(.32,3.4,.08),materials.trim);stripe.position.set(.17,1.9,offset);group.add(stripe);}
 interactables.push({group,x,z,label,type:"door",used:false,opened:false,halfX:.38,halfZ:1.35,range:2});
}
function makeRelay(){
 const g=new THREE.Group();g.position.set(25.3,0,22.5);levelRoot.add(g);
 const core=new THREE.Mesh(new THREE.CylinderGeometry(.48,.58,2.3,12),materials.metal);core.position.y=1.2;core.castShadow=true;g.add(core);
 const orb=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),new THREE.MeshStandardMaterial({color:0x9adacb,emissive:0x367e70,emissiveIntensity:1.5}));orb.position.y=2.6;g.add(orb);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.055,8,32),materials.amber);ring.position.y=2.2;ring.rotation.x=Math.PI/2;g.add(ring);
 const light=new THREE.PointLight(0x74c9b4,2,5);light.position.y=2.5;g.add(light);
 interactables.push({group:g,x:25.3,z:22.5,label:"EMERGENCY RELAY",type:"relay",used:false,range:2});
}
function makeMedkit(){const g=new THREE.Group();g.position.set(4.5,0,19.5);levelRoot.add(g);const box=new THREE.Mesh(new THREE.BoxGeometry(.65,.38,.55),mat(0x657d68));box.position.y=.3;g.add(box);const cross=new THREE.Mesh(new THREE.BoxGeometry(.12,.42,.04),materials.light);cross.position.set(0,.52,-.28);g.add(cross);interactables.push({group:g,x:4.5,z:19.5,label:"SUIT PATCH",type:"med",used:false,range:1.6});}
function makeCoolantValve(x,z){
 const group=new THREE.Group();group.position.set(x,0,z);levelRoot.add(group);
 const column=new THREE.Mesh(new THREE.CylinderGeometry(.32,.42,1.5,10),materials.metal);column.position.y=.75;column.castShadow=true;group.add(column);
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.48,.075,8,20),materials.amber);wheel.position.set(0,1.35,-.32);group.add(wheel);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.24,12),materials.dark);hub.rotation.x=Math.PI/2;hub.position.set(0,1.35,-.32);group.add(hub);
 const lamp=new THREE.PointLight(0x74c9b4,1.6,3);lamp.position.set(0,1.8,-.3);group.add(lamp);
 interactables.push({group,x,z,label:"COOLANT PRESSURE VALVE",type:"coolant",used:false,range:2});
}
function makeFreightLift(x,z){
 const group=new THREE.Group();group.position.set(x,0,z);levelRoot.add(group);
 const plinth=new THREE.Mesh(new THREE.BoxGeometry(2.8,.22,2.8),materials.dark);plinth.position.y=.11;plinth.receiveShadow=true;group.add(plinth);
 for(const [px,pz] of [[-1.15,-1.15],[1.15,-1.15],[-1.15,1.15],[1.15,1.15]]){
  const post=new THREE.Mesh(new THREE.BoxGeometry(.16,3.8,.16),materials.metal);post.position.set(px,1.9,pz);post.castShadow=true;group.add(post);
 }
 const lintel=new THREE.Mesh(new THREE.BoxGeometry(2.5,.18,.18),materials.trim);lintel.position.y=3.75;group.add(lintel);
 const control=new THREE.Mesh(new THREE.BoxGeometry(.55,.9,.28),materials.metal);control.position.set(1.55,.65,0);group.add(control);
 const indicator=new THREE.Mesh(new THREE.BoxGeometry(.25,.22,.04),materials.light);indicator.position.set(1.55,1.02,-.16);group.add(indicator);
 const lamp=new THREE.PointLight(0x78c9bd,2.1,7);lamp.position.y=3.1;group.add(lamp);
 interactables.push({group,x,z,label:"FREIGHT ELEVATOR",type:"lift",used:false,range:2.5});
}
function createEnemy(x,z,kind="drone"){
 const g=new THREE.Group();g.position.set(x,0,z);levelRoot.add(g);
 const heavy=kind==="warden";
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(heavy?.58:kind==="drone"?.38:.46,heavy?.78:.58,4,8),heavy?materials.warden:materials.enemy);body.position.y=1.12;body.castShadow=true;g.add(body);
 if(heavy){for(const side of [-1,1]){const shoulder=new THREE.Mesh(new THREE.BoxGeometry(.34,.34,.42),materials.enemyDark);shoulder.position.set(side*.48,1.55,.02);shoulder.castShadow=true;g.add(shoulder);}}
 const head=new THREE.Mesh(new THREE.SphereGeometry(heavy?.31:.28,12,10),materials.enemyDark);head.position.y=heavy?1.94:1.72;head.castShadow=true;g.add(head);
 const eye=new THREE.Mesh(new THREE.BoxGeometry(.35,.09,.08),materials.red);eye.position.set(0,1.76,-.25);g.add(eye);
 const pack=new THREE.Mesh(new THREE.BoxGeometry(.62,.65,.28),materials.enemyDark);pack.position.set(0,1.05,.36);g.add(pack);
 const gun=new THREE.Mesh(new THREE.BoxGeometry(.14,.16,.72),materials.dark);gun.position.set(.32,.9,-.32);g.add(gun);
 const healthBg=new THREE.Mesh(new THREE.BoxGeometry(.8,.07,.04),new THREE.MeshBasicMaterial({color:0x1b2422}));healthBg.position.y=2.25;g.add(healthBg);
 const healthFg=new THREE.Mesh(new THREE.BoxGeometry(.78,.045,.045),new THREE.MeshBasicMaterial({color:0xc77a51}));healthFg.position.set(0,2.25,-.025);g.add(healthFg);
 const max=heavy?132:kind==="drone"?55:75;
 enemies.push({group:g,x,z,hp:max,max,speed:heavy?.78:kind==="drone"?1.25:.95,attack:0,alive:true,kind,healthFg,phase:Math.random()*6});
}
function buildChapterOne(){
 addRoomShell();makeTerminal(6.4,7.5,"ACCESS TERMINAL","terminal");makeDoor();makeRelay();makeMedkit();
 createEnemy(11,4.2,"drone");createEnemy(22.5,8.2,"drone");createEnemy(7.3,21.7,"sentinel");createEnemy(24,18.2,"sentinel");
}
function addLowerComplex(){
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,26),materials.dark);floor.rotation.x=-Math.PI/2;floor.position.set(15,0,13);floor.receiveShadow=true;levelRoot.add(floor);
 const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(30,26),mat(0x1d2929));ceiling.rotation.x=Math.PI/2;ceiling.position.set(15,4.4,13);levelRoot.add(ceiling);
 addBox(15,2.2,0,30,4.4,.5,materials.wall);addBox(15,2.2,26,30,4.4,.5,materials.wall);
 addBox(0,2.2,13,.5,4.4,26,materials.wall);addBox(30,2.2,13,.5,4.4,26,materials.wall);
 addBox(15,2.2,5.375,.5,4.4,10.75,materials.wall);
 addBox(15,2.2,19.625,.5,4.4,12.75,materials.wall);
 addBox(7.8,2.1,16,.45,4.2,7.5,materials.wall);
 addBox(22.6,2.1,13,.45,4.2,6.5,materials.wall);
 for(let x=2;x<=28;x+=4){
  addBox(x,4.12,5,.14,.14,8,materials.trim,false);
  addBox(x,4.12,20,.14,.14,8,materials.trim,false);
 }
 for(const [x,z] of [[2,2],[8,2],[22,2],[28,2],[2,24],[8,24],[22,24],[28,24]])addBox(x,2.05,z,.3,4.1,.3,materials.trim,false);
 addPointLight(4,3.6,3,0x77c9ba,12,8);addPointLight(11,3.6,8,0xc28d48,9,7);
 addPointLight(18,3.6,15,0x77a9a4,10,8);addPointLight(25,3.6,7,0xb56b4d,10,8);
 addPointLight(25,3.6,22,0x79c8c6,14,9);
 addConsole(5.5,8.3);addConsole(26,5.1);addCrate(9,2,4.4);addCrate(19,2,7.2);addCrate(27,2,16.3);
}
function buildChapterTwo(){
 addLowerComplex();makeTerminal(5.6,5.4,"LOWER ACCESS TERMINAL","terminal");
 makeDoor(15,12,"PUMP HALL BULKHEAD");makeCoolantValve(23,5.8);makeFreightLift(25,21.7);
 createEnemy(10.2,9.5,"drone");createEnemy(21.3,11.1,"sentinel");createEnemy(23.1,18.2,"warden");
}
function build(){if(world.chapter===2)buildChapterTwo();else buildChapterOne();}
build();
syncChapterDisplay();

const weapon=new THREE.Group();camera.add(weapon);scene.add(camera);
const gunBody=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.72),mat(0x303a38,.45,.55));gunBody.position.set(.34,-.31,-.62);weapon.add(gunBody);
const gunTop=new THREE.Mesh(new THREE.BoxGeometry(.13,.09,.42),materials.trim);gunTop.position.set(.34,-.19,-.68);weapon.add(gunTop);
const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.22,10),materials.dark);barrel.rotation.x=Math.PI/2;barrel.position.set(.34,-.28,-1.02);weapon.add(barrel);
const muzzle=new THREE.PointLight(0xffc56f,0,3);muzzle.position.set(.34,-.28,-1.18);weapon.add(muzzle);

function collides(x,z){
 const r=player.radius;
 for(const b of blockers){if(x+r>b.minX&&x-r<b.maxX&&z+r>b.minZ&&z-r<b.maxZ)return true;}
 for(const door of interactables){
  if(door.type!=="door"||door.opened)continue;
  if(Math.abs(x-door.x)<door.halfX+player.radius&&Math.abs(z-door.z)<door.halfZ+player.radius)return true;
 }
 return false;
}
function showToast(text,duration=2.4){ui.toast.textContent=text;ui.toast.classList.add("show");world.toastTime=duration;}
const objectives={
 1:["Reach the access terminal","Open the security bulkhead","Reach the emergency relay","Relay signal restored"],
 2:["Reach the lower access terminal","Open the pump hall bulkhead","Restore coolant pressure","Reach the freight elevator"]
};
function setObjective(n){
 world.objective=n;
 const labels=objectives[world.chapter]||objectives[1];
 ui.objective.textContent=labels[n]||labels[labels.length-1];
}
function syncChapterDisplay(){
 const lower=world.chapter===2;
 ui.sectorName.textContent=lower?"LOWER COMPLEX":"QUIET WING";
 ui.sectorNumber.textContent=lower?"02":"01";
 ui.chapterMeta.textContent=lower?"CHAPTER 02 · THE LOWER COMPLEX":"CHAPTER 01 · THE QUIET WING";
 ui.titleCopy.textContent=lower
  ?"Beneath the quiet wing, the coolant pumps are running without a crew. Restore pressure and reach the freight lift."
  :"A research station has gone silent. The emergency relay is still transmitting from somewhere below the facility.";
 $("start").textContent=lower?"DESCEND TO LOWER COMPLEX":"ENTER THE FACILITY";
}
function updateHud(){ui.health.textContent=Math.max(0,Math.ceil(world.health));ui.healthBar.style.width=Math.max(0,world.health)+"%";ui.ammo.textContent=world.ammo;}
function start(){
 resetGame();campaign.currentChapter=world.chapter;saveCampaign();syncChapterDisplay();
 ui.title.classList.add("hidden");ui.pause.classList.add("hidden");ui.end.classList.add("hidden");
 ui.hud.classList.remove("hidden");ui.hint.classList.remove("hidden");
 world.running=true;world.ended=false;$("game").requestPointerLock?.();
 showToast(world.chapter===2&&campaign.checkpoint==="lower-coolant"?"CHECKPOINT RESTORED // PUMP HALL":"QUIET WING // SECURITY ALERT",3);
}
function startChapter(chapter){
 world.chapter=Math.max(1,Math.min(campaign.unlockedChapter,chapter));
 if(world.chapter===1)campaign.checkpoint=null;
 campaign.currentChapter=world.chapter;saveCampaign();start();
}
function clearLevel(){
 levelRoot.traverse(object=>{if(object.geometry)object.geometry.dispose();});
 levelRoot.clear();blockers.length=0;enemies.length=0;interactables.length=0;effects.length=0;
}
function resetGame(){
 world.health=100;world.ammo=18;world.reload=0;world.fireCd=0;world.damageCd=0;world.objective=0;
 world.terminal=false;world.doorOpen=false;world.relay=false;world.coolantRestored=false;
 world.score=0;world.ended=false;world.running=false;
 clearLevel();build();
 if(world.chapter===2&&campaign.checkpoint==="lower-coolant"){
  world.terminal=true;world.doorOpen=true;world.coolantRestored=true;
  const terminal=interactables.find(o=>o.type==="terminal");
  if(terminal){terminal.used=true;if(terminal.group.children[1])terminal.group.children[1].material=materials.amber;}
  const door=interactables.find(o=>o.type==="door");
  if(door){door.used=true;door.opened=true;door.group.position.y=4.2;door.group.visible=false;}
  const valve=interactables.find(o=>o.type==="coolant");
  if(valve)valve.used=true;
  player.position.set(18.2,1.68,14.7);setObjective(3);
 }else{
  player.position.set(2,1.68,2);setObjective(0);
 }
 camera.position.copy(player.position);camera.rotation.set(0,0,0);camera.rotation.order="YXZ";
 updateHud();
}
function saveCheckpoint(name){
 campaign.currentChapter=world.chapter;campaign.checkpoint=name;saveCampaign();
 showToast("CHECKPOINT STORED // "+name.toUpperCase(),2);
}
function pause(){if(!world.running)return;world.running=false;ui.pause.classList.remove("hidden");ui.hint.classList.add("hidden");document.exitPointerLock?.();}
function resume(){ui.pause.classList.add("hidden");world.running=true;ui.hint.classList.remove("hidden");$("game").requestPointerLock?.();}
function finish(win){
 world.running=false;world.ended=true;ui.nextChapter.classList.add("hidden");
 $("again").textContent=world.chapter===2?"REPLAY CHAPTER 02":"REPLAY CHAPTER 01";
 if(win&&world.chapter===1){
  campaign.unlockedChapter=Math.max(campaign.unlockedChapter,2);campaign.currentChapter=2;saveCampaign();
  ui.endHeading.textContent="SIGNAL FOUND";
  ui.endCopy.textContent="The emergency relay answers. Deep below the station, a freight lift powers on — and something moves in the pump hall.";
  ui.nextChapter.classList.remove("hidden");
 }else if(win){
  campaign.currentChapter=2;campaign.checkpoint=null;saveCampaign();
  ui.endHeading.textContent="LOWER COMPLEX SECURED";
  ui.endCopy.textContent="Coolant pressure is stable. The freight lift descends into an uncharted section of the facility. The signal continues.";
 }else{
  ui.endHeading.textContent="SUIT FAILURE";
  ui.endCopy.textContent="The facility remains hostile. Your last checkpoint is available; regroup and try again.";
 }
 ui.end.classList.remove("hidden");ui.hint.classList.add("hidden");document.exitPointerLock?.();
}
$("start").addEventListener("click",start);$("resume").addEventListener("click",resume);$("restart").addEventListener("click",start);$("again").addEventListener("click",start);
ui.nextChapter.addEventListener("click",()=>startChapter(2));
document.addEventListener("pointerlockchange",()=>{world.locked=document.pointerLockElement===$("game");});
document.addEventListener("mousemove",e=>{if(world.running&&world.locked){camera.rotation.y-=e.movementX*.0022;camera.rotation.x-=e.movementY*.0018;camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x,-1.45,1.45);}});
document.addEventListener("keydown",e=>{keys.add(e.code);if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="Escape"&&world.running)pause();if(e.code==="KeyE"&&world.running)interact();if(e.code==="KeyR"&&world.running)reload();});
document.addEventListener("keyup",e=>keys.delete(e.code));
$("game").addEventListener("mousedown",e=>{if(e.button===0&&world.running&&world.locked)shoot();});
$("game").addEventListener("click",()=>{if(world.running&&!world.locked)$("game").requestPointerLock?.();});
function reload(){if(world.reload<=0&&world.ammo<world.maxAmmo){world.reload=1.1;showToast("RECHARGING ENERGY CELLS",1);}}
function shoot(){
 if(!world.running||world.fireCd>0||world.reload>0)return;if(world.ammo<=0){showToast("ENERGY CELLS DEPLETED — PRESS R",1.5);return;}
 world.ammo--;world.fireCd=.25;updateHud();muzzle.intensity=4;setTimeout(()=>muzzle.intensity=0,65);
 const origin=camera.getWorldPosition(new THREE.Vector3()),dir=camera.getWorldDirection(new THREE.Vector3());raycaster.set(origin,dir);raycaster.far=32;
 const targets=enemies.filter(e=>e.alive).map(e=>e.group);
 const enemyHits=raycaster.intersectObjects(targets,true);
 const obstacles=blockers.map(b=>b.mesh);
 for(const door of interactables)if(door.type==="door"&&!door.opened)obstacles.push(door.group);
 const obstacleHits=raycaster.intersectObjects(obstacles,true);
 if(enemyHits.length&&(!obstacleHits.length||enemyHits[0].distance<obstacleHits[0].distance)){
  const obj=enemyHits[0].object;
  const enemy=enemies.find(e=>e.alive&&isChildOf(obj,e.group));
  if(enemy){
   enemy.hp-=34;enemy.healthFg.scale.x=Math.max(.001,enemy.hp/enemy.max);
   if(enemy.hp<=0){enemy.alive=false;levelRoot.remove(enemy.group);world.score+=100;showToast("HOSTILE UNIT DISABLED",1.1);}
   else showToast("TARGET HIT",.45);
  }
 }
}
function isChildOf(obj,parent){let p=obj;while(p){if(p===parent)return true;p=p.parent;}return false;}
function interact(){
 let nearest=null,best=Infinity;
 for(const o of interactables){
  if(o.used)continue;
  const d=Math.hypot(o.x-player.position.x,o.z-player.position.z);
  if(d<o.range&&d<best){best=d;nearest=o;}
 }
 if(!nearest){showToast("NO INTERACTIVE DEVICE IN RANGE",1.2);return;}
 if(nearest.type==="terminal"){
  world.terminal=true;nearest.used=true;
  if(nearest.group.children[1])nearest.group.children[1].material=materials.amber;
  setObjective(1);
  showToast(world.chapter===2?"LOWER ACCESS ONLINE // PUMP HALL POWER RESTORED":"ACCESS GRANTED // POWER ROUTING RESTORED",2.5);
 }else if(nearest.type==="door"){
  if(!world.terminal){showToast("BULKHEAD LOCKED — RESTORE POWER FIRST",1.8);return;}
  world.doorOpen=true;nearest.used=true;nearest.opened=true;nearest.group.userData.opening=true;
  setObjective(2);showToast("PRESSURE BULKHEAD OPEN",1.8);
 }else if(nearest.type==="relay"){
  if(!world.doorOpen){showToast("RELAY ACCESS BLOCKED",1.4);return;}
  world.relay=true;nearest.used=true;setObjective(3);
  showToast("EMERGENCY RELAY ONLINE",1.5);setTimeout(()=>finish(true),900);
 }else if(nearest.type==="coolant"){
  if(!world.doorOpen){showToast("PUMP HALL IS STILL SEALED",1.4);return;}
  world.coolantRestored=true;nearest.used=true;nearest.group.rotation.y=.8;
  setObjective(3);saveCheckpoint("lower-coolant");
  showToast("COOLANT PRESSURE RESTORED // FREIGHT LIFT POWERED",2.2);
 }else if(nearest.type==="lift"){
  if(!world.coolantRestored){showToast("LIFT LOCKED — RESTORE COOLANT PRESSURE FIRST",1.8);return;}
  nearest.used=true;showToast("FREIGHT LIFT ENGAGED",1.2);setTimeout(()=>finish(true),900);
 }else if(nearest.type==="med"){
  nearest.used=true;levelRoot.remove(nearest.group);
  world.health=Math.min(100,world.health+35);updateHud();showToast("SUIT PATCH APPLIED +35",1.5);
 }
}
function hurt(amount){world.health-=amount;ui.damage.style.opacity=".8";setTimeout(()=>ui.damage.style.opacity="0",110);updateHud();if(world.health<=0)finish(false);}
function updatePlayer(dt){
 const forward=(keys.has("KeyW")||keys.has("ArrowUp")?1:0)-(keys.has("KeyS")||keys.has("ArrowDown")?1:0);
 const side=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0);const len=Math.hypot(forward,side)||1;
 const speed=player.speed*(keys.has("ShiftLeft")?1.45:1);
 const yaw=camera.rotation.y;const dx=(Math.sin(yaw)*forward+Math.cos(yaw)*side)/len*speed*dt;
 const dz=(-Math.cos(yaw)*forward+Math.sin(yaw)*side)/len*speed*dt;
 const nx=player.position.x+dx,nz=player.position.z+dz;
 if(!collides(nx,player.position.z))player.position.x=nx;if(!collides(player.position.x,nz))player.position.z=nz;
 camera.position.copy(player.position);
}
function updateEnemies(dt){
 for(const e of enemies){if(!e.alive)continue;e.attack=Math.max(0,e.attack-dt);const dx=player.position.x-e.x,dz=player.position.z-e.z,d=Math.hypot(dx,dz);
  if(d<11){if(d>.9){const vx=dx/d*e.speed*dt,vz=dz/d*e.speed*dt;const nx=e.x+vx,nz=e.z+vz;if(!collides(nx,e.z))e.x=nx;if(!collides(e.x,nz))e.z=nz;e.group.position.set(e.x,Math.sin(performance.now()*.004+e.phase)*.035,e.z);e.group.rotation.y=Math.atan2(dx,dz);}
   else if(e.attack<=0&&world.damageCd<=0){hurt(7);e.attack=1.1;world.damageCd=.65;showToast("WARNING: SUIT IMPACT",.55);}
  }
 }
}
function updateInteractPrompt(){
 let nearest=null,best=Infinity;for(const o of interactables){if(o.used)continue;const d=Math.hypot(o.x-player.position.x,o.z-player.position.z);if(d<o.range&&d<best){nearest=o;best=d;}}
 ui.interact.classList.toggle("hidden",!nearest);if(nearest)ui.interact.innerHTML="[ E ] <span>"+nearest.label+"</span>";
}
function drawMap(){
 const c=ui.map.getContext("2d"),w=160,h=160;c.clearRect(0,0,w,h);c.fillStyle="#172522";c.fillRect(0,0,w,h);
 const sx=w/30,sz=h/26;c.fillStyle="#65736a";
 for(const b of blockers)c.fillRect(b.minX*sx,b.minZ*sz,(b.maxX-b.minX)*sx,(b.maxZ-b.minZ)*sz);
 for(const door of interactables)if(door.type==="door"&&!door.opened){
  c.fillStyle="#b58a50";c.fillRect(door.x*sx-2,door.z*sz-7,4,14);
 }
 for(const e of enemies)if(e.alive){c.fillStyle="#d77a58";c.fillRect(e.x*sx-2,e.z*sz-2,4,4);}
 for(const o of interactables)if(!o.used){c.fillStyle="#d5ad68";c.fillRect(o.x*sx-2,o.z*sz-2,4,4);}
 c.save();c.translate(player.position.x*sx,player.position.z*sz);c.rotate(-camera.rotation.y);c.fillStyle="#e5eee4";c.beginPath();c.moveTo(0,-6);c.lineTo(-4,4);c.lineTo(4,4);c.fill();c.restore();
}
function update(dt){
 if(!world.running)return;
 world.fireCd=Math.max(0,world.fireCd-dt);world.damageCd=Math.max(0,world.damageCd-dt);
 if(world.reload>0){world.reload-=dt;if(world.reload<=0){world.ammo=world.maxAmmo;updateHud();showToast("ENERGY CELLS RESTORED",1);}}
 if(world.toastTime>0){world.toastTime-=dt;if(world.toastTime<=0)ui.toast.classList.remove("show");}
 updatePlayer(dt);updateEnemies(dt);updateInteractPrompt();
 for(const o of interactables)if(o.type==="door"&&o.group.userData.opening){o.group.position.y=Math.min(4.2,o.group.position.y+dt*3.4);if(o.group.position.y>=4.2)o.group.visible=false;}
 weapon.position.y=Math.sin(performance.now()*.006)*.008;
}
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);update(dt);renderer.render(scene,camera);drawMap();
}
animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));});
