import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.querySelector('#world');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10121a);
scene.fog = new THREE.FogExp2(0x171820, 0.0085);
const camera = new THREE.PerspectiveCamera(54, innerWidth/innerHeight, .1, 280);
const clock = new THREE.Clock();
const world = new THREE.Group(); scene.add(world);
const mats = {};
const mat = (name,color,roughness=.85,metalness=0,emissive=0,emissiveIntensity=0) => mats[name] ||= new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity});
const stoneMats=[0x302d31,0x393338,0x393a40,0x40393a,0x34343a,0x474044].map((c,i)=>mat('stone'+i,c,.94));
const windowMat=mat('window',0x342b2b,.4,.05,0xb06548,.55);
const darkWindow=mat('darkWindow',0x10141b,.4,.1,0x263244,.35);
const roofMat=mat('roof',0x27232a,.9);
const goldMat=mat('gold',0xc69b6b,.35,.55,0x542a20,.3);
const heroMat=mat('hero',0x17151b,.74,.12);
const cloakMat=mat('cloak',0x461e2b,.66,.08,0x210b14,.25);
const skinMat=mat('skin',0xb8907d,.75);
const enemyMat=mat('enemy',0x24212a,.72,.08,0x260d16,.25);
const enemyCloth=mat('enemyCloth',0x3c3039,.8);
const bloodGlow=mat('bloodGlow',0x991d35,.28,.18,0xed163d,1.3);
const lootGlow=mat('lootGlow',0xb18a58,.3,.2,0xed9f48,1.1);
const wetMat=mat('wet',0x292a31,.34,.25);
const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
const box=(parent,x,y,z,sx,sy,sz,material,shadow=true)=>{let o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;};
const cylinder=(parent,x,y,z,rt,rb,h,material,segments=8)=>{let o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
const sphere=(parent,x,y,z,r,material,detail=8)=>{let o=new THREE.Mesh(new THREE.SphereGeometry(r,detail,detail),material);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};

// Night sky, moonlight and the wet old town streets.
scene.add(new THREE.HemisphereLight(0x8190b0,0x17131a,1.0));
const moon=new THREE.DirectionalLight(0xb7c4e3,2.1);moon.position.set(-32,50,24);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-55;moon.shadow.camera.right=55;moon.shadow.camera.top=55;moon.shadow.camera.bottom=-55;scene.add(moon);
const amber=new THREE.PointLight(0xc15a37,45,38,2);amber.position.set(-11,7,-11);scene.add(amber);
const blue=new THREE.PointLight(0x526fa9,30,44,2);blue.position.set(17,9,-28);scene.add(blue);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,260),mat('ground',0x25252c,.4,.28));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;world.add(ground);
// Stone street grid with inset rain-dark cobble seams.
const seamMat=mat('seam',0x17181d,.7,.1);
for(let x=-100;x<=100;x+=4) box(world,x,.005,0,.035,.012,205,seamMat,false);
for(let z=-100;z<=100;z+=4) box(world,0,.006,z,205,.012,.035,seamMat,false);
// Broad, glistening central avenue and narrow cross streets.
const avenue=box(world,0,.012,0,17,.025,190,wetMat,false); avenue.material=wetMat;
for(let z=-85;z<=85;z+=18) box(world,0,.02,z,160,.025,8,wetMat,false);
for(let side of [-1,1]) for(let z=-85;z<=85;z+=18){box(world,side*9,.11,z,1.1,.22,8,mat('curb',0x575258,.8),false);}
// Brick paving detail around the plaza.
const plaza=box(world,0,.035,-9,48,.04,33,mat('plaza',0x343139,.46,.2),false);

