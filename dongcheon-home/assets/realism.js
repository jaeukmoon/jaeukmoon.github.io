import * as THREE from 'three';
import { GLTFLoader } from './three-addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from './three-addons/environments/RoomEnvironment.js';
import { EffectComposer } from './three-addons/postprocessing/EffectComposer.js';
import { RenderPass } from './three-addons/postprocessing/RenderPass.js';
import { SSAOPass } from './three-addons/postprocessing/SSAOPass.js';
import { OutputPass } from './three-addons/postprocessing/OutputPass.js';

// Public, generic rendering utilities. No private apartment geometry is stored here.
export async function loadRealism(renderer) {
  const loader=new THREE.TextureLoader();
  const texture=async(path,repeat,color=false)=>{
    const map=await loader.loadAsync(new URL(path,import.meta.url).href);
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(...repeat);
    map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    if(color)map.colorSpace=THREE.SRGBColorSpace;
    return map;
  };
  const surface=async(name,repeat)=>{
    const [map,normalMap,roughnessMap]=await Promise.all(['color','normal','roughness'].map((kind,i)=>texture(`./materials/${name}/${kind}.jpg`,repeat,i===0)));
    return {map,normalMap,roughnessMap};
  };
  const [wood,fabric,sofa]=await Promise.all([
    surface('wood_floor',[1,1]),surface('fabric_pattern_07',[3,3]),
    new GLTFLoader().loadAsync(new URL('./models/sofa/Sofa_01.gltf',import.meta.url).href)
  ]);
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
  const environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
  return {wood,fabric,sofa:sofa.scene,environment};
}
export function makeSofa(template,size,color) {
  const root=new THREE.Group(),model=template.clone(true);
  const bounds=new THREE.Box3().setFromObject(model),extent=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  model.position.set(-center.x,-bounds.min.y,-center.z);root.add(model);
  root.scale.set(size.w/extent.x,size.h/extent.y,size.d/extent.z);
  const materials=[];
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.castShadow=mesh.receiveShadow=true;
    mesh.material=mesh.material.clone();mesh.material.color.set(color);
    mesh.material.envMapIntensity=.45;materials.push(mesh.material);
  });
  root.userData.tintMaterials=materials;
  return root;
}
export function createRendering(renderer,scene,camera) {
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const ambientOcclusion=new SSAOPass(scene,camera,1,1,16);
  ambientOcclusion.kernelRadius=.28;
  ambientOcclusion.minDistance=.001;
  ambientOcclusion.maxDistance=.065;
  composer.addPass(ambientOcclusion);composer.addPass(new OutputPass());
  return composer;
}
