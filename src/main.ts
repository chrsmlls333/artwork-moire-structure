import './style.css'
// import fbxFile from './Fancy Bus Stop MASTER.fbx?url'
import fbxFileGirders from './models/Rooftop-Girders.fbx?url'
import fbxFileMats from './models/Rooftop-Mats.fbx?url'
import daeFileMats from './models/Rooftop-Mats.dae?url'
import daeFileGirdersDeform from './models/Rooftop-Girders-Deformed.dae?url'
import daeFileACUnits from './models/Rooftop-ACUnits.dae?url'
import daeFileVerts from './models/Rooftop-Verts-deformed.dae?url'
import daeFileInnerShell from './models/Rooftop-InnerShell.dae?url'
import daeFileOuterShell from './models/Rooftop-OuterShell.dae?url'

import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';

import { CSG } from 'three-csg-ts';
import ProjectedMaterial, { ProjectedMaterialParameters } from 'three-projected-material';

import CreateThree from './utils/CreateThree';
import { animatePointerLockControls, createPointerLockControls } from './utils/MouseLockControls';
import { createProjectionMaterial } from './utils/ProjectedMaterialUtils';
import { loadCollada, loadFBX } from './utils/ModelLoaders';
import { ColorRepresentation, LineSegments, Vector3 } from 'three'


// =============================================================================================

const app = new CreateThree({
  srgb: true,
  background: 0x0000FF,
  cameraPosition: new Vector3(69, 1.5, -10.5),
  cameraTarget: new Vector3(0,1.5,-10.5),
  fov: 55,
  showFPS: true,
  gui: true,
});
(window as any).app = app;

const controls: PointerLockControls = createPointerLockControls(app.scene, app.camera, app.renderer.domElement);
app.onUpdate(animatePointerLockControls)

// =============================================================================================



// app.scene.add(new THREE.AxesHelper(5))
// app.scene.add(new THREE.GridHelper(200,50))
const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
app.scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 3.0, 7.0, 0.5)
pointLight.position.set(5,5,5)
pointLight.visible = false;
app.scene.add(pointLight)
// const lightHelper = new THREE.PointLightHelper(pointLight)
// app.scene.add(lightHelper)

app.onAnimate(() => {
  // let pos = app.camera.position.clone();
  // pos.y += 0;
  pointLight.position.copy(app.camera.position)
})

const ambientLightFolder = app.gui?.addFolder({ title: 'Point Light' })
ambientLightFolder?.addInput(ambientLight, 'visible');
ambientLightFolder?.addInput(ambientLight, 'intensity');
const pointLightFolder = app.gui?.addFolder({ title: 'Point Light' })
pointLightFolder?.addInput(pointLight, 'visible');
pointLightFolder?.addInput(pointLight, 'intensity');
pointLightFolder?.addInput(pointLight, 'distance');
pointLightFolder?.addInput(pointLight, 'decay');
// lightingFolder?.addInput(pointLight, );

 

// const projector = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
// projector.lookAt(0,0,0)

// const projectorHelper = new THREE.CameraHelper(projector);
// app.scene.add(projector, projectorHelper)

// if (app.gui) {
//   const projFolder = app.gui.addFolder({ title: 'Projector' });
//   projFolder.addInput(projector.position, 'x', { min: -30, max: 30 });
//   projFolder.addInput(projector.position, 'y', { min: -30, max: 30 });
//   projFolder.addInput(projector.position, 'z', { min: -30, max: 30 });
//   projFolder.addInput(projector, 'fov',        { min: 30, max: 130 })
//     .on('change', (ev) => { if (ev.last) projector.updateProjectionMatrix() })
// }

//

// const texture = new THREE.TextureLoader().load('./images/20211115-225926_hi.jpg');
const texture = new THREE.TextureLoader().load('./images/20211115-224628_hi.jpg');
  // (tex) => {
  //   scene.traverse(function (c) {
  //     if ((c as THREE.Mesh).isMesh) {
  //       const child = (c as THREE.Mesh);
  //       (child as THREE.Mesh).material = projMaterial;
  //       if ((child as THREE.Mesh).material && !Array.isArray((child as THREE.Mesh).material)) {
  //         const thisMaterial = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
  //         if (thisMaterial.name == "projMaterial") projMaterial.project(child);
  //       }
  //     }
  //   })
  // }




// const paintedMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>[] = [];

// //