const blocks=[];
function makeBuilding(x,z,w,d,h,seed=1,landmark=false){
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);blocks.push({x,z,w,d,h});
  const stone=stoneMats[Math.abs(seed)%stoneMats.length];
  box(g,0,h/2,0,w,h,d,stone);
  // Tall masonry pilasters and stepped parapets give each block a handcrafted skyline.
  for(let sx of [-1,1]) for(let sz of [-1,1]) box(g,sx*(w/2-.22),h/2,sz*(d/2-.22),.42,h+.2,.42,stoneMats[(Math.abs(seed)+2)%stoneMats.length]);
  box(g,0,h+.16,0,w+.55,.32,d+.55,roofMat);
  box(g,0,h+.39,0,w+.25,.13,d+.25,goldMat);
  const rows=Math.min(5,Math.max(2,Math.floor((h-2.5)/4.2)));
  for(let row=0;row<rows;row++){
    const yy=2.3+row*4.05;if(yy>h-1.6)break;
    const count=Math.min(4,Math.max(2,Math.floor(w/4)));
    for(let n=0;n<count;n++){
      const xx=(n-(count-1)/2)*(w/(count+.3));
      const frontZ=-(d/2+.025);
      const glowing=((n*7+row*3+seed)%7)<3;
      const wm=glowing?windowMat:darkWindow;
      box(g,xx,yy,frontZ,.9,1.55,.09,wm,false);
      box(g,xx,yy+.84,frontZ,.98,.12,.14,stone,false);
    }
  }
  // Simple pitched dark roof and little dormer windows.
  const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.72,Math.min(5,h*.22),4),roofMat);roof.position.y=h+2.6;roof.rotation.y=Math.PI/4;roof.castShadow=true;g.add(roof);
  if(landmark){
    const tower=cylinder(g,0,h+4,0,w*.23,w*.29,8,stone,8);const spire=new THREE.Mesh(new THREE.ConeGeometry(w*.34,9,8),roofMat);spire.position.y=h+12;spire.castShadow=true;g.add(spire);
    cylinder(g,0,h+3,0,w*.32,w*.32,.28,goldMat,12);
    for(let a=0;a<8;a++){let angle=a*Math.PI/4;box(g,Math.cos(angle)*w*.15,h+4,Math.sin(angle)*w*.15,.22,4,.22,stoneMats[1]);}
    for(let y=h+5;y<h+11;y+=2)box(g,0,y,0,.12,.08,.12,goldMat,false);
  }
  return g;
}
// Irregular dense old town blocks leave winding, connected streets.
let seed=2;
for(let gx=-4;gx<=4;gx++)for(let gz=-5;gz<=5;gz++){
  const x=gx*22+(Math.sin(gx*12+gz*5)*2),z=gz*21+(Math.cos(gx*6-gz*11)*2);
  if(Math.abs(x)<15&&Math.abs(z)<18)continue;
  if(Math.random()<.13)continue;
  const w=10+Math.random()*7,d=10+Math.random()*7,h=12+Math.random()*19;
  makeBuilding(x,z,w,d,h,seed++,Math.abs(gx)%3===0&&Math.abs(gz)%3===1);
}
// Distant castle silhouette across the river-side roofs.
for(let i=0;i<7;i++){
  let x=-62+i*20,z=-82+(i%2)*6,h=27+(i%3)*8;
  const b=makeBuilding(x,z,15,12,h,seed++,i===3);
  if(i===3){for(let j=-1;j<=1;j++){let tower=cylinder(b,j*5,h+2,0,1.6,2,6,stoneMats[2],8);let sp=new THREE.Mesh(new THREE.ConeGeometry(2.4,8,8),mat('spires',0x211d27,.75));sp.position.set(j*5,h+9,0);b.add(sp);}}
}
// Cathedral at the far end of the central lane.
const church=new THREE.Group();church.position.set(0,0,-74);world.add(church);
box(church,0,10,0,24,20,19,stoneMats[2]);
for(let x of [-7,7]){cylinder(church,x,17,0,3.2,3.2,15,stoneMats[4],8);let sp=new THREE.Mesh(new THREE.ConeGeometry(4.1,14,8),roofMat);sp.position.set(x,31,0);sp.castShadow=true;church.add(sp);}
const rose=new THREE.Mesh(new THREE.TorusGeometry(2.5,.34,8,20),goldMat);rose.position.set(0,13,9.7);church.add(rose);sphere(church,0,13,9.65,1.8,windowMat,12);

