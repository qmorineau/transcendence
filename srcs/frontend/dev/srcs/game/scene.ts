import {
	HemisphericLight, 
	ArcRotateCamera,
    AnimationGroup,
	Viewport,
	Vector3, 
	Color4,
	Engine,
	Scene,
    Mesh,
} from "@babylonjs/core";

import { createObjects } from "./objects.js"
import { post_json_api } from "../tools/api-calls.js"
import { get_api       } from "../tools/api-calls.js"




//////////////////
// create scene //
//////////////////

function createScene(
    engine: Engine,
    canvas: HTMLCanvasElement,
    online: boolean,
    disc: Mesh[],
    p1: Mesh[],
    p2: Mesh[],
    spectator: boolean,
    side: string
): { scene: Scene, animPromise: Promise<AnimationGroup | undefined> } // <-- return type
{
    const scene = new Scene(engine);


    ////////////////
	// background //
    ////////////////
	
    scene.clearColor = new Color4(0, 0, 0, 1);


    /////////
	// cam //
    /////////

    if (spectator) {
        var cam: ArcRotateCamera;
        cam = new ArcRotateCamera("camSpectator", (Math.PI/3), Math.PI / 2.5, 22, new Vector3(0, -2, 0), scene);
        cam.attachControl(canvas, true);
        scene.activeCameras?.push(cam);

    } else {
        var camP1: ArcRotateCamera;
        if (online) { camP1 = new ArcRotateCamera("camP1", (Math.PI / 2), Math.PI / 2.5, 22, new Vector3(0, -2, 0), scene); }
        else { camP1 = new ArcRotateCamera("camP1", (Math.PI / 2), Math.PI / 2.5, 22, new Vector3(0, -2, 0), scene); }
        camP1.fov = 0.6;
        if (online) {
            const int_side = (side === 'left') ? 1 : -1;
            camP1.alpha = (Math.PI / 2) * int_side;
        }
        scene.activeCameras?.push(camP1);

        if (!online) {
            const camP2 = new ArcRotateCamera("camP2", -(Math.PI / 2), Math.PI / 2.5, 22, new Vector3(0, -2, 0), scene);
            camP2.fov = 0.6;
            scene.activeCameras?.push(camP2);

            //    						  x    y    w    h
            camP1.viewport = new Viewport(0.0, 0.5, 1.0, 0.5); // top    half
            camP2.viewport = new Viewport(0.0, 0.0, 1.0, 0.5); // bottom half
        }
    }

    ///////////
	// light //
    ///////////

	const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);


    ////////////////////
    // Create objects //
    ////////////////////

    const animPromise = createObjects(
        scene,
        (disc_part) => { disc.push(disc_part); },
        (p1_part) => { p1.push(p1_part); },
        (p2_part) => { p2.push(p2_part); }
    ).then((anim) => {
        if (anim) {
            canvas.classList.remove('hidden');

            // check if game already started
            get_api('/api/game/info').then((data) => {
                if (data.ok) {
                    if (data.json_data.isRunning)   { anim.start(false, 1.0, 359, 360); }
                    else                            { anim.start(false, 1.0, 0,   360); }
                    anim.onAnimationEndObservable.addOnce(() => {
                        if (!data.json_data.isRunning) {
                            post_json_api({}, '/api/game/resume');
                        }
                    });
                }
            });
            return anim;
        }
        return undefined; // should not append
    });

    return { scene, animPromise };
};


export {createScene}