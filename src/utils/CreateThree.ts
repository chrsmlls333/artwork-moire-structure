/**
 *  Inspiration from https://github.com/marcofugaro/threejs-modern-app/blob/master/src/lib/WebGLApp.js
 */


import { Clock, ColorRepresentation, DefaultLoadingManager, OrthographicCamera, PerspectiveCamera, Scene, sRGBEncoding, Vector3, WebGLRenderer } from 'three';

import { getGPUTier } from 'detect-gpu';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Pane, TpChangeEvent } from 'tweakpane';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'

// @ts-ignore
import dataURIToBlob from 'datauritoblob'


// =============================================================================================

type UpdateListener = {
  (deltaTime: number, elapsedTime: number, xrframe?: XRFrame): void;
}

interface CreateThreeOptions {
  canvas?: HTMLCanvasElement,
  width?: number,
  height?: number,
  antialias?: boolean;
  srgb?: boolean;
  background?: ColorRepresentation;
  backgroundAlpha?: number;
  sortObjects?: boolean;
  fov?: number;
  frustumSize?: number;
  near?: number;
  far?: number;
  cameraPosition?: Vector3;
  cameraTarget?: Vector3;
  maxPixelRatio?: number;
  maxDeltaTime?: number;
  postprocessing?: boolean;
  orbitControls?: Object;
  showFPS?: boolean;
  gui?: boolean;
  guiClosed?: boolean;
  [rendererOptions: string | number | symbol]: unknown;
}

// =============================================================================================



export default class CreateThree {
  clock: Clock;
  scene: Scene;
  camera: PerspectiveCamera | OrthographicCamera;
  renderer: WebGLRenderer;
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  gpu: {} | undefined;
  
  #width?: number;
  #height?: number;
  maxPixelRatio: number = 2;
  maxDeltaTime: number = (1/30);
  frustumSize: number = 3;
  
  gui?: Pane;
  stats?: Stats;
  composer?: EffectComposer;
  orbitControls?: OrbitControls;
  