// Warm street lanterns and gothic iron lamps.
const lanterns=[];
for(let z=-75;z<=75;z+=18)for(let side of [-1,1]){
 let x=side*10.4; cylinder(world,x,2.05,z,.075,.12,4,mat('iron',0x26242a,.55,.55),8);
 box(world,x,3.8,z,.85,.16,.85,roofMat);sphere(world,x,3.25,z,.2,mat('lamp',0xe8a264,.25,.1,0xff8040,2),8);
 let light=new THREE.PointLight(0xe0844d,5,10,2);light.position.set(x,3,z);scene.add(light);lanterns.push(light);
}
// Rain, floating on screen as world particles, with a distant cloud of city haze.
const rainN=1350,rainPos=new Float32Array(rainN*3),rainVel=new Float32Array(rainN);
for(let i=0;i<rainN;i++){rainPos[i*3]=(Math.random()-.5)*140;rainPos[i*3+1]=Math.random()*55;rainPos[i*3+2]=(Math.random()-.5)*140;rainVel[i]=.32+Math.random()*.55;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xb5c4db,size:.09,transparent:true,opacity:.46,depthWrite:false}));scene.add(rain);

// Stylized original vampire character assembled from meshes.
function makeCharacter(isEnemy=false){
 const group=new THREE.Group(),body=new THREE.Group();group.add(body);
 const cloth=isEnemy?enemyCloth:heroMat,coat=isEnemy?enemyMat:cloakMat,skin=isEnemy?mat('enemySkin',0x9a7169,.8):skinMat;
 // Boots, fitted trousers, coat silhouette and high collar.
 box(body,-.23,.22,0,.32,.4,.46,mat('boots',0x15151a,.6,.16));box(body,.23,.22,0,.32,.4,.46,mat('boots2',0x15151a,.6,.16));
 box(body,-.22,.72,0,.35,.78,.39,cloth);box(body,.22,.72,0,.35,.78,.39,cloth);
 const torso=box(body,0,1.38,0,.82,.96,.46,coat);torso.rotation.z=-.035;
 const cape=new THREE.Mesh(new THREE.ConeGeometry(.68,1.65,5,1,true),coat);cape.position.set(0,1.16,.22);cape.rotation.x=Math.PI;cape.scale.set(1,.75,.6);cape.castShadow=true;body.add(cape);
 box(body,0,1.89,-.08,.68,.2,.48,cloth);
 cylinder(body,0,2.09,0,.16,.19,.3,skin,8);
 sphere(body,0,2.38,0,.3,skin,10);
 // Black swept hair, angular shoulders, blood-red eyes.
 const hair=mat('hair'+(isEnemy?'e':'p'),isEnemy?0x171318:0x101117,.5);
 sphere(body,0,2.52,-.035,.31,hair,8);box(body,0,2.45,.21,.48,.12,.2,hair);
 sphere(body,-.12,2.37,.27,.035,bloodGlow,6);sphere(body,.12,2.37,.27,.035,bloodGlow,6);
 box(body,-.5,1.66,0,.27,.24,.49,cloth);box(body,.5,1.66,0,.27,.24,.49,cloth);
 const armL=box(body,-.56,1.25,0,.21,.75,.23,cloth),armR=box(body,.56,1.25,0,.21,.75,.23,cloth);armL.rotation.z=-.12;armR.rotation.z=.12;
 // Handgun model held forward.
 const gun=new THREE.Group();gun.position.set(.4,1.18,-.34);body.add(gun);box(gun,0,0,0,.14,.13,.48,mat('gunmetal',0x25262c,.35,.72));box(gun,0,-.12,.11,.11,.2,.15,mat('gunhandle',0x18181d,.6,.2));cylinder(gun,0,.01,-.29,.055,.055,.28,mat('barrel',0x17191e,.32,.8),8).rotation.x=Math.PI/2;
 group.userData={body,armL,armR,gun,cloak:cape};return group;
}
const player=makeCharacter(false);player.position.set(0,0,13);world.add(player);
let yaw=0,cameraPitch=.08,cameraTargetYaw=0;
const bloodZone=new THREE.Group();scene.add(bloodZone);
const zoneRing=new THREE.Mesh(new THREE.TorusGeometry(1,.12,6,128),new THREE.MeshBasicMaterial({color:0xbd2941,transparent:true,opacity:.78}));zoneRing.rotation.x=Math.PI/2;zoneRing.position.y=.22; bloodZone.add(zoneRing);
const zoneGlow=new THREE.Mesh(new THREE.TorusGeometry(1,.035,5,128),new THREE.MeshBasicMaterial({color:0xf25568,transparent:true,opacity:.85}));zoneGlow.rotation.x=Math.PI/2;zoneGlow.position.y=.32;bloodZone.add(zoneGlow);
const zoneCenter=new THREE.Vector3(0,0,-8);let zoneRadius=73,zoneStart=73,zoneShrinkAt=38,zoneEnd=22;
function setZoneRadius(r){zoneRadius=r;zoneRing.scale.setScalar(r);zoneGlow.scale.setScalar(r);}
bloodZone.position.copy(zoneCenter);setZoneRadius(zoneRadius);

