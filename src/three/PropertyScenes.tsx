import { useState } from 'react';
import { ContactShadows, Html, useGLTF, Environment } from '@react-three/drei';
import { amenities, project, type Scene } from '../data/project';
import { getRooms } from '../data/rooms';
import { useExperienceStore } from '../store/useExperienceStore';
import PropertyCamera from './PropertyCamera';

function Box({position,scale,color}:{position:[number,number,number];scale:[number,number,number];color:string}) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={scale}/><meshStandardMaterial color={color} roughness={.65}/></mesh>;
}
function Marker({position,label,onClick,active=false}:{position:number[];label:string;onClick:()=>void;active?:boolean}) {
  return <Html position={[position[0],position[1]+1.5,position[2]]} center distanceFactor={32}>
    <button className={`scene-pin ${active?'active':''}`} onClick={onClick}>{label}</button>
  </Html>;
}
function Apartment() {
  const {apartment,set}=useExperienceStore();
  const [hover,setHover]=useState('');
  return <group>{getRooms(apartment).map((room,index)=><group key={room.name}>
    <mesh position={[room.x,.12,room.z]} onPointerOver={()=>setHover(room.name)} onPointerOut={()=>setHover('')}
      onClick={()=>set({selected:index+1})}>
      <boxGeometry args={[room.w,.22,room.d]}/><meshStandardMaterial color={hover===room.name?'#c9b58c':'#e2d8c7'}/>
    </mesh>
    <Box position={[room.x,.5,room.z-room.d/2]} scale={[room.w,1,.13]} color="#faf2e3"/>
    <Box position={[room.x-room.w/2,.5,room.z]} scale={[.13,1,room.d]} color="#faf2e3"/>
    <Html position={[room.x,.4,room.z]} center><span className="room-label">{room.name}</span></Html>
    {room.name.startsWith('Bedroom')&&<><Box position={[room.x,.4,room.z]} scale={[2,.5,2.8]} color="#7c8e82"/><Box position={[room.x,.7,room.z-.9]} scale={[1.8,.2,.65]} color="#fbf4e5"/></>}
    {room.name==='Living & dining'&&<Box position={[room.x-1,.6,room.z]} scale={[1.1,1,3]} color="#9caa9b"/>}
  </group>)}</group>;
}

export default function PropertyScenes({scene,onReady}:{scene:Exclude<Scene,'Window View'>;onReady:(scene:Scene)=>void}) {
  // Suspend the complete scene until its model is available; the transition stays covered.
  const building=useGLTF(project.model,true);
  const {selected,set}=useExperienceStore();
  return <>
    <color attach="background" args={['#ced8d3']}/><fog attach="fog" args={['#ced8d3',55,120]}/>
    <ambientLight intensity={1.2}/><directionalLight position={[15,25,15]} intensity={3} castShadow shadow-mapSize={[1024,1024]}/>
    <Environment resolution={64} frames={1}><mesh scale={50}><sphereGeometry/><meshBasicMaterial color="#e2eee9" side={1}/></mesh></Environment>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#9dac9c"/></mesh>
    {scene==='Apartment'?<Apartment/>:<group>
      <primitive object={building.scene}/>
      <Box position={[-8,.06,5]} scale={[7,.14,10]} color="#7dadaf"/>
      <Box position={[-8,.16,5]} scale={[5,.2,8]} color="#4c929b"/>
      {Array.from({length:12},(_,i)=><group key={i} position={[i%2===0?-13:13,0,-12+Math.floor(i/2)*5]}>
        <mesh position={[0,1,0]}><cylinderGeometry args={[.14,.22,2,8]}/><meshStandardMaterial color="#766650"/></mesh>
        <mesh position={[0,2.6,0]}><icosahedronGeometry args={[1.4,1]}/><meshStandardMaterial color="#526e50"/></mesh>
      </group>)}
      {scene==='Home'&&<Marker position={[0,12,0]} label="Discover the residences" onClick={()=>set({scene:'Apartment',selected:0,zoom:0})}/>}
      {scene==='Amenities'&&amenities.map((amenity,i)=><Marker key={amenity.label} position={amenity.position} label={amenity.label} active={selected===i} onClick={()=>set({selected:i})}/>)}
    </group>}
    <ContactShadows position={[0,.01,0]} opacity={.35} scale={65} blur={2} far={30} frames={1} key={scene}/>
    <PropertyCamera scene={scene} onReady={onReady}/>
  </>;
}
