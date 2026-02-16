import 
{
	AnimationGroup, 
	SceneLoader, 
	Scene, 
	Mesh
} 
from   "@babylonjs/core";
import '@babylonjs/loaders/glTF';




function createObjects(
    scene: Scene,
    onDiscPartLoaded?: (mesh: Mesh) => void,
    onP1PartLoaded?: (mesh: Mesh) => void,
    onP2PartLoaded?: (mesh: Mesh) => void
): Promise<AnimationGroup | undefined> {
    return new Promise((resolve) => {
        SceneLoader.ImportMesh(
            null,
            "assets/glb/",
            "trans.glb",
            scene,
            async function (meshes, particleSystems, skeletons, animationGroups) {
                const myAnimationGroup = animationGroups[0];
                myAnimationGroup.loopAnimation = false;
                myAnimationGroup.stop();

                for (let mesh of meshes) {
                    if (mesh.name.includes("disc_")) { if (mesh instanceof Mesh) { if (onDiscPartLoaded) onDiscPartLoaded(mesh); } }
                    else if (mesh.name.includes("p1")) { if (mesh instanceof Mesh) { if (onP1PartLoaded) onP1PartLoaded(mesh); } }
                    else if (mesh.name.includes("p2")) { if (mesh instanceof Mesh) { if (onP2PartLoaded) onP2PartLoaded(mesh); } }
                }

                resolve(myAnimationGroup);
            }
        );
    });
}




export {createObjects};