const bots=[],loot=[],effects=[];
const spawnPositions=[[-28,0,-42],[30,0,-30],[-36,0,6],[38,0,23],[-22,0,48],[24,0,55],[49,0,-58],[4,0,-57]];
for(let i=0;i<8;i++){
 let model=makeCharacter(true);model.scale.setScalar(.9+Math.random()*.1);let p=spawnPositions[i];model.position.set(p[0],0,p[2]);world.add(model);
 bots.push({mesh:model,pos:model.position,hp:100,max:100,alive:true,think:Math.random()*2,fire:1+Math.random()*2,phase:Math.random()*6,id:i});
}
function addLoot(x,z,type){
 const g=new THREE.Group();g.position.set(x,.65,z);world.add(g);
 let core=sphere(g,0,0,0,.28,type==='blood'?bloodGlow:lootGlow,8);let ring=new THREE.Mesh(new THREE.TorusGeometry(.44,.035,5,20),new THREE.MeshBasicMaterial({color:type==='blood'?0xed3353:0xf2bd73,transparent:true,opacity:.9}));ring.rotation.x=Math.PI/2;g.add(ring);
 let beam=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2.2,6),new THREE.MeshBasicMaterial({color:type==='blood'?0xed3353:0xf2bd73,transparent:true,opacity:.19}));beam.position.y=.8;g.add(beam);
 loot.push({mesh:g,type,phase:Math.random()*6});
}
[[-9,7,'blood'],[12,-2,'ammo'],[-13,-31,'blood'],[17,35,'ammo'],[-36,-10,'ammo'],[4,48,'blood'],[40,0,'blood']].forEach(p=>addLoot(...p));

