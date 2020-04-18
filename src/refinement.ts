import { Meshable, circle, P, line, line_, A2 } from "./Meshable";

import { Point, Color } from 'paper'
import { Tri, drawTriangle } from "./base";

import '../pages/refinement.less'
import { sleep } from "./helpers";
import { Vector3 } from "three";
import { finished } from "stream";
import { PaperZoom } from "./PaperZoom";
import { PaperScope } from "paper/dist/paper-core";

async function run() {
    var paperCanvas = document.getElementById('refinement_paper').appendChild(document.createElement('canvas'));
    // Create an empty project and a view for the canvas:
    const ps = new PaperScope()
    ps.setup(paperCanvas);
    new PaperZoom(ps.project)

    const meshable = new Meshable()

//   meshable.addPoints( circle(50, 100, 50, -10 ), true )
  meshable.addPoints( circle(150, 100, 20, 50), true )
  meshable.addPoints( line(new Vector3(), new Vector3(200,50), 30)  )
  meshable.addPoints( line_(50,170,160,140,5) )
//   meshable.addPoints( line(new Vector3(0,200), new Vector3(200,250), 30)  )
  meshable.addPoints( circle(20, 20, 33, 23 ), true )

//   ps.project.activeLayer.fitBounds( ps.view.bounds )

  meshable.mesh()

    const play = document.getElementById("play_auto") as HTMLInputElement
    const btn = document.getElementById("btn_play") as HTMLButtonElement

    btn.addEventListener('click', ev => step() )


  const step = () => {
          ps.project.activeLayer.removeChildren()
          draw()
          const color = new Color(meshable.state == 'steiner' ?'lightgreen':'magenta')
          const placeds = meshable.refineStep()
          //   meshable.refineMultiple(5)
          meshable.mesh()
          if(placeds && placeds.length) {
            for(const placed of placeds) {
            const p = new ps.Point(placed.seC.x, placed.seC.y);
            const c = new ps.Path.Circle(p, placed.seL/2);
            c.strokeColor = color
            const vertex = new ps.Path.Circle(p, 1);
            vertex.strokeColor = color
            const text = new ps.PointText(p)
            text.content = placed.edge
            }
          } else {
              if(meshable.state == 'finished') {
                  alert('fin')

              }
          }
        ps.project.activeLayer.fitBounds( ps.view.bounds )
          
      if(play.checked && meshable.state != 'finished') {
          setTimeout(step, 50)
      }
  }

  function draw() {
      drawPoints(meshable._points, '#ff0000A0');
      drawPoints(meshable._antiCroachPoints, '#0000ff50');
      drawPoints(meshable._steinerPoints, '#00ff5050');
  drawPointTexts(meshable._allPoints, 'green');
  drawEdges(meshable._allEdges, '#ff0000A0');

  const cifs = [], newPoints = []

//   for (let t of meshable._mesh) {
//     const tri = Tri.ofArray(t[0], t[1], t[2], meshable._allPoints )
//     const path = new ps.Path()
//     path.strokeColor = new Color('black')
//     path.fillColor = nextColor()
//     path.fillColor.alpha = 0.4
//     drawTriangle(tri, path);
    
//     const cif = tri.circumference()
//     cifs.push(cif)
//     if( cif.r < 300 && (tri.minLength() < tri.perimeter()/5 || tri.maxLength() > .45*tri.perimeter() ) ) {
//       // The height info is not trivial. Damn
//       const p = cif.center
//       newPoints.push(p)
//     // ps.view.draw();
//     }
//   }
    meshable.forEachTriangleEdge( (e,p,q) => {

        const path = new ps.Path.Line(new Point(p.x, p.y), new Point(q.x,q.y) )
        path.strokeColor = new Color('black')
        const tp = new Point(Tri.vMean(p,q))
        // const text =new ps.PointText(tp)
        // text.fontSize = '3px'
        // text.content = e
    })



  ps.view.update();
}

  // // points3d.push( ...line(new Vector3(),new Vector3(-20,30,20), 20 ) )
  // // points3d.push( ...line(new Vector3(),new Vector3(20,30,-40), 20 ) )
//   points3d.push( ...line(new Vector3(100,40,130),new Vector3(100, 0,30), 20 ) )
//   points3d.push( ...line(new Vector3(100,40,-100),new Vector3(100, 0,30), 20 ) )
//   points3d.push( ...line(new Vector3(-50,0,0),new Vector3(0,0,200), 20 ) )
    


    function drawPoints( points: P[], color: string, size = 1) {
        for (let p of points) {
            const vertex = new ps.Path.Circle(new ps.Point(p.x, p.y), size);
            vertex.fillColor = new Color(color);
        }
    }
    function drawEdges( edges: A2[], color: string, size = 1) {
        for (let [i0,i1] of edges) {
          const p0 = meshable._allPoints[i0]
          const p1 = meshable._allPoints[i1]
            const line = new ps.Path.Line(new ps.Point(p0.x, p0.y), new ps.Point(p1.x, p1.y));
            line.strokeColor = new Color(color);
            line.strokeWidth=4
        }
    }
    function drawPointTexts( points: P[], color: string, size = 1) {
        for (let [idx,p] of points.entries()) {
        const text =new ps.PointText(new Point(p))
        text.fontSize = '3px'
        text.content = ""+idx
        }
    }
}

document.addEventListener("DOMContentLoaded", function (event) {
    run();
})

let lastColor = new Color('hsl(180deg,80%,50%')

function nextColor() {
    lastColor = new Color(lastColor)
    lastColor.hue += 30 
    return lastColor
}