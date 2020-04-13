import { Meshable, circle, P, line } from "./Meshable";

import * as paper from 'paper'
import { Path, Color } from 'paper'
import { Tri, drawTriangle } from "./base";

import '../pages/refinement.less'
import { sleep } from "./helpers";
import { Vector3 } from "three";
import { finished } from "stream";

async function run() {
    var paperCanvas = document.getElementById('refinement_paper').appendChild(document.createElement('canvas'));
    // Create an empty project and a view for the canvas:
    paper.setup(paperCanvas);

    const meshable = new Meshable()

  meshable.addPoints( circle(50, 100, 50, -10 ), true )
  meshable.addPoints( circle(150, 100, 20, 50), true )
  meshable.addPoints( line(new Vector3(), new Vector3(200,50), 30)  )
  meshable.addPoints( line(new Vector3(0,200), new Vector3(200,250), 30)  )
//   meshable.addPoints( circle(20, 20, 33, 23 ), closed )

//   paper.project.activeLayer.fitBounds( paper.view.bounds )

  meshable.mesh()

    const play = document.getElementById("play_auto") as HTMLInputElement
    const btn = document.getElementById("btn_play") as HTMLButtonElement

    btn.addEventListener('click', ev => step() )


  const step = () => {
          paper.project.activeLayer.removeChildren()
          draw()
          const placeds = meshable.refineStep(20)
          //   meshable.refineMultiple(5)
          meshable.mesh()
          if(placeds && placeds.length) {
            const color = new Color(meshable.state == 'steiner' ?'lightgreen':'magenta')
            for(const placed of placeds) {
            const c = new paper.Path.Circle(new paper.Point(placed.seC.x, placed.seC.y), placed.seL/2);
            c.strokeColor = color
            const vertex = new paper.Path.Circle(new paper.Point(placed.seC.x, placed.seC.y), 1);
            vertex.strokeColor = color
            }
          } else {
              if(meshable.state == 'finished') {
                  alert('fin')

              }
          }
        paper.project.activeLayer.fitBounds( paper.view.bounds )
          
      if(play.checked && meshable.state != 'finished') {
          setTimeout(step, 50)
      }
  }

  function draw() {
      drawPoints(meshable._points, '#ff0000A0');
      drawPoints(meshable._antiCroachPoints, '#0000ff50');
//   drawPoints(meshable._allPoints, 'green');

  const cifs = [], newPoints = []

  for (let t of meshable._mesh) {
    const tri = Tri.ofArray(t[0], t[1], t[2], meshable._allPoints )
    const path = new Path()
    path.strokeColor = new Color('black');
    drawTriangle(tri, path);
    
    const cif = tri.circumference()
    cifs.push(cif)
    if( cif.r < 300 && (tri.minLength() < tri.perimeter()/5 || tri.maxLength() > .45*tri.perimeter() ) ) {
      // The height info is not trivial. Damn
      const p = cif.center
      newPoints.push(p)
    // paper.view.draw();
    }
  }
  paper.view.update();
}

  // // points3d.push( ...line(new Vector3(),new Vector3(-20,30,20), 20 ) )
  // // points3d.push( ...line(new Vector3(),new Vector3(20,30,-40), 20 ) )
//   points3d.push( ...line(new Vector3(100,40,130),new Vector3(100, 0,30), 20 ) )
//   points3d.push( ...line(new Vector3(100,40,-100),new Vector3(100, 0,30), 20 ) )
//   points3d.push( ...line(new Vector3(-50,0,0),new Vector3(0,0,200), 20 ) )
    


    function drawPoints( points: P[], color: string, size = 1) {
        for (let p of points) {
            const vertex = new paper.Path.Circle(new paper.Point(p.x, p.y), size);
            vertex.fillColor = new Color(color);
        }
    }
}

document.addEventListener("DOMContentLoaded", function (event) {
    run();
})