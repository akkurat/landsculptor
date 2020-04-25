
import * as THREE from 'three';
import { BufferGeometry, Vector3, Vector2, VertexColors, DoubleSide } from 'three'

import { Color, PaperScope } from 'paper'

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const filename = require('../textures/grasslight-big.jpg')
import { createRange, sleep } from './helpers';

import '../index.less'
import { Meshable, circle } from './Meshable';
import { Tri } from './Tri';
import { PaperZoom } from './PaperZoom';

// Thanks @prisoner849 for the combination of three + delaunator
// https://discourse.threejs.org/t/three-js-delaunator/4952
// https://codepen.io/prisoner849/pen/bQWOjY

export async function run() {
  const th = new ThreeWrap(document.querySelector('#three'))
  const paperCanvas = document.getElementById('paper').appendChild(document.createElement('canvas'));
  const pa = new PaperWrap(paperCanvas)

  const meshable = new Meshable<Vector3>({ maxLength: 30 })

  setupGeometry(meshable)

  meshable.init()



  let i: number;
  for (i = 0; i < 20; i++) {

    // meshable.refineStep()

    if (meshable.state === 'finished') {
      break;

    }

  }

  console.log("iterations", i)



  const geom = new THREE.Geometry().setFromPoints(meshable._allPoints)
  var cloud = new THREE.Points(
    new THREE.Geometry().setFromPoints(meshable._allPoints),
    new THREE.PointsMaterial({ color: 0x99ccff, size: 5,side:DoubleSide })
  );
  th.add(cloud);


  // geom = new THREE.Geometry();
  // geom.vertices.push( new THREE.Vector3( -50, -50, 0 ) );
  // geom.vertices.push( new THREE.Vector3(  50, -50, 0 ) );
  // geom.vertices.push( new THREE.Vector3(  50,  50, 0 ) );
  // geom.vertices.push( new THREE.Vector3(  -50,  50, 0 ) );

  //@ts-ignore
  const material = new THREE.MeshBasicMaterial({side:DoubleSide, vertexColors: THREE.FaceColors});




  const lastColor = new Color('blue')

  let lastColorTh = new THREE.Color('blue')

  console.log(...geom.vertices)
  for (let t of meshable._mesh) {

    const face = new THREE.Face3(t[0], t[1], t[2],undefined, lastColorTh )

    geom.faces.push(face);

    const tri = Tri.ofArray_(t, meshable._allPoints)
    const path = pa.drawTriangle(tri);
    path.strokeColor = new Color('black')
    path.fillColor = new Color(lastColor)
    lastColor.hue = lastColor.hue + 100;
    lastColorTh = new THREE.Color(lastColor.toCSS(true))
    pa.draw();

    // await sleep(5000)
    

  }

    geom.computeFaceNormals();
    geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, material);


  th.scene.add(mesh);

  th.attachMovecontrols(mesh);

  const mesh2 = simplemesh()

  // th.scene.add(mesh2)




  var gui = new GUI();
  gui.add(mesh.material, "wireframe");
  gui.add(mesh2.material, "wireframe");

}

function simplemesh() {
  var material = new THREE.MeshStandardMaterial( { color : 0x00cc00, side: DoubleSide } );

//create a triangular geometry
var geometry = new THREE.Geometry();
geometry.vertices.push( new THREE.Vector3( -50, -50, 0 ) );
geometry.vertices.push( new THREE.Vector3(  50, -50, 0 ) );
geometry.vertices.push( new THREE.Vector3(  50,  50, 0 ) );
geometry.vertices.push( new THREE.Vector3(  -50,  50, 0 ) );

//create a new face using vertices 0, 1, 2
var normal = new THREE.Vector3( 0, 0, 1 ); //optional
var color = new THREE.Color( 0xffaa00 ); //optional
var materialIndex = 0; //optional
var face1 = new THREE.Face3( 0, 1, 2, normal, color, materialIndex );
var face2 = new THREE.Face3( 1,3,0, normal, color, materialIndex );

//add the face to the geometry's faces array
geometry.faces.push( face1 );
geometry.faces.push( face2 );

//the face normals and vertex normals can be calculated automatically if not supplied above
geometry.computeFaceNormals();
geometry.computeVertexNormals();

return new THREE.Mesh( geometry, material ) ;
}