let state='lobby',selectedMode='solo',clanIndex=0,health=100,blood=64,armor=40,ammo=12,reserve=48,kills=0,elapsed=0,remainingBots=bots.length;
let moveX=0,moveY=0,keys={},mouseDown=false,fireClock=0,reloadTimer=0,abilityReady=0,playerFireTimer=0,matchDuration=0,gameSound=true,quality='high',damageFlash=0;
const clans=['THE BRUJAH','THE TOREADOR','THE NOSFERATU','THE VENTRUE'];
const $=s=>document.querySelector(s);
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2100);}
function updateHud(){
 $('#health-fill').style.width=health+'%';$('#blood-fill').style.width=blood+'%';$('#armor-fill').style.width=armor+'%';$('#health-value').textContent=Math.ceil(health);$('#blood-value').textContent=Math.ceil(blood);$('#armor-value').textContent=Math.ceil(armor);$('#ammo-value').textContent=ammo;$('#kills').textContent=kills;$('#players-left').textContent=remainingBots+1;
}
function startMatch(){
 state='playing';$('#lobby').classList.add('hidden');$('#result').classList.add('hidden');$('#hud').classList.remove('hidden');
 health=100;blood=64;armor=40;ammo=12;reserve=48;kills=0;elapsed=0;remainingBots=bots.length;zoneStart=73;zoneEnd=22;zoneRadius=zoneStart;setZoneRadius(zoneRadius);abilityReady=0;reloadTimer=0;player.position.set(0,0,13);yaw=0;cameraTargetYaw=0;bots.forEach((b,i)=>{b.alive=true;b.hp=100;b.fire=1.5+Math.random()*2;b.mesh.visible=true;b.pos.set(...[spawnPositions[i][0],0,spawnPositions[i][2]]);});
 $('#zone-warning').classList.add('hidden');updateHud();document.body.requestPointerLock?.();toast('THE HUNT IS ON. SURVIVE THE NIGHT.');
}
function endMatch(win){if(state!=='playing')return;state='result';document.exitPointerLock?.();$('#hud').classList.add('hidden');$('#result').classList.remove('hidden');$('#result-title').innerHTML=win?'THE NIGHT<br>IS <em>YOURS.</em>':'DAWN HAS<br><em>FOUND YOU.</em>';$('#result-copy').textContent=win?'The city remembers your name.':'The Masquerade claims another soul.';$('#result-kills').textContent=kills;$('#result-time').textContent=timeText(elapsed);$('#result-xp').textContent='+'+(240+kills*110);}
function timeText(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');}
function playTone(freq,duration=.08,type='sawtooth',gain=.04){if(!gameSound)return;try{const ctx=playTone.ctx||(playTone.ctx=new(window.AudioContext||window.webkitAudioContext)());const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);}catch{}}
function makeImpact(pos,color=0xe34a56){const geometry=new THREE.SphereGeometry(.18,8,8),material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85});const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(pos);world.add(mesh);effects.push({mesh,life:.27,max:.27,expand:true});}
function makeTracer(from,to,color=0xffd49a){const g=new THREE.BufferGeometry().setFromPoints([from,to]);const line=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));world.add(line);effects.push({mesh:line,life:.09,max:.09});}
function fireShot(){
 if(state!=='playing'||reloadTimer>0||fireClock>0)return;
 if(ammo<=0){reload();return;}ammo--;fireClock=.22;playTone(98,.075,'sawtooth',.055);playTone(420,.055,'triangle',.012);
 const dir=new THREE.Vector3();camera.getWorldDirection(dir);const origin=camera.position.clone().addScaledVector(dir,.6);let best=null,bestDist=74;
 for(const b of bots){if(!b.alive)continue;const target=b.pos.clone().add(v3(0,1.45,0));const to=target.clone().sub(origin);const along=to.dot(dir);if(along<0||along>bestDist)continue;const off=to.addScaledVector(dir,-along).length();if(off<1.12){best=b;bestDist=along;}}
 const end=origin.clone().addScaledVector(dir,best?bestDist:46);makeTracer(origin,end);makeImpact(end,0xffb16f);
 if(best){best.hp-=38;makeImpact(best.pos.clone().add(v3(0,1.2,0)),0xf45c62);playTone(220,.11,'triangle',.035);if(best.hp<=0){best.alive=false;best.mesh.visible=false;kills++;remainingBots--;addLoot(best.pos.x,best.pos.z,Math.random()<.5?'blood':'ammo');toast('KINDRED ELIMINATED  ·  +110 BLOOD ECHOES');if(remainingBots<=0)endMatch(true);}}
 updateHud();
}
function reload(){if(reloadTimer>0||ammo===12||reserve<=0)return;reloadTimer=1.45;toast('RELOADING VOWBREAKER');playTone(170,.08,'triangle',.02);}
function useAbility(){if(state!=='playing')return;if(elapsed<abilityReady){toast('SHOCKWAVE IS RECHARGING');return;}abilityReady=elapsed+10;$('#ability-cooldown').style.transform='translateY(0)';playTone(68,.42,'sawtooth',.08);const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.16,8,48),new THREE.MeshBasicMaterial({color:0xc9334c,transparent:true,opacity:.8}));ring.rotation.x=Math.PI/2;ring.position.set(player.position.x,.5,player.position.z);world.add(ring);effects.push({mesh:ring,life:.8,max:.8,expand:true,scaleTo:12});
 for(const b of bots)if(b.alive&&b.pos.distanceTo(player.position)<12){b.hp-=65;makeImpact(b.pos.clone().add(v3(0,1,0)),0xf95163);if(b.hp<=0){b.alive=false;b.mesh.visible=false;kills++;remainingBots--;addLoot(b.pos.x,b.pos.z,'blood');}}
 toast('BRUJAH SHOCKWAVE');updateHud();if(remainingBots<=0)endMatch(true);
}
function feed(){if(state!=='playing')return;if(blood<20){toast('NOT ENOUGH BLOOD TO FEED');return;}if(health>=95){toast('YOUR VITALS ARE ALREADY FULL');return;}blood-=20;health=Math.min(100,health+36);playTone(125,.27,'sine',.055);toast('THE BLOOD REMEMBERS');updateHud();}
function takeDamage(amount){if(armor>0){const absorbed=Math.min(armor,amount*.65);armor-=absorbed;amount-=absorbed;}health=Math.max(0,health-amount);damageFlash=Math.min(1,damageFlash+.7);updateHud();if(health<=0)endMatch(false);}

