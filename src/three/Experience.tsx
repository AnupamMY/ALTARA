import {Component,Suspense,lazy,useCallback,useEffect,useState,type ReactNode} from 'react';
import {Canvas} from '@react-three/fiber';
import {AdaptiveDpr} from '@react-three/drei';
import {ACESFilmicToneMapping} from 'three';
import WindowViewScene from './WindowViewScene';
import type {Scene} from '../data/project';
const PropertyScenes=lazy(()=>import('./PropertyScenes'));
function StaticFallback({onProgress}:{onProgress:(n:number)=>void}){useEffect(()=>{onProgress(100);},[onProgress]);return <div className="canvas-fallback">Interactive 3D is unavailable on this device. Your selected panorama is shown as a static preview.</div>;}
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?this.props.fallback:this.props.children;}}
export default function Experience({scene,onSceneReady,onProgress,onError}:{scene:Scene;onSceneReady:(scene:Scene)=>void;onProgress:(n:number)=>void;onError:(s:string)=>void}) {
  const [visible,setVisible]=useState(!document.hidden);
  const [webgl]=useState(()=>{
    try {
      const gl=document.createElement('canvas').getContext('webgl2');
      if(!gl)return false;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch {return false;}
  });
  useEffect(()=>{
    const change=()=>setVisible(!document.hidden);
    document.addEventListener('visibilitychange',change);
    return()=>document.removeEventListener('visibilitychange',change);
  },[]);
  const panoramaProgress=useCallback((n:number)=>{onProgress(n);if(n===100)onSceneReady(scene);},[onProgress,onSceneReady,scene]);
  const fallback=<StaticFallback onProgress={panoramaProgress}/>;
  if(!webgl)return fallback;
  return <SceneBoundary fallback={fallback}>
    <Canvas camera={{position:[0,0,.01],fov:72,near:.001,far:250}}
      dpr={[1,window.innerWidth<768?1.25:1.75]} shadows={window.innerWidth>=768}
      frameloop={visible?'always':'never'} gl={{antialias:true,toneMapping:ACESFilmicToneMapping}}>
      <Suspense fallback={null}>
        {scene==='Window View'?<WindowViewScene onProgress={panoramaProgress} onError={onError}/>:<PropertyScenes scene={scene} onReady={onSceneReady}/>}
      </Suspense>
      <AdaptiveDpr pixelated/>
    </Canvas>
  </SceneBoundary>;
}