function setupGeometry(meshable) {
  const curryPoint = (z) => ({ x, y }) => new Vector3(x, y, z)
  const curryPoint2 = (z) => ([x, y]) => new Vector3(x, y, z)

  // meshable.addPoints( circle(50, 100, 50, curryPoint(-10) ).map( v => v.applyAxisAngle( xAxis, Math.PI/30)), true) 
  // meshable.addPoints( circle(150, 100, 20, curryPoint(50)), true )
  // meshable.addPoints(circle(20, 20, 33, curryPoint(43)), true)

  // // points3d.push( ...line(new Vector3(),new Vector3(-20,30,20), 20 ) )
  // // points3d.push( ...line(new Vector3(),new Vector3(20,30,-40), 20 ) )
  // meshable.addPoints( line(new Vector3(100,130,40),new Vector3(100, 30,0), 20 ) )
  // meshable.addPoints( line(new Vector3(100,-100,40),new Vector3(100, 30,0), 20 ) )
  // meshable.addPoints( line(new Vector3(-50,0,0),new Vector3(0,200,0), 20 ) )

  meshable.addPoints_([[-100, -100], [300, -100], [300, 300], [-100, 300]], true, curryPoint2(0))
  // new Vector3().apply

  meshable.interpolator = interpolator

}




function createGrass() {
  var loader = new THREE.TextureLoader()
  // loader.setTranscoderPath( 'js/libs/basis/' );
  // 			loader.detectSupport( renderer );

  var groundTexture = loader.load(filename)
  groundTexture.encoding = THREE.sRGBEncoding;
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(2, 2)
  return groundTexture


}

function assignUVs(geometry) {
  geometry.faceVertexUvs[0] = [];
  geometry.faces.forEach(function (face) {
    // var components = ['x', 'y', 'z'].sort(function(a, b) {
    //     return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
    // });

    var v1: Vector3 = geometry.vertices[face.a];
    var v2: Vector3 = geometry.vertices[face.b];
    var v3: Vector3 = geometry.vertices[face.c];
    const v = [v1, v2, v3]
    const maxX = Math.max(...v.map(v => v.x))
    const maxZ = Math.max(...v.map(v => v.z))
    const minX = Math.min(...v.map(v => v.x))
    const minZ = Math.min(...v.map(v => v.z))

    const sX = 1 / (maxX - minX)
    const sZ = 1 / (maxZ - minZ)



    geometry.faceVertexUvs[0].push([
      new THREE.Vector2((v1.x - minX) * sX, (v1.z - minZ) * sZ),
      new THREE.Vector2((v2.x - minX) * sX, (v2.z - minZ) * sZ),
      new THREE.Vector2((v3.x - minX) * sX, (v3.z - minZ) * sZ)
    ]);

  });
  geometry.uvsNeedUpdate = true;
}


export function interpolator({ x, y }, evPoints, others) {

  const np = new Vector2(x, y)
  const ls = evPoints.map(v3 => ([
    np.distanceTo(new Vector2(v3.x, v3.y)),
    v3.z || 0
  ]))
  console.log(ls)
  const l_tot = ls.map(v => v[0]).reduce((p, c) => p + c)

  let val_result = 0;

  for (const [distance, value] of ls) {
    const weight = l_tot - distance
    val_result = weight * value

  }

  const z = val_result / (ls.length - 1)

  return new Vector3(x, y, z)




}

export class ThreeWrap {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  constructor(targetElement: HTMLElement) {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(400, 1, 2, 5000)
    this.camera.position.set(0,-1300,500)
    this.camera.rotation.setFromVector3(new Vector3(1.2, 0,0), 'XYZ')
    this.renderer = new THREE.WebGLRenderer({
      antialias: false
    });
    this.canvas = this.renderer.domElement;
    targetElement.appendChild(this.canvas);
    // Create an empty project and a view for the canvas:

    // var light = new THREE.DirectionalLight(0xffffff, 1.5);
    // light.position.set(0, 0, 500);
    // this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xFFFFFF, 50));

  }

  attachMovecontrols(mesh: THREE.Mesh) {
    var controls = new OrbitControls(this.camera, this.canvas);
    const moveControls = new TransformControls(this.camera, this.canvas);
    moveControls.addEventListener('change', this.render);
    moveControls.addEventListener('dragging-changed', event => {
      controls.enabled = !event.value;
    });
    moveControls.attach(mesh)
  }
  render = () => {
    if (this.resize(this.renderer)) {
      this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
  resize = (renderer) => {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  add(cloud: THREE.Points) {
    this.scene.add(cloud)
  }
}

export class PaperWrap {
  ps: paper.PaperScope;
  draw() {
    this.ps.view.update()
  }
  constructor(target: HTMLCanvasElement) {

    this.ps = new PaperScope()
    this.ps.setup(target);
    new PaperZoom(this.ps.project)
  }
  drawTriangle(tri: Tri) {
    const path = new this.ps.Path();
    // Give the stroke a color
    var start = new this.ps.Point(tri.a.x, tri.a.y);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:
    path.lineTo(new this.ps.Point(tri.b.x, tri.b.y));
    path.lineTo(new this.ps.Point(tri.c.x, tri.c.y));
    // Draw the view now:
    path.closePath();
    return path
  }
}
