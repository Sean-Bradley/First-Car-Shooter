"use strict";
// MIT License
// Original file https://github.com/schteppe/cannon.js/blob/908aa1e954b54d05a43dd708584e882dfe30ae29/tools/threejs/CannonDebugRenderer.js CopyRight https://github.com/schteppe
// Differences Copyright 2020-2021 Sean Bradley : https://sbcode.net/threejs/
// - Added import statements for THREE
// - Converted to a class with a default export,
// - Converted to TypeScript
// - Updated to support THREE.BufferGeometry (r125)
// - added support for CANNON.Cylinder
// - Updated to use cannon-es
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = __importStar(require("three"));
const CANNON = __importStar(require("cannon-es"));
class CannonDebugRenderer {
    constructor(scene, world, options) {
        this._particleMaterial = new THREE.PointsMaterial();
        this.tmpVec0 = new CANNON.Vec3();
        this.tmpVec1 = new CANNON.Vec3();
        this.tmpVec2 = new CANNON.Vec3();
        this.tmpQuat0 = new CANNON.Quaternion();
        options = options || {};
        this.scene = scene;
        this.world = world;
        this._meshes = [];
        this._material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        });
        this._particleMaterial = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 10,
            sizeAttenuation: false,
            depthTest: false,
        });
        this._sphereGeometry = new THREE.SphereGeometry(1);
        this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
        this._planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
        this._particleGeometry = new THREE.BufferGeometry();
        this._particleGeometry.setFromPoints([new THREE.Vector3(0, 0, 0)]);
    }
    update() {
        const bodies = this.world.bodies;
        const meshes = this._meshes;
        const shapeWorldPosition = this.tmpVec0;
        const shapeWorldQuaternion = this.tmpQuat0;
        let meshIndex = 0;
        for (let i = 0; i !== bodies.length; i++) {
            const body = bodies[i];
            for (let j = 0; j !== body.shapes.length; j++) {
                const shape = body.shapes[j];
                this._updateMesh(meshIndex, body, shape);
                const mesh = meshes[meshIndex];
                if (mesh) {
                    // Get world position
                    body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
                    body.position.vadd(shapeWorldPosition, shapeWorldPosition);
                    // Get world quaternion
                    body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);
                    // Copy to meshes
                    mesh.position.x = shapeWorldPosition.x;
                    mesh.position.y = shapeWorldPosition.y;
                    mesh.position.z = shapeWorldPosition.z;
                    mesh.quaternion.x = shapeWorldQuaternion.x;
                    mesh.quaternion.y = shapeWorldQuaternion.y;
                    mesh.quaternion.z = shapeWorldQuaternion.z;
                    mesh.quaternion.w = shapeWorldQuaternion.w;
                }
                meshIndex++;
            }
        }
        for (let i = meshIndex; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (mesh) {
                this.scene.remove(mesh);
            }
        }
        meshes.length = meshIndex;
    }
    _updateMesh(index, body, shape) {
        let mesh = this._meshes[index];
        if (!this._typeMatch(mesh, shape)) {
            if (mesh) {
                //console.log(shape.type)
                this.scene.remove(mesh);
            }
            mesh = this._meshes[index] = this._createMesh(shape);
        }
        this._scaleMesh(mesh, shape);
    }
    _typeMatch(mesh, shape) {
        if (!mesh) {
            return false;
        }
        const geo = mesh.geometry;
        return ((geo instanceof THREE.SphereGeometry &&
            shape instanceof CANNON.Sphere) ||
            (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
            (geo instanceof THREE.CylinderGeometry &&
                shape instanceof CANNON.Cylinder) ||
            (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
            shape instanceof CANNON.ConvexPolyhedron ||
            (geo.id === shape.id && shape instanceof CANNON.Trimesh) ||
            (geo.id === shape.id && shape instanceof CANNON.Heightfield));
    }
    _createMesh(shape) {
        let mesh;
        let geometry;
        let v0;
        let v1;
        let v2;
        const material = this._material;
        let points = [];
        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                mesh = new THREE.Mesh(this._sphereGeometry, material);
                break;
            case CANNON.Shape.types.BOX:
                mesh = new THREE.Mesh(this._boxGeometry, material);
                break;
            case CANNON.Shape.types.CYLINDER:
                geometry = new THREE.CylinderGeometry(shape.radiusTop, shape.radiusBottom, shape.height, shape.numSegments);
                mesh = new THREE.Mesh(geometry, material);
                break;
            case CANNON.Shape.types.PLANE:
                mesh = new THREE.Mesh(this._planeGeometry, material);
                break;
            case CANNON.Shape.types.PARTICLE:
                mesh = new THREE.Points(this._particleGeometry, this._particleMaterial);
                break;
            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                // Create mesh
                geometry = new THREE.BufferGeometry();
                shape.id = geometry.id;
                points = [];
                for (let i = 0; i < shape.vertices.length; i += 1) {
                    const v = shape.vertices[i];
                    points.push(new THREE.Vector3(v.x, v.y, v.z));
                }
                geometry.setFromPoints(points);
                const indices = [];
                for (let i = 0; i < shape.faces.length; i++) {
                    const face = shape.faces[i];
                    const a = face[0];
                    for (let j = 1; j < face.length - 1; j++) {
                        const b = face[j];
                        const c = face[j + 1];
                        indices.push(a, b, c);
                    }
                }
                geometry.setIndex(indices);
                mesh = new THREE.Mesh(geometry, material);
                break;
            case CANNON.Shape.types.TRIMESH:
                geometry = new THREE.BufferGeometry();
                shape.id = geometry.id;
                points = [];
                for (let i = 0; i < shape.vertices.length; i += 3) {
                    points.push(new THREE.Vector3(shape.vertices[i], shape.vertices[i + 1], shape.vertices[i + 2]));
                }
                geometry.setFromPoints(points);
                mesh = new THREE.Mesh(geometry, material);
                break;
            case CANNON.Shape.types.HEIGHTFIELD:
                geometry = new THREE.BufferGeometry();
                v0 = this.tmpVec0;
                v1 = this.tmpVec1;
                v2 = this.tmpVec2;
                for (let xi = 0; xi < shape.data.length - 1; xi++) {
                    for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
                        for (let k = 0; k < 2; k++) {
                            ;
                            shape.getConvexTrianglePillar(xi, yi, k === 0);
                            v0.copy(shape.pillarConvex
                                .vertices[0]);
                            v1.copy(shape.pillarConvex
                                .vertices[1]);
                            v2.copy(shape.pillarConvex
                                .vertices[2]);
                            v0.vadd(shape.pillarOffset, v0);
                            v1.vadd(shape.pillarOffset, v1);
                            v2.vadd(shape.pillarOffset, v2);
                            points.push(new THREE.Vector3(v0.x, v0.y, v0.z), new THREE.Vector3(v1.x, v1.y, v1.z), new THREE.Vector3(v2.x, v2.y, v2.z));
                            //const i = geometry.vertices.length - 3
                            //geometry.faces.push(new THREE.Face3(i, i + 1, i + 2))
                        }
                    }
                }
                geometry.setFromPoints(points);
                //geometry.computeBoundingSphere()
                //geometry.computeFaceNormals()
                mesh = new THREE.Mesh(geometry, material);
                shape.id = geometry.id;
                break;
            default:
                mesh = new THREE.Mesh();
                break;
        }
        if (mesh && mesh.geometry) {
            this.scene.add(mesh);
        }
        return mesh;
    }
    _scaleMesh(mesh, shape) {
        let radius;
        let halfExtents;
        let scale;
        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                radius = shape.radius;
                mesh.scale.set(radius, radius, radius);
                break;
            case CANNON.Shape.types.BOX:
                halfExtents = shape.halfExtents;
                mesh.scale.copy(new THREE.Vector3(halfExtents.x, halfExtents.y, halfExtents.z));
                mesh.scale.multiplyScalar(2);
                break;
            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                mesh.scale.set(1, 1, 1);
                break;
            case CANNON.Shape.types.TRIMESH:
                scale = shape.scale;
                mesh.scale.copy(new THREE.Vector3(scale.x, scale.y, scale.z));
                break;
            case CANNON.Shape.types.HEIGHTFIELD:
                mesh.scale.set(1, 1, 1);
                break;
        }
    }
}
exports.default = CannonDebugRenderer;