// // Make 2 meshes..
// const size = 40;
// const outer = new THREE.Mesh(
//   new THREE.BoxGeometry(size, size, size),
//   createProjectionMaterial(app.camera, texture, 0x0000FF)
// );
// const inner = new THREE.Mesh(new THREE.BoxGeometry(size*0.95, size*0.95, size*0.95));
// const innerCurved = new RoundedBoxGeometry(size*0.95, size*0.95, size*0.95, Math.round(size), size/5)
// console.log(innerCurved);


// // Make sure the .matrix of each mesh is current
// outer.updateMatrix();
// inner.updateMatrix();

// // Perform CSG operations
// // The result is a THREE.Mesh that you can add to your scene...
// const subRes = CSG.subtract(outer, inner);
// subRes.name = 'Sky Box';
// app.scene.add(subRes);
// (subRes.material as ProjectedMaterial).project(subRes)
// paintedMeshes.push(subRes);
//


// const lineMaterial = new THREE.LineBasicMaterial({ 
//   color: 0x0000FF, linewidth: 1,
//   linecap: 'round', linejoin: 'round' 
// });

const modelFolder = app.gui?.addFolder({ title: 'Models'});

const modelGroup = new THREE.Group();
const addedLineSegments: LineSegments[] = [];

modelGroup.name = 'Rooftop Sketchup';
app.scene.add(modelGroup);
Promise.all([
  // fbxFileGirders,
  // fbxFileMats
].map(p => loadFBX(p)))
  .then(objects => objects.map(object => {
    object.traverse(function (c) {
      if ((c as THREE.Mesh).isMesh) {
        const child = (c as THREE.Mesh);
        child.material = createProjectionMaterial(app.camera, texture, 0x0000FF, 0.2);
        app.onUpdate(c3 => {
          if (projectingModel && Math.random() < 0.005) (child.material as ProjectedMaterial).project(child);
        });
        // (child.material as ProjectedMaterial).project(child)
        // if ((child as THREE.Mesh).material) {
        //   const thisMaterial = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        //   thisMaterial.transparent = false;
        //   thisMaterial.side = THREE.DoubleSide;
        // }
        // const edges = new THREE.EdgesGeometry(child.geometry)
        // const line = new THREE.LineSegments( edges, lineMaterial )
        // child.add( line );
      }
    });
    return object;
  }))
  .then(objects => { 
    modelGroup.add(...objects);
    new THREE.Box3().setFromObject( modelGroup ).getCenter( modelGroup.position ).multiply(new THREE.Vector3(-1, 0, -1));
  })
  // .then(() => {
  //   let meshesWithMaterial: THREE.Mesh[] = [];
  //   app.scene.traverse(node => {
  //     if (node instanceof THREE.Mesh) {
  //       if (Array.isArray(node.material)) {
  //         for (let i = 0; i < node.material.length; i++) {
  //           if (node.material[i].isProjectedMaterial) {
  //             meshesWithMaterial.push(node);
  //             break;
  //           }
  //         }
  //       } else if (node.material.isProjectedMaterial) {
  //         meshesWithMaterial.push(node);
  //       }
  //     }
  //   })
  //   console.log('meshes with projection', meshesWithMaterial);
    

  //   // let box = new THREE.Box3().setFromObject( modelGroup ).getCenter( modelGroup.position ).multiplyScalar( -1 );
  //   // console.log(box);
  // });

const config: {
  name: string,
  url: string,
  visible: boolean,
  replaceWProjMat: boolean,
  projMatSetting?: ProjectedMaterialParameters,
  bgColor: ColorRepresentation,
  bgOpacity: number,
  refreshChance: number,
  addLines: boolean,
  lineColor: ColorRepresentation
}[] = [
  { name: 'Outer Shell', url:    daeFileOuterShell, visible: true, replaceWProjMat:false, bgColor: 0x0000FF, bgOpacity: 1.00, refreshChance: 1.00, addLines: false, lineColor: 0x0000FF },
  { name: 'Inner Shell', url:    daeFileInnerShell, visible: true, replaceWProjMat: true, bgColor: 0x0000FF, bgOpacity: 1.00, refreshChance: 1.00, addLines: false, lineColor: 0x0000FF },
  { name: 'Ground Mats', url:          daeFileMats, visible: true, replaceWProjMat: true, bgColor: 0x0000FF, bgOpacity: 0.00, refreshChance: 0.02, addLines: true , lineColor: 0xFFFFFF },
  { name: 'Girders',     url: daeFileGirdersDeform, visible: true, replaceWProjMat: true, bgColor: 0x0000FF, bgOpacity: 0.00, refreshChance: 0.02, addLines: true , lineColor: 0x0000FF, projMatSetting: { depthWrite: true } },
  { name: 'AC Units',    url:       daeFileACUnits, visible:false, replaceWProjMat: true, bgColor: 0x0000FF, bgOpacity: 0.00, refreshChance: 0.02, addLines: false, lineColor: 0x0000FF },
  { name: 'Verticals',   url:         daeFileVerts, visible: true, replaceWProjMat: true, bgColor: 0x0000FF, bgOpacity: 0.00, refreshChance: 0.04, addLines: true , lineColor: 0x0000FF },

]