// Input: keyboard/mouse plus touch joystick, swipe-look and large thumb actions.
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyQ')useAbility();if(e.code==='KeyE')feed();if(e.code==='KeyR')reload();if(e.code==='Digit1')toast('VOWBREAKER EQUIPPED');});
window.addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('click',()=>{if(state==='playing'){canvas.requestPointerLock?.();fireShot();}});
window.addEventListener('mousedown',e=>{if(state==='playing'&&e.button===0){mouseDown=true;fireShot();}});window.addEventListener('mouseup',()=>mouseDown=false);
window.addEventListener('mousemove',e=>{if(state==='playing'&&document.pointerLockElement===canvas){const sens=Number($('#sensitivity').value)*.0008;yaw-=e.movementX*sens;cameraPitch=THREE.MathUtils.clamp(cameraPitch-e.movementY*sens,-.18,.44);}});
let joyActive=false,joyOrigin={x:0,y:0};const joy=$('#joystick'),stick=$('#stick');
function joyMove(e){const rect=joy.getBoundingClientRect(),t=e.touches?e.touches[0]:e;const cx=joyOrigin.x,cy=joyOrigin.y;let dx=t.clientX-cx,dy=t.clientY-cy;const len=Math.hypot(dx,dy),max=35;if(len>max){dx*=max/len;dy*=max/len;}moveX=dx/max;moveY=dy/max;stick.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
joy.addEventListener('pointerdown',e=>{joyActive=true;joy.setPointerCapture(e.pointerId);const r=joy.getBoundingClientRect();joyOrigin={x:r.left+r.width/2,y:r.top+r.height/2};joyMove(e);});joy.addEventListener('pointermove',e=>{if(joyActive)joyMove(e);});const joyEnd=()=>{joyActive=false;moveX=moveY=0;stick.style.transform='translate(-50%,-50%)';};joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
let lookTouch=null;document.addEventListener('touchstart',e=>{if(state!=='playing')return;for(const t of e.changedTouches){if(t.clientX>innerWidth*.45&&!t.target.closest('button'))lookTouch={id:t.identifier,x:t.clientX,y:t.clientY};}},{passive:true});document.addEventListener('touchmove',e=>{if(!lookTouch)return;for(const t of e.changedTouches)if(t.identifier===lookTouch.id){const dx=t.clientX-lookTouch.x,dy=t.clientY-lookTouch.y;yaw-=dx*.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*.003,-.18,.44);lookTouch.x=t.clientX;lookTouch.y=t.clientY;}},{passive:true});document.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(lookTouch&&t.identifier===lookTouch.id)lookTouch=null;},{passive:true});
$('#touch-fire').addEventListener('pointerdown',e=>{e.preventDefault();mouseDown=true;fireShot();});$('#touch-fire').addEventListener('pointerup',()=>mouseDown=false);$('#touch-jump').addEventListener('pointerdown',e=>{e.preventDefault();player.userData.jumpVel=.19;playTone(230,.07,'triangle',.02);});$('#touch-ability').addEventListener('pointerdown',e=>{e.preventDefault();useAbility();});$('#ability-button').addEventListener('click',useAbility);$('#feed-button').addEventListener('click',feed);

// Menu controls.
document.querySelectorAll('.mode-card').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.mode-card').forEach(b=>b.classList.remove('active'));button.classList.add('active');selectedMode=button.dataset.mode;document.querySelector('.mode-label span').textContent=selectedMode==='solo'?'01 / 03':selectedMode==='duo'?'02 / 03':'03 / 03';}));
$('#clan-next').addEventListener('click',()=>{clanIndex=(clanIndex+1)%clans.length;document.querySelector('.clan-row strong').innerHTML=clans[clanIndex]+' <span>↗</span>';toast(clans[clanIndex]+' BLOODLINE SELECTED');});
$('#play-button').addEventListener('click',startMatch);$('#leave-button').addEventListener('click',()=>{if(state==='playing'){state='lobby';$('#hud').classList.add('hidden');$('#lobby').classList.remove('hidden');document.exitPointerLock?.();}});$('#return-button').addEventListener('click',()=>{state='lobby';$('#result').classList.add('hidden');$('#lobby').classList.remove('hidden');});
$('#settings-open').addEventListener('click',()=>$('#settings').classList.remove('hidden'));$('#settings-close').addEventListener('click',()=>$('#settings').classList.add('hidden'));$('#settings').addEventListener('click',e=>{if(e.target.id==='settings')$('#settings').classList.add('hidden');});$('#sound-toggle').addEventListener('click',e=>{gameSound=!gameSound;e.currentTarget.textContent=gameSound?'♫':'♪';toast(gameSound?'AUDIO ENABLED':'AUDIO MUTED');});
$('#quality').addEventListener('change',e=>{quality=e.target.value;renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality==='high'?1.65:quality==='medium'?1.25:.9));moon.castShadow=quality!=='low';renderer.shadowMap.enabled=quality!=='low';});
$('#touch-toggle').addEventListener('change',e=>{$('#mobile-controls').style.display=e.target.checked?'block':'none';});