  // touchHandler: any;

  
  constructor({
    // renderer settings
    canvas: _canvas,
    antialias = true,
    background = '#111',
    backgroundAlpha = 1,
    // camera settings
    fov = 45,
    frustumSize = 3,
    near = 0.01,
    far = 100,
    ...options
  }: CreateThreeOptions = {}) {

    // Allow targeting of Canvas element
    let canvas = _canvas || document.querySelector('canvas#bg') || 
    document.body.appendChild(document.createElement('canvas'));
    canvas.setAttribute('id', 'bg');

    // Renderer
    this.renderer = new WebGLRenderer({ 
      canvas,
      antialias: !options.postprocessing ?? antialias,
      alpha: backgroundAlpha < 1,
      // enabled for saving screenshots of the canvas,
      // may wish to disable this for perf reasons
      preserveDrawingBuffer: true,
      failIfMajorPerformanceCaveat: true,
      ...options
    });

    if (options.srgb) {
      this.renderer.outputEncoding = sRGBEncoding;
      this.renderer.physicallyCorrectLights = true;
    }

    if (options.sortObjects !== undefined) {
      this.renderer.sortObjects = options.sortObjects;
    }
    if (options.xr) this.renderer.xr.enabled = true;  
    this.renderer.setClearColor(background, backgroundAlpha);
    this.canvas = this.renderer.domElement;
    this.gl = this.renderer.getContext();

    // save the fixed dimensions
    this.#width = options.width
    this.#height = options.height

    // clamp pixel ratio for performance
    this.maxPixelRatio = options.maxPixelRatio || 2
    // clamp delta to stepping anything too far forward
    this.maxDeltaTime = options.maxDeltaTime || (1 / 30)

    // Camera Settings
    const aspect = 1; //this.#width / this.#height
    if (!options.orthographic) {
      this.camera = new PerspectiveCamera(fov, aspect, near, far)
    } else {
      this.camera = new OrthographicCamera(
        -(frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        near,
        far
      );
      this.frustumSize = frustumSize;
    }

    this.camera.position.copy(options.cameraPosition || new Vector3(0, 0, 4))
    this.camera.lookAt(options.cameraTarget || new Vector3(0,0,0))
    
    this.scene = new Scene();
    
    this.clock = new Clock();
    
    // handle resize events
    window.addEventListener('resize', () => {this.resize()})
    window.addEventListener('orientationchange', () => {this.resize()})

    // force an initial resize event
    this.resize();

    
    // ======================== ADDONS ======================== 


    // expose a composer for postprocessing passes
    if (options.postprocessing) { 
      // const maxMultisampling = this.gl.getParameter(this.gl.MAX_SAMPLES)
      // const renderTarget: WebGLRenderTarget = { }
      this.composer = new EffectComposer(this.renderer)
      this.composer.addPass(new RenderPass(this.scene, this.camera))
    }
    
    // set up a simple orbit controller
    if (options.orbitControls) {
      this.orbitControls = new OrbitControls(this.camera, this.canvas)

      this.orbitControls.enableDamping = true
      this.orbitControls.dampingFactor = 0.15
      this.orbitControls.enablePan = false

      if (options.orbitControls instanceof Object) {
        Object.keys(options.orbitControls).forEach((key: string) => {
          let k = key as keyof OrbitControls;
          if (options.orbitControls) {
            (this.orbitControls as any)[k] = options.orbitControls[k as keyof Object]
          }
        })
      }

      this.orbitControls.target.set(0,0,0);

      this.onUpdate(() => {
        this.orbitControls?.update();
      })
    }

    // Attach Tween.js
    // if (options.tween) this.tween = options.tween

    // Attach the Cannon physics engine
    // if (options.world) {
    //   this.world = options.world
    //   if (options.showWorldWireframes) {
    //     this.cannonDebugger = new CannonDebugger(this.scene, this.world.bodies)
    //   }
    // }

    // show the fps meter
    if (options.showFPS) {
      // TODO use external pkg statsjs
      // this.stats = new Stats({ showMinMax: false, context: this.gl })
      this.stats = Stats();
      this.stats.showPanel(0)
      document.body.appendChild(this.stats.dom)
    }

    //
    if (options.gui) {
      this.gui = new Pane({ title: 'Parameters' });
      if (options.guiClosed) this.gui.expanded = false;

      const cf = this.gui.addFolder({
        title: 'POV Camera',
        expanded: true,
      });
      cf.addInput(this.camera.position, 'x');
      cf.addInput(this.camera.position, 'y');
      cf.addInput(this.camera.position, 'z');
      const updateCamera = (ev: TpChangeEvent<any>) => { if (ev.last) this.camera.updateProjectionMatrix() };
      if (this.camera instanceof PerspectiveCamera) {
        cf.addInput(this.camera, 'fov', { min: 30, max: 120 }).on('change', updateCamera);
      } else {
        cf.addInput(this, 'frustumSize', { min: 1, max: 100 }).on('change', updateCamera);
      }
      cf.addInput(this.camera, 'near', { min: 0.001, max: 1 }).on('change', updateCamera);
      cf.addInput(this.camera, 'far' , { min: 1, max: 1000  }).on('change', updateCamera);
      this.onAnimate(() => {
        this.gui?.refresh();
      })
    }


    // detect the gpu info
    getGPUTier({ glContext: this.gl })
      .then(tierResult => {
        this.gpu = {
          name: tierResult.gpu,
          tier: tierResult.tier,
          isMobile: tierResult.isMobile,
          fps: tierResult.fps,
        }
      });
    

    //
    setVerboseLoading();
  }

  get width() {  return this.#width  || window.innerWidth  }
  get height() { return this.#height || window.innerHeight }

  get pixelRatio() {
    return Math.min(this.maxPixelRatio, window.devicePixelRatio)
  }
  
  resize = ({
    width = this.width,
    height = this.height,
    pixelRatio = this.pixelRatio
  } = {}) => {

    // update pixel ratio if necessary
    if (this.renderer.getPixelRatio() !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio)
    }

    // setup new size & update camera aspect if necessary
    this.renderer.setSize(width, height)
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height
    } else {
      const aspect = width / height
      this.camera.left =  -(this.frustumSize * aspect) / 2
      this.camera.right =  (this.frustumSize * aspect) / 2
      this.camera.top =     this.frustumSize / 2
      this.camera.bottom = -this.frustumSize / 2
    }
    this.camera.updateProjectionMatrix()

    // resize also the composer
    if (this.composer) {
      this.composer.setSize(pixelRatio * width, pixelRatio * height)
    }

    // recursively tell all child objects to resize
    // this.scene.traverse(obj => {
    //   if (typeof obj.resize === 'function') {
    //     obj.resize({
    //       width,
    //       height,
    //       pixelRatio,
    //     })
    //   }
    // })

    // draw a frame to ensure the new size has been registered visually
    this.draw()
    return this
  }

  // convenience function to trigger a PNG download of the canvas
  saveScreenshot = async ({
    width = this.width,
    height = this.height,
    fileName = 'Screenshot',
  } = {}) => {
    // force a specific output size
    this.resize({ width, height, pixelRatio: 1 })

    const blob: Blob | null = await new Promise((resolve) => this.canvas.toBlob(resolve, 'image/png'))
    if (blob == null) { console.error('Canvas blob is null?'); return; }

    // reset to default size
    this.resize()

    // save
    downloadFile(`${fileName}.png`, blob);
  }


  #updateListeners: UpdateListener[] = [];
  update = (dt: number, time: number, xrframe?: XRFrame) => {
    
    // recursively tell all child objects to update
    this.scene.traverse(obj => {
      if (
        (obj as any).update && 
        typeof (obj as any).update === 'function' && 
        !(obj as any).isTransformControls
      ) {
        (obj as any).update(dt, time, xrframe)
      }
    })

    // if (this.world) {
    //   // update the cannon-es physics engine
    //   this.world.step(1 / 60, dt)

    //   // update the debug wireframe renderer
    //   if (this.cannonDebugger) {
    //     this.cannonDebugger.update()
    //   }

    //   // recursively tell all child bodies to update
    //   this.world.bodies.forEach((body) => {
    //     if (typeof body.update === 'function') {
    //       body.update(dt, time)
    //     }
    //   })
    // }

    // if (this.tween) {
    //   // update the Tween.js engine
    //   this.tween.update()
    // }

    // call the update listeners
    this.#updateListeners.forEach(fn => fn(dt, time, xrframe))

    return this
  }

  onUpdate(fn: UpdateListener) {
    this.#updateListeners.push(fn.bind(this));
    return fn;
  }
  onLoop = this.onUpdate;
  onAnimate = this.onUpdate;
  offUpdate(fn: UpdateListener) {
    const index = this.#updateListeners.indexOf(fn)
    if (index === -1) return;
    this.#updateListeners.splice(index, 1);
  }
  getUpdateListenersSize = () => this.#updateListeners.length; 

  draw = (dt?: number) => {
    // postprocessing doesn't currently work in WebXR
    const isXR = this.renderer.xr.enabled && this.renderer.xr.isPresenting
    if (this.composer && !isXR) {
      // make sure to always render the last pass
      this.composer.passes.forEach((pass, i, passes) => {
        const isLastElement = i === passes.length - 1

        if (isLastElement) pass.renderToScreen = true
        else pass.renderToScreen = false
      })

      this.composer.render(dt);
    } else {
      this.renderer.render(this.scene, this.camera)
    }
    return this;
  }

  isRunning = false;
  frameCount = 0;
  start = () => {
    if (this.isRunning) return;
    this.isRunning = true;
    this.draw();
    this.renderer.setAnimationLoop(this.#animate);
    return this
  }
  stop = () => {
    if (!this.isRunning) return;
    this.renderer.setAnimationLoop(null);
    this.isRunning = false
    return this
  }
  #animate = (_now?: DOMHighResTimeStamp, xrframe?: XRFrame) => {
    if (!this.isRunning) return;
    this.stats?.begin()
    this.frameCount++

    // this.dt = Math.min(this.maxDeltaTime, (now - this.#lastTime) / 1000)
    // this.time += this.dt
    // this.#lastTime = now
    let dt = this.clock.getDelta();
    let et = this.clock.getElapsedTime();

    this.update(dt, et, xrframe);
    this.draw(dt);

    this.stats?.end()
  }

  // =============================================================

  get cursor() { return this.canvas.style.cursor }

  set cursor(cursor: string) {
    if (cursor) {
      this.canvas.style.cursor = cursor
    } else {
      this.canvas.style.cursor = ''
    }
  }

  // =============================================================

  /**
   * Call a function name on all descendents of this.scene
   * @param fn a function name
   * @param args 
   */
  traverseFunctions = (fn: string, ...args: any[]) => {
    this.scene.traverse(child => {
      if (typeof (child as any)[fn] === 'function') {
        (child as any)[fn].apply(child, args)
      }
    })
  }
  traverseObjects = (callback: (object: THREE.Object3D<THREE.Event>) => any) => {
    return this.scene.traverse(callback); 
  }


}


/**
 * 
 * @param on 
 */
function setVerboseLoading(on = true) {
  // Default Loading Manager logging
  if (on) {
    DefaultLoadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
      console.log(`Started loading file: ${url}\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
    };
    DefaultLoadingManager.onLoad = function ( ) {
      console.log( 'Loading Complete!');
    };
    DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
      console.log(`Loading file: ${url}\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
    };
  } else {
    const nullFunc = () => {};
    DefaultLoadingManager.onStart = nullFunc;
    DefaultLoadingManager.onLoad = nullFunc;
    DefaultLoadingManager.onProgress = nullFunc;
  }
  // Common, always report
  DefaultLoadingManager.onError = function ( url ) {
    console.error( 'There was an error loading ' + url );
  };
}

function downloadFile(filename: string, blob: Blob | MediaSource) {
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
    link.removeAttribute('href')
  }, 0)
}