Promise.all(config.map(({url}) => loadCollada(url)))
  .then( (models) => models.map(({scene}, i) => {
    let preset = config[i];

    scene.name = preset.name;
    scene.visible = preset.visible;
    modelFolder?.addInput(scene, 'visible', { label: preset.name })

    scene.traverse(function (c) {
      
      if (c instanceof THREE.Mesh) {
        const child = c;
        
        if (preset.replaceWProjMat != false) {
          let projmat = createProjectionMaterial(app.camera, texture, preset.bgColor, preset.bgOpacity, preset.projMatSetting || {});
          child.material = projmat;
          app.onUpdate(c3 => {
            if (projectingModel && Math.random() < config[i].refreshChance) 
              (child.material as ProjectedMaterial).project(child);
          });
        }
        if (preset.addLines) {
          const edges = new THREE.EdgesGeometry(child.geometry, 25)
          const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial({ 
            color: preset.lineColor, linewidth: 1,
            // linecap: 'round', linejoin: 'round' 
          }))
          child.add( line );
          addedLineSegments.push ( line );
        }
        

        // (child.material as ProjectedMaterial).project(child)
        // if ((child as THREE.Mesh).material) {
        //   const thisMaterial = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        //   thisMaterial.transparent = false;
        //   thisMaterial.side = THREE.DoubleSide;
        // }
      }
    });

    return scene;
  }))
  .then(objects => { 
    modelGroup.add(...objects);
  })
  // .then(() => {
  //   app.scene.traverse(child => {
  //     if (child instanceof THREE.Line || 
  //         child instanceof THREE.LineSegments ||
  //         child instanceof THREE.LineLoop ) {
  //           child.geometry.dispose();
  //           child.removeFromParent();
        
  //       // delete child.parent?.child;
  //     }
  //     if (child instanceof THREE.BufferGeometry)
  //   });
  // })




//=============================================================================================

let projectingModel = true
let hardMode = false;
  
document.addEventListener( 'keydown', ( event: KeyboardEvent ) => {
  switch ( event.code ) {
    // case 'Space':
    case 'KeyV':
      // projectingBox = !projectingBox
      // paintedMeshes.forEach( mesh => {
      //   projMaterial.project(mesh)
      // })
      break;
    // case 'Space':
    case 'KeyC':
      projectingModel = !projectingModel;
      break;
  }
});

document.addEventListener( 'click', (ev) => {
  if (controls.isLocked) {
    switch (ev.button) {
      case 0:
        // projectingBox = !projectingBox;
        projectingModel = !projectingModel;
        break;
        
      case 2:
        hardMode = !hardMode;
        addedLineSegments.forEach(lineSegment => {
          lineSegment.visible = !hardMode;
        })
        pointLight.visible = !hardMode;

      default:
        break;
    }
    
  }
})




app.onUpdate(c3 => {
  // if (projectingModel) {
  //   paintedMeshes.forEach( mesh => {
  //     if (mesh.name != "Sky Box" && Math.random() < 0.03) 
  //       (mesh.material as ProjectedMaterial).project(mesh);
  //   })
  // }
  // if (projectingBox) {
  //   paintedMeshes.forEach( mesh => {
  //     if (mesh.name == "Sky Box") 
  //       (mesh.material as ProjectedMaterial).project(mesh);
  //   })
  // }
  // if (projecting || frameCount % (120*0.75) == 0) {
  //   paintedMeshes.forEach( mesh => {
  //     projMaterial.project(mesh)
  //   })
  // }
  

  // const model = scene.getObjectByName('Model');
  // if (model) {
  //   model.position.x = Math.sin(clock.getElapsedTime()*2) * 1;
  //   model.position.z = Math.cos(clock.getElapsedTime()*2) * 1;
  // }
  // fbxMeshes.forEach( mesh => {
  //   mesh.position.x = Math.sin(clock.getElapsedTime()*2) * 1;
  //   mesh.position.z = Math.cos(clock.getElapsedTime()*2) * 1;
  // })
})



app.start();