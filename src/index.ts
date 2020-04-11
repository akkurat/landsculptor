import * as THREE from 'three';
import { BufferGeometry, Vector3 } from 'three'
import Delaunator from 'delaunator'

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

 const filename = require('../textures/grasslight-big.jpg')

// Thanks @prisoner849 for the combination of three + delaunator
// https://discourse.threejs.org/t/three-js-delaunator/4952
// https://codepen.io/prisoner849/pen/bQWOjY

function run() {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
  camera.position.setScalar(150);
  var renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  var canvas = renderer.domElement;
  document.body.appendChild(canvas);

  var controls = new OrbitControls(camera, canvas);

  const moveControls = new TransformControls(camera, canvas);
  moveControls.addEventListener('change', render);
  moveControls.addEventListener('dragging-changed', event => {
    controls.enabled = !event.value;
  });

  var light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set( 0, 251, 0 ); 
  scene.add(light);
  scene.add( new THREE.AmbientLight( 0xFFFFFF, 3 ) );

  const size = { x: 200, z: 200 };
  const borderPoints = 30;
  const points3d = [];

  const startX = -300, startZ = -250
  // Border Points
  for (let x = -300; x <= 200; x += 10) {
    points3d.push(new THREE.Vector3(x, 0, startZ));
    points3d.push(new THREE.Vector3(x, 0, size.z));
  }
  for (let z = -200; z <= 200; z += 10) {
    points3d.push(new THREE.Vector3(startX, 0, z));
    points3d.push(new THREE.Vector3(size.x, 0, z));
  }

  function circle(x, z, r, h = 0, layers = 1) : Vector3[] {
    const points = []
    const range: number[] = createRange(0, Math.PI * 2, 20)

    range.forEach((v, idx) => {
      const sin = Math.sin(v)
      const cos = Math.cos(v)
      for (let i = layers; i >= 1; i--) {
        // if (idx % (layers - i) == 0) {
          const factor = r * i / layers
          points.push(new THREE.Vector3(factor * cos + x, h, factor * sin + z))
        // }
      }
    });
    return points;
  }

  const xAxis = new Vector3( 1, 0, 0 )

  points3d.push( ...(circle(50, 100, 50, -10 ).map( v => v.applyAxisAngle( xAxis, Math.PI/30))) )
  points3d.push( ...circle(150, 100, 20, 50) )
  points3d.push( ...circle(20, 20, 33, 23 ) )

  // points3d.push( ...line(new Vector3(),new Vector3(-20,30,20), 20 ) )
  // points3d.push( ...line(new Vector3(),new Vector3(20,30,-40), 20 ) )
  points3d.push( ...line(new Vector3(100,40,130),new Vector3(100, 0,30), 20 ) )
  points3d.push( ...line(new Vector3(100,40,-100),new Vector3(100, 0,30), 20 ) )
  points3d.push( ...line(new Vector3(-50,0,0),new Vector3(0,0,200), 20 ) )

  // new Vector3().apply




  var geom = new THREE.Geometry().setFromPoints(points3d);
  var cloud = new THREE.Points(
    geom,
    new THREE.PointsMaterial({ color: 0x99ccff, size: 2 })
  );
  // scene.add(cloud);

  // triangulate x, z
  var indexDelaunay = Delaunator.from(
    points3d.map(v => {
      return [v.x, v.z];
    })
  );

  var meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i+=3) {
    const t = indexDelaunay.triangles
    const face = new THREE.Face3(t[i], t[i+1], t[i+2])
    geom.faces.push(face);
  }

  // geom.setIndex(meshIndex); // add three.js index to the existing geometry
  // geom.faces.push

  geom.computeVertexNormals();
  assignUVs(geom)
  const material =  new THREE.MeshLambertMaterial({
     map: createGrass(), 
     side: THREE.DoubleSide,
     alphaTest: 0.5
     })
  var mesh = new THREE.Mesh(
    geom, // re-use the existing geometry
    material
  );

  // mesh.position.y = +5;
  // mesh.rotation.x = - Math.PI / 2;
  // mesh.receiveShadow = true;
  scene.add(mesh);
  scene.add(moveControls);
  moveControls.attach(mesh);

  // const plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(430, 100), material);
  // scene.add(plane)


  var gui = new GUI();
  gui.add(mesh.material, "wireframe");

  render();

  function resize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render() {
    if (resize(renderer)) {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
}

function createRange(start: number, end: number, steps: number, inclusive=false) {
  const dsteps = inclusive ? steps - 1 : steps 
  const delta = (end - start) / dsteps
  const out = Array(steps)

  for( let i = 0; i< out.length; i++) {
   out[i] =  start + i * delta
  }
  return out;
}

function line( vStart: THREE.Vector3, vEnd: THREE.Vector3 , points: number) {
  const delta = vEnd.clone().sub( vStart ).multiplyScalar(1/(points-1))

  const out = Array(points)
  for( let i = 0; i< out.length; i++) {
   out[i] =  vStart.clone().addScaledVector(delta, i)
  }
  return out;

}

function createGrass() {
  var loader = new THREE.TextureLoader()
  // loader.setTranscoderPath( 'js/libs/basis/' );
	// 			loader.detectSupport( renderer );

  var groundTexture = loader.load(filename)
        groundTexture.encoding = THREE.sRGBEncoding;
        return groundTexture
  

}

function assignUVs(geometry) {
  geometry.faceVertexUvs[0] = [];
  geometry.faces.forEach(function(face) {
      var components = ['x', 'y', 'z'].sort(function(a, b) {
          return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
      });

      var v1 = geometry.vertices[face.a];
      var v2 = geometry.vertices[face.b];
      var v3 = geometry.vertices[face.c];

      geometry.faceVertexUvs[0].push([
          new THREE.Vector2(v1[components[0]], v1[components[1]]),
          new THREE.Vector2(v2[components[0]], v2[components[1]]),
          new THREE.Vector2(v3[components[0]], v3[components[1]])
      ]);

  });
  geometry.uvsNeedUpdate = true;
}


run();