function nearObstacle(x,z){for(const b of blocks){if(Math.abs(x-b.x)<b.w/2+1.15&&Math.abs(z-b.z)<b.d/2+1.15)return true;}return false;}
function updatePlayer(dt,t){let mx=moveX+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),my=moveY+(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);let len=Math.hypot(mx,my);if(len>1){mx/=len;my/=len;}const speed=keys.ShiftLeft||keys.ShiftRight?10:6.4;
 let dx=(Math.sin(yaw)*(-my)+Math.cos(yaw)*mx)*speed*dt,dz=(-Math.cos(yaw)*(-my)+Math.sin(yaw)*mx)*speed*dt;
 if(!nearObstacle(player.position.x+dx,player.position.z))player.position.x+=dx;if(!nearObstacle(player.position.x,player.position.z+dz))player.position.z+=dz;
 player.position.x=THREE.MathUtils.clamp(player.position.x,-70,70);player.position.z=THREE.MathUtils.clamp(player.position.z,-85,85);
 const jumping=player.userData.jumpVel||0;if(keys.Space&&player.position.y<=.01)player.userData.jumpVel=.19;if(player.userData.jumpVel){player.position.y+=player.userData.jumpVel;player.userData.jumpVel-=.011;if(player.position.y<0){player.position.y=0;player.userData.jumpVel=0;}}
 const moving=Math.abs(mx)+Math.abs(my)>.08;player.rotation.y=yaw;player.userData.body.position.y=moving?Math.abs(Math.sin(t*11))*.045:0;player.userData.armL.rotation.x=moving?Math.sin(t*11)*.25:0;player.userData.armR.rotation.x=moving?-Math.sin(t*11)*.25:0;
 let targetCam=new THREE.Vector3(player.position.x+Math.sin(yaw)*8,player.position.y+4.15+cameraPitch*5,player.position.z+Math.cos(yaw)*8);camera.position.lerp(targetCam,1-Math.pow(.002,dt));const look=new THREE.Vector3(player.position.x,player.position.y+1.45+cameraPitch*2,player.position.z);camera.lookAt(look);
}
function updateBots(dt,t){for(const b of bots){if(!b.alive)continue;b.think-=dt;b.fire-=dt;let to=player.position.clone().sub(b.pos);let dist=to.length();if(b.think<=0){b.think=.45+Math.random()*.55;if(dist<55){let desired=Math.atan2(to.x,-to.z);b.mesh.rotation.y=desired;let speed=dist>12?2.45:dist<7?-1.35:0;let move=to.normalize().multiplyScalar(speed*dt);let nx=b.pos.x+move.x,nz=b.pos.z+move.z;if(!nearObstacle(nx,nz)){b.pos.x=nx;b.pos.z=nz;}else{b.mesh.rotation.y+=Math.PI/2;}}else{b.mesh.rotation.y+=Math.sin(t+b.phase)*.18;}}
 b.mesh.position.y=Math.abs(Math.sin(t*5+b.phase))*.04;
 if(dist<22&&b.fire<=0){b.fire=1.6+Math.random()*1.7;const start=b.pos.clone().add(v3(0,1.4,0)),end=player.position.clone().add(v3(0,1.15,0));makeTracer(start,end,0xb54454);makeImpact(end,0xd95157);if(Math.random()<.68)takeDamage(5+Math.random()*5);playTone(62,.05,'square',.012);}
 }}
