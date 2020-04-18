
import * as THREE from 'three';
import { BufferGeometry, Vector3, Vector2, VertexColors } from 'three'
import Delaunator from 'delaunator'

import * as paper from 'paper'
import { Color } from 'paper'

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const filename = require('../textures/grasslight-big.jpg')
import { createRange } from './helpers';

import '../index.less'

// Thanks @prisoner849 for the combination of three + delaunator
// https://discourse.threejs.org/t/three-js-delaunator/4952
// https://codepen.io/prisoner849/pen/bQWOjY

export function run() {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
  camera.position.setScalar(150);
  var renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  var canvas = renderer.domElement;
  document.querySelector('#three').appendChild(canvas);
  var paperCanvas = document.getElementById('paper').appendChild( document.createElement('canvas'));
		// Create an empty project and a view for the canvas:
    paper.setup(paperCanvas);
    

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
  const points3d: Vector3[] = [];

  const startX = -300, startZ = -250
  // Border Points
  // for (let x = -300; x <= 200; x += 10) {
  //   points3d.push(new THREE.Vector3(x, 0, startZ));
  //   points3d.push(new THREE.Vector3(x, 0, size.z));
  // }
  // for (let z = -200; z <= 200; z += 10) {
  //   points3d.push(new THREE.Vector3(startX, 0, z));
  //   points3d.push(new THREE.Vector3(size.x, 0, z));
  // }

  function circle(x, z, r, h = 0, layers = 1): Vector3[] {
    const points = []
    const numInnerPoints = 24

    for (let i = layers; i >= 1; i--) {
      const range: number[] = createRange(0, Math.PI * 2, 2 ** (i-1) * numInnerPoints)
      range.forEach((v, idx) => {
        const sin = Math.sin(v)
        const cos = Math.cos(v)
        // if (idx % (layers - i) == 0) {
        const factor = r * i / layers
        points.push(new THREE.Vector3(factor * cos + x, h, factor * sin + z))
        // }
      })
    }
    // points.push(new THREE.Vector3( x, h, z))
    return points;
  }

  const xAxis = new Vector3( 1, 0, 0 )

  points3d.push( ...(circle(50, 100, 50, -10 ).map( v => v.applyAxisAngle( xAxis, Math.PI/30))) )
  points3d.push( ...circle(150, 100, 20, 50) )
  points3d.push( ...circle(20, 20, 33, 23 ) )

  // // points3d.push( ...line(new Vector3(),new Vector3(-20,30,20), 20 ) )
  // // points3d.push( ...line(new Vector3(),new Vector3(20,30,-40), 20 ) )
  points3d.push( ...line(new Vector3(100,40,130),new Vector3(100, 0,30), 20 ) )
  points3d.push( ...line(new Vector3(100,40,-100),new Vector3(100, 0,30), 20 ) )
  points3d.push( ...line(new Vector3(-50,0,0),new Vector3(0,0,200), 20 ) )

  // new Vector3().apply




  var geom = new THREE.Geometry().setFromPoints(points3d);
  var cloud = new THREE.Points(
    geom,
    new THREE.PointsMaterial({ color: 0x99ccff, size: 2 })
  );
  scene.add(cloud);

  // triangulate x, z
  var indexDelaunay = Delaunator.from(
    points3d.map(v => {
      return [v.x, v.z];
    })
  );

  //   const t = indexDelaunay.triangles
  //   const p = points3d
  // for (let i = 0; i < indexDelaunay.triangles.length; i+=3) {
  //  const tri = Tri.ofArray(t[i], t[i+1], t[i+2], p, v => v.x, v => v.z)
  //  console.log(tri.maxLength())

  // }


  for( let p of points3d) {
    const vertex = new paper.Path.Circle( new paper.Point(p.x, p.z),.2 )
    vertex.fillColor= new Color('red');
  }

  const cifs : {center: Vector2, r: number}[] =[]
  const newPoints : Vector3[] = []

  var meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i+=3) {
    const t = indexDelaunay.triangles
    const face = new THREE.Face3(t[i], t[i+1], t[i+2])
    geom.faces.push(face);
    // geom.faceVertexUvs[0].push(
    //   // front
    //   [ new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1) ]
    //   // [ new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1) ]
    // )
    // Create a Paper.js Path to draw a line into it:
    const tri = Tri.ofArray(t[i], t[i+1], t[i+2], points3d, v=>v.x, v=>v.z)
    const path = new paper.Path()
    path.strokeColor = new Color('black')
		drawTriangle(tri, path);
    
    const cif = tri.circumference()
    cifs.push(cif)
    if( cif.r < 300 && (tri.minLength() < tri.perimeter()/5 || tri.maxLength() > .45*tri.perimeter() ) ) {
      // The height info is not trivial. Damn
      const p = cif.center
      newPoints.push(new Vector3( p.x, 0, p.y) )
    // paper.view.draw();
    }
  }
  //@ts-ignore
  paper.view.draw();


  for (let cif of cifs) {
    const cpoint = new paper.Point( cif.center.x, cif.center.y)
    if( Math.abs(cif.r) < 50) {
      const circumcircle = new paper.Path.Circle(new paper.Point(cif.center.x, cif.center.y), cif.r)
      const cifp = new paper.Path.Circle(new paper.Point(cif.center.x, cif.center.y), .2)
      const g = new Color('green')
      cifp.fillColor = g;
      circumcircle.strokeColor = g;
    } else {
      console.log( cif )
    }

  }

  const allPoints =newPoints.concat(points3d); 

  // const allPointsDel  = Delaunator.from( allPoints.map(v => [v.x, v.z]));
  // for( let i=0; i<allPointsDel.triangles.length; i+=3 )
  // {

  //   const t = allPointsDel.triangles
  //   const tri = Tri.ofArray(t[i], t[i+1], t[i+2], allPoints, v=>v.x, v=>v.z)
    
  //   const path = new paper.Path()
  //   path.strokeColor = 'blue';
	// 	drawTriangle(tri, path);
  // }
  // paper.view.draw()
  

  paper.project.activeLayer.fitBounds( paper.view.bounds )
  // geom.setIndex(meshIndex); // add three.js index to the existing geometry
  // geom.faces.push

  geom.computeVertexNormals();
  // assignUVs(geom)
  const material =  new THREE.MeshLambertMaterial({
    //  map: createGrass(), 
    color: 'green',
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
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(2,2)
        return groundTexture
  

}

function assignUVs(geometry) {
  geometry.faceVertexUvs[0] = [];
  geometry.faces.forEach(function(face) {
      // var components = ['x', 'y', 'z'].sort(function(a, b) {
      //     return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
      // });

      var v1: Vector3 = geometry.vertices[face.a];
      var v2: Vector3 = geometry.vertices[face.b];
      var v3: Vector3 = geometry.vertices[face.c];
      const v = [v1,v2,v3]
      const maxX = Math.max(...v.map(v => v.x) )
      const maxZ = Math.max(...v.map(v => v.z) )
      const minX = Math.min(...v.map(v => v.x) )
      const minZ = Math.min(...v.map(v => v.z) )

      const sX = 1/(maxX-minX)
      const sZ = 1/(maxZ-minZ)



      geometry.faceVertexUvs[0].push([
          new THREE.Vector2((v1.x-minX)*sX, (v1.z-minZ)*sZ),
          new THREE.Vector2((v2.x-minX)*sX, (v2.z-minZ)*sZ),
          new THREE.Vector2((v3.x-minX)*sX, (v3.z-minZ)*sZ)
      ]);

  });
  geometry.uvsNeedUpdate = true;
}


interface V2 {
  x: number
  y: number
}

export class Tri {
  l_ab: number; l_bc: number; l_ca: number
  constructor( public a: V2, public b: V2, public c: V2) {
    this.l_ab = Tri.distance(a,b)
    this.l_bc = Tri.distance(b,c)
    this.l_ca = Tri.distance(c,a)
  }

  static distance(a,b) {
    return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)
  }


  segmentCenters = () => 
    [
      Tri.vMean(this.a, this.b),
      Tri.vMean(this.b, this.c),
      Tri.vMean(this.c, this.a),
    ]
  segmentLengths = () => [this.l_ab, this.l_bc, this.l_ca]

  maxLength() {
    return Math.max(this.l_ab, this.l_bc, this.l_ca)
  }
  minLength() {
    return Math.min(this.l_ab, this.l_bc, this.l_ca)
  }

  perimeter() {
    return this.l_ab + this.l_bc + this.l_ca
  }


  minAngle() {

    const sides = [this.l_ab,this.l_bc,this.l_ca].sort((a,b) => a-b)
    const [min, middle, max] = sides

    const cosalpha = ( max**2+middle**2 - min**2 ) / (2 * max * middle)
    return Math.acos(cosalpha)

  }


  circumference() {
    
    // https://en.wikipedia.org/wiki/Circumscribed_circle#Circumcenter_coordinates

    const a = Tri.vSub(this.a, this.a) // should be zero
    const b = Tri.vSub(this.b, this.a)
    const c = Tri.vSub(this.c, this.a)
    const D = 2 * ( b.x*c.y - b.y*c.x)
    const bb = b.x**2 + b.y**2 
    const cc = c.x**2 + c.y**2 
    const x = 1/D * ( bb * c.y - cc * b.y )
    const y = 1/D * ( cc * b.x - bb * c.x )

    const out = Tri.vAdd(this.a,{x,y})
    return { r: Math.sqrt(x**2+y**2) , center: new Vector2(out.x, out.y)}

  }

  static vSub(b,a) {
    return {x:b.x-a.x, y: b.y-a.y}
  }
  static vAdd(b,a) {
    return {x:b.x+a.x, y: b.y+a.y}
  }
  static vMean(b,a) {
    return {x:0.5*(b.x+a.x), y: 0.5*(b.y+a.y)}
  }
  /**
   * 
   * @param _a index
   * @param _b inex
   * @param _c index
   * @param points
   * @param x
   * @param y
   * 
   */
  static ofArray_ <T>( [a,b,c]:number[], points: T[], x?: (T) => number, y?: (T) => number) {
    return Tri.ofArray(a,b,c,points,x,y)
  }
  static ofArray <T>( _a: number, _b: number, _c: number, points: T[], x?: (T) => number, y?: (T) => number) {
    const tripoints = [_a,_b,_c].map(eP)
    //@ts-ignore this is perfectly valid
    return new Tri(...tripoints)
    function eP(idx) {
      const p = points[idx]
      //@ts-ignore
      return new Vector2(x?x(p):p.x, y?y(p):p.y)

    }
  }

  
}


export function drawTriangle(tri: Tri, path?) {
  path = path || new paper.Path();
  // Give the stroke a color
  var start = new paper.Point(tri.a.x, tri.a.y);
  // Move to start and draw a line from there
  path.moveTo(start);
  // Note that the plus operator on Point objects does not work
  // in JavaScript. Instead, we need to call the add() function:
  path.lineTo(new paper.Point(tri.b.x, tri.b.y));
  path.lineTo(new paper.Point(tri.c.x, tri.c.y));
  // Draw the view now:
  path.closePath();
}