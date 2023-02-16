
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Collada, ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';

function progressReport(xhr: ProgressEvent<EventTarget>) { console.debug(Math.round(xhr.loaded / xhr.total) * 100 + '% loaded.'); };

export function loadFBX( path: string ): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    new FBXLoader().load( path, resolve, progressReport, reject );
  })
}

export function loadCollada( path: string ): Promise<Collada> {
  return new Promise((resolve, reject) => {
    new ColladaLoader().load( path, resolve, progressReport, reject )
  })
}