import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

let clock = new THREE.Clock();

let controls: PointerLockControls;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();



function createPointerLockControls(scene: THREE.Scene, camera: THREE.Camera, domElement: HTMLElement): PointerLockControls {
  controls = new PointerLockControls(camera, domElement);
  scene.add( controls.getObject() );


  //Interaction Lsteners

  controls.domElement.addEventListener( 'click', function () {
    controls.lock();
  });

  const onKeyDown = function ( event: KeyboardEvent ) {
    switch ( event.code ) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;
    }
  };

  const onKeyUp = function ( event: KeyboardEvent ) {
    switch ( event.code ) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;
    }
  };

  document.addEventListener( 'keydown', onKeyDown );
  document.addEventListener( 'keyup', onKeyUp );

  return controls;
}

function animatePointerLockControls() {
  if ( controls.isLocked === true ) {

    const delta = clock.getDelta() / 1;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y = 0;

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) velocity.z -= direction.z * 50.0 * delta;
    if ( moveLeft || moveRight )       velocity.x -= direction.x * 50.0 * delta;

    controls.moveRight( - velocity.x * delta );
    controls.moveForward( - velocity.z * delta );

  }
}

export { createPointerLockControls, animatePointerLockControls }