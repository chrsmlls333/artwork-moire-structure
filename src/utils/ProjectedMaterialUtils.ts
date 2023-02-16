
import * as THREE from 'three';
import ProjectedMaterial, { ProjectedMaterialParameters } from 'three-projected-material';

export function createProjectionMaterial(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, 
  texture: THREE.Texture, 
  backgroundColor: THREE.ColorRepresentation = 0xFFFFFF,
  backgroundOpacity: number = 1.0,
  matOptions: ProjectedMaterialParameters = {}
) {
  const material = new ProjectedMaterial({
    camera,
    texture,
    color: backgroundColor,
    transparent: (backgroundOpacity < 1.0),
    side: THREE.FrontSide,
    cover: true,
    ...matOptions
  });
  material.uniforms.backgroundOpacity.value = backgroundOpacity;
  // material.name = "ProjectionMaterial";
  return material;
}