import * as pc from 'playcanvas';

export class PlayCanvasApp {
  _app;

  _camera;

  constructor({ canvasDomElement }) {

    this._app = new pc.Application(canvasDomElement, {
      mouse: new pc.Mouse(canvasDomElement),
      touch: new pc.TouchDevice(canvasDomElement),
      keyboard: new pc.Keyboard(window),
      graphicsDeviceOptions: { alpha: true, premultipliedAlpha: false },
    });

    this._app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this._app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // use device pixel ratio
    this._app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;

    this._app.start();

    // create camera
    this._camera = new pc.Entity();
    this._camera.addComponent("camera", {
        clearColor: new pc.Color(1, 1, 1, 1),
        nearClip: 0.1,
        farClip: 10000
    });
    this._camera.setPosition(0, 1, 2);

    this._app.root.addChild(this._camera);

    this.initScene();

    this.configureAr();
  }

  initScene() {
    const light = new pc.Entity();
    light.addComponent('light', {
      type: 'omni',
      range: 30,
      color: new pc.Color(1, 1, 1),
    });
    light.translate(0, 3, 2);
    this._app.root.addChild(light);

    const box = new pc.Entity('cube');
    box.addComponent('model', {
      type: 'box',
    });
    box.setLocalPosition(0.75, 1, -4);
    box.setLocalScale(2, 2, 2);
    this._app.root.addChild(box);

    this.loadMesh('chrysler.glb', 'c.glb', 'c').then((entity) => {
      entity.setLocalPosition(-1, 0, -2);
      entity.setLocalScale(3, 3, 3);

      this._app.root.addChild(entity);
    });
  }

  async loadMesh(url, filename, name) {
    return new Promise((resolve, reject) => {
      const asset = new pc.Asset(name, 'container', { url, filename });

      asset.on('load', () => {
        console.log(`loaded asset: ${filename}`);
        const loadedEntity = asset.resource.instantiateRenderEntity();
        resolve(loadedEntity);
      });

      asset.on('error', (err) => {
        console.log(`loading asset failed: ${filename} - ${err}`);
        reject(err);
      });

      this._app.assets.add(asset);
      this._app.assets.load(asset);
    });
  }

  configureAr() {
    if (this._app.xr.supported) {
      const activate = () => {
        if (this._app.xr.isAvailable(pc.XRTYPE_AR)) {
          this._camera.camera.startXr(pc.XRTYPE_AR, pc.XRSPACE_LOCALFLOOR, {
            callback: (err) => {
              if (err)
                console.error(`Error starting AR ${err.message}`);
            },
          });
        }
        else {
          console.warn(`Immersive AR not available`);
        }
      };

      this._app.mouse.on("mousedown", () => {
        if (!this._app.xr.active)
        activate();
      });

      if (this._app.touch) {
        this._app.touch.on("touchend", (evt) => {
          if (!this._app.xr.active) {
            // if not in AR, activate
            activate();
          }
          else {
            // otherwise reset camera
            this._camera.camera.endXr();
          }

          evt.event.preventDefault();
          evt.event.stopPropagation();
        });
      }

      // end session by keyboard ESC
      this._app.keyboard.on("keydown", (evt) => {
        if (evt.key === pc.KEY_ESCAPE && this._app.xr.active) {
          this._app.xr.end();
        }
      });
    }
  }
}