function updateLoot(t,dt){for(const l of [...loot]){l.mesh.rotation.y+=dt*.7;l.mesh.position.y=.7+Math.sin(t*2+l.phase)*.12;const d=l.mesh.position.distanceTo(player.position);if(d<2.1){if(l.type==='blood'){blood=Math.min(100,blood+24);toast('BLOOD RESONANCE +24');}else{reserve=Math.min(96,reserve+18);toast('AMMUNITION +18');}world.remove(l.mesh);loot.splice(loot.indexOf(l),1);playTone(560,.12,'sine',.04);updateHud();}}}
function updateEffects(dt){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.expand){let ratio=1-e.life/e.max;if(e.scaleTo)e.mesh.scale.setScalar(1+ratio*(e.scaleTo-1));else e.mesh.scale.setScalar(1+ratio*10);if(e.mesh.material)e.mesh.material.opacity=Math.max(0,e.life/e.max*.8);}if(e.life<=0){world.remove(e.mesh);effects.splice(i,1);}}}
function updateMatch(dt,t){elapsed+=dt;fireClock=Math.max(0,fireClock-dt);if(mouseDown&&fireClock<=0)fireShot();if(reloadTimer>0){reloadTimer-=dt;if(reloadTimer<=0){let take=Math.min(12-ammo,reserve);ammo+=take;reserve-=take;updateHud();toast('VOWBREAKER READY');}}
 if(elapsed>zoneShrinkAt&&zoneRadius>zoneEnd){setZoneRadius(Math.max(zoneEnd,zoneStart-(zoneStart-zoneEnd)*Math.min(1,(elapsed-zoneShrinkAt)/55)));$('#zone-warning').classList.remove('hidden');}
 const outside=player.position.distanceTo(zoneCenter)>zoneRadius;if(outside&&elapsed>zoneShrinkAt){if(Math.floor(elapsed*2)%2===0)takeDamage(3*dt);}
 $('#zone-time').textContent=elapsed<zoneShrinkAt?timeText(zoneShrinkAt-elapsed):timeText(Math.max(0,zoneShrinkAt+55-elapsed));
 $('#ability-cooldown').style.transform=elapsed<abilityReady?`translateY(${Math.max(0,100-(abilityReady-elapsed)*10)}%)`:'translateY(100%)';
 for(const bot of bots)if(bot.alive&&elapsed>zoneShrinkAt&&bot.pos.distanceTo(zoneCenter)>zoneRadius){bot.hp-=dt*4;if(bot.hp<=0){bot.alive=false;bot.mesh.visible=false;remainingBots--;kills++;updateHud();}}
 if(ammo===0&&reserve>0&&reloadTimer<=0)reload();
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime;
 // Rain drifts past the follow camera instead of falling in a static box.
 const rp=rain.geometry.attributes.position.array;for(let i=0;i<rainN;i++){rp[i*3+1]-=rainVel[i];rp[i*3]-=.012;if(rp[i*3+1]<0){rp[i*3+1]=45+Math.random()*12;rp[i*3]=camera.position.x+(Math.random()-.5)*95;rp[i*3+2]=camera.position.z+(Math.random()-.5)*95;}}rain.geometry.attributes.position.needsUpdate=true;
 if(state==='playing'){updatePlayer(dt,t);updateBots(dt,t);updateLoot(t,dt);updateMatch(dt,t);}else{let target=new THREE.Vector3(0,6,33);camera.position.lerp(target,.005);camera.lookAt(0,9,-18);player.rotation.y=.08+Math.sin(t*.13)*.045;player.userData.body.position.y=Math.sin(t*.9)*.018;}
 updateEffects(dt);zoneRing.material.opacity=.58+Math.sin(t*2)*.16;zoneGlow.material.opacity=.65+Math.sin(t*3)*.2;player.userData.cloak.rotation.z=Math.sin(t*2.2)*.045;
 if(damageFlash>0)damageFlash=Math.max(0,damageFlash-dt*1.6);
 renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality==='high'?1.65:quality==='medium'?1.25:.9));});

// Optional canvas-edge blood flash communicates incoming damage without hiding play.
const flash=document.createElement('div');flash.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1;box-shadow:inset 0 0 0 0 rgba(168,20,42,0);transition:box-shadow .12s';document.querySelector('#game-root').appendChild(flash);
setInterval(()=>{if(damageFlash>0)flash.style.boxShadow=`inset 0 0 130px 12px rgba(168,20,42,${damageFlash*.48})`;else flash.style.boxShadow='inset 0 0 0 0 rgba(168,20,42,0)';},60);
updateHud();setTimeout(()=>{$('#loading').classList.add('done');setTimeout(()=>$('#loading').remove(),600);},500);
animate();
