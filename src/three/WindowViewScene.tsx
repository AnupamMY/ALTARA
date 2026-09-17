import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FrontSide, LinearFilter, LoadingManager, PerspectiveCamera, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector4 } from 'three';
import gsap from 'gsap';
import { panoramaPath } from '../data/project';
import { useExperienceStore } from '../store/useExperienceStore';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const vertexShader = `varying vec2 panoramaUv;
void main(){panoramaUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragmentShader = `uniform sampler2D view0,view1,view2,view3;
uniform vec4 weights; varying vec2 panoramaUv;
void main(){
 gl_FragColor=texture2D(view0,panoramaUv)*weights.x
 +texture2D(view1,panoramaUv)*weights.y
 +texture2D(view2,panoramaUv)*weights.z
 +texture2D(view3,panoramaUv)*weights.w;
 #include <colorspace_fragment>
}`;

export default function WindowViewScene({onProgress,onError}:{onProgress:(n:number)=>void;onError:(message:string)=>void}) {
  const {floor,time,zoom,reset} = useExperienceStore();
  const {camera,gl,invalidate} = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const runtime = useRef<{load:(index:number)=>Promise<Texture>;disposed:boolean}|null>(null);
  const request = useRef(0);
  const uniforms = useMemo(()=>({view0:{value:null as Texture|null},view1:{value:null as Texture|null},view2:{value:null as Texture|null},view3:{value:null as Texture|null},weights:{value:new Vector4(1,0,0,0)}}),[]);
  const initialized = useRef(false);
  const material = useMemo(()=>new ShaderMaterial({uniforms,vertexShader,fragmentShader,side:FrontSide,depthWrite:false,toneMapped:false}),[uniforms]);
  useEffect(()=>()=>material.dispose(),[material]);

  useEffect(()=>{
    let disposed=false;
    const cache=new Map<number,Promise<Texture>>();
    const textures=new Set<Texture>();
    const mobile=window.innerWidth<768;
    const manager=new LoadingManager();
    const loader=new TextureLoader(manager);
    const state={disposed:false,load(index:number):Promise<Texture>{
      const existing=cache.get(index);if(existing)return existing;
      const task=loader.loadAsync(panoramaPath(index<2?9:14,index%2===0?'day':'night',mobile)).then(texture=>{
        if(disposed){texture.dispose();throw new Error('Scene disposed');}
        texture.colorSpace=SRGBColorSpace;texture.minFilter=LinearFilter;texture.generateMipmaps=false;
        textures.add(texture);
        // Upload once, before animation, rather than stalling the first blend frame.
        gl.initTexture(texture);
        return texture;
      }).catch(error=>{cache.delete(index);throw error;});
      cache.set(index,task);return task;
    }};
    runtime.current=state;initialized.current=false;
    return()=>{disposed=true;state.disposed=true;gsap.killTweensOf(uniforms.weights.value);textures.forEach(t=>t.dispose());};
  },[gl,uniforms]);

  useEffect(()=>{
    const id=++request.current;
    const state=runtime.current!;
    const index=(floor===9?0:2)+(time==='night'?1:0);
    onProgress(0);
    state.load(index).then(texture=>{
      if(state.disposed||id!==request.current)return;
      const samplers=[uniforms.view0,uniforms.view1,uniforms.view2,uniforms.view3];
      if(!initialized.current){
        samplers.forEach(s=>{s.value=texture;});
        uniforms.weights.value.set(index===0?1:0,index===1?1:0,index===2?1:0,index===3?1:0);
        initialized.current=true;
      }
      samplers[index].value=texture;
      // Retarget from the actual blended frame. Weights always add to one,
      // including when the user interrupts a transition with another choice.
      gsap.to(uniforms.weights.value,{x:index===0?1:0,y:index===1?1:0,z:index===2?1:0,w:index===3?1:0,
        duration:reduced()?0:1.8,ease:'sine.inOut',overwrite:true,onUpdate:invalidate});
      onProgress(100);invalidate();
    }).catch(()=>{
      if(state.disposed||id!==request.current)return;
      onError('This view could not load. Your previous view is preserved. Please try again.');onProgress(100);
    });
    return()=>{request.current++;};
  },[floor,time,reset,uniforms,invalidate,onProgress,onError]);

  useEffect(()=>{
    const tween=gsap.to(camera,{fov:Math.max(38,Math.min(90,72-zoom*8)),duration:reduced()?0:.65,ease:'sine.inOut',onUpdate:()=>{(camera as PerspectiveCamera).updateProjectionMatrix();invalidate();}});
    return()=>{tween.kill();};
  },[zoom,camera,invalidate]);
  useEffect(()=>{
    camera.position.set(0,0,.01);controls.current?.target.set(0,0,0);controls.current?.update();invalidate();
  },[reset,camera,invalidate]);

  return <>
    <mesh rotation={[0,-Math.PI/2,0]}>
      <sphereGeometry args={[100,64,32]} onUpdate={g=>{if(!g.userData.inward){g.scale(-1,1,1);g.userData.inward=true;}}}/>
      <primitive object={material} attach="material"/>
    </mesh>
    <OrbitControls ref={controls} target={[0,0,0]} enablePan={false} enableZoom={false} rotateSpeed={-.35} minPolarAngle={.25} maxPolarAngle={Math.PI-.25} enableDamping dampingFactor={.065}/>
  </>;
}
