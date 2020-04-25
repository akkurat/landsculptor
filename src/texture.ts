import * as THREE from 'three' 

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

var camera, scene, renderer, stats;

var mesh;

init();
animate();

function init() {

    //

    camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 3500 );
    camera.position.z = 3;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x050505 );

    //

    var light = new THREE.HemisphereLight('white','yellow', 400)
    scene.add( light );

    //

    var geometry = new THREE.Geometry();

    var indices = [];

    var vertices = [];
    var faces = []
    var normals = [];
    var colors = [];

    var size = 1;
    var segments = 2;

    var halfSize = size / 2;
    var segmentSize = size / segments;

    // generate vertices, normals and color data for a simple grid geometry

    for ( var i = 0; i <= segments; i ++ ) {

        var y = ( i * segmentSize ) - halfSize;

        for ( var j = 0; j <= segments; j ++ ) {

            var x = ( j * segmentSize ) - halfSize;

            vertices.push( x, - y, 0 );
            geometry.vertices.push( new THREE.Vector3(x, -y, 0))
            normals.push( 0, 0, 1 );

            var r = ( x / size ) + 0.5;
            var g = ( y / size ) + 0.5;

            colors.push( r, g, 1 );

        }

    }

    // generate indices (data for element array buffer)

    for ( var i = 0; i < segments; i ++ ) {

        for ( var j = 0; j < segments; j ++ ) {

            var a = i * ( segments + 1 ) + ( j + 1 );
            var b = i * ( segments + 1 ) + j;
            var c = ( i + 1 ) * ( segments + 1 ) + j;
            var d = ( i + 1 ) * ( segments + 1 ) + ( j + 1 );

            // generate two faces (triangles) per iteration

            indices.push( a, b, d ); // face one
            indices.push( b, c, d ); // face two

            const face1 = new THREE.Face3(a, b, d);
            const unitZ = new THREE.Vector3(0, 0, 1);
            face1.normal = unitZ;
            face1.color = new THREE.Color('green');
            geometry.faces.push( face1)
            const face2 = new THREE.Face3(b, c, d);
            face2.normal = unitZ;
            geometry.faces.push( face2)


        }

    }

    //

    // geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    // geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
    // geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    geometry.faceVertexUvs[0].push(
        // front
        [ new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1) ],
        [ new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1) ]
    )


    var material = new THREE.MeshBasicMaterial( {
        side: THREE.DoubleSide,
        //@ts-ignore
        vertexColors: THREE.FaceColors
    } );

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //

    //@ts-ignore
    stats = new Stats();
    document.body.appendChild( stats.dom );

    //

    var gui = new GUI();
    gui.add( material, 'wireframe' );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    var time = Date.now() * 0.001;

    mesh.rotation.x = time * 0.25;
    mesh.rotation.y = time * 0.5;

    renderer.render( scene, camera );

}
