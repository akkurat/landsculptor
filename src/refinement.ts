

import { Point, Color, PaperScope } from 'paper'
import * as RhG from './Geom'
import {P, A2} from './Geom'

import '../pages/refinement.less'
import { sleep } from "./helpers";
import { PaperZoom } from "./PaperZoom";
import { Meshable, circle, line_ } from './Meshable';


type myP = {
  x,y, value
}

const doneSpan = document.getElementById('refinement_finished');
async function run() {
  var paperCanvas = document.getElementById('refinement_paper').appendChild(document.createElement('canvas'));
  // Create an empty project and a view for the canvas:
  const ps = new PaperScope()
  ps.setup(paperCanvas);
  new PaperZoom(ps.project)

  const play = document.getElementById("play_auto") as HTMLInputElement
  const btn = document.getElementById("btn_play") as HTMLButtonElement
  const input_angle = document.getElementById("input_angle") as HTMLButtonElement
  const input_maxsize = document.getElementById("input_maxSize") as HTMLButtonElement

  btn.addEventListener('click', ev => step())
  input_angle.addEventListener('change', ev => {initMesh(); step()})
  input_maxsize.addEventListener('change', ev => {initMesh(); step()})

  // This file should become a class
  let meshable: Meshable<myP>
  initMesh();


  let counter = 0;


  const step = async () => {
    doneSpan.textContent = "Wørking"
    counter++;
    ps.project.activeLayer.removeChildren()
    const color = new Color(meshable.state == 'steiner' ? 'lightgreen' : 'magenta')
    const placeds = meshable.refineStep()
    //   meshable.refineMultiple(5)
    if(!play.checked || counter%30 == 0) {
      draw()
      await sleep(0) // Necessary in order to let paper update the GUI
    }

    if (placeds && placeds.length) {
      for (const placed of placeds) {
        const p = new ps.Point(placed.seC.x, placed.seC.y);
        const c = new ps.Path.Circle(p, placed.seL / 2);
        c.strokeColor = color
        const vertex = new ps.Path.Circle(p, 1);
        vertex.strokeColor = color
        const text = new ps.PointText(p)
        text.content = placed.edge
      }
    } else {
      if (meshable.state == 'finished') {
        draw()
        await sleep(0)
        doneSpan.textContent = "Døne"
        

      }
    }
    // ps.project.activeLayer.fitBounds( ps.view.bounds )

    if (play.checked && meshable.state != 'finished') {
      // setTimeout(step, 20)
      step()
    }
  }

  function initMesh() {
    doneSpan.textContent = "Rædy"
    ps.project.activeLayer.removeChildren()
    const minAngle = parseFloat(input_angle.value)
    const maxLength = parseFloat(input_maxsize.value)
    meshable = new Meshable({minAngle, maxLength});
    const v = (value) =>  (p) => ({...p, value})
    meshable.addPoints(circle(50, 50, 33, v(10) , 32), true);
    meshable.addPoints([{ x: 0, y: 0, value: -3 }, { x: 0, y: 300, value: 5 }, { x: 300, y: 300, value:10 }, { x: 300, y: 0, value:5 }], true);
    meshable.addPoints_([[50, 150], [50, 100], [120, 120]], true, ([x,y]) => ({x,y,value:20}));
    meshable.addPoints(circle(127, 129, 7, v(10), 12), true);
    //   meshable.addPoints( circle(50, 100, 50, -10 ), true )
    // meshable.addPoints( circle(150, 100, 20, 50), true )
    // meshable.addPoints( line(new Vector3(), new Vector3(200,50), 30)  )
    meshable.addPoints(line_(50, 170, 160, 140,5, v(5)).concat(line_(160, 140, 170, 293,12, v(12))));
    //   meshable.addPoints( line(new Vector3(0,200), new Vector3(200,250), 30)  )
    //   ps.project.activeLayer.fitBounds( ps.view.bounds )
    meshable.init();
    draw();
  }

  function draw() {
    meshable.forEachTriangleEdge((e, p, q) => {

      const path = new ps.Path.Line(new Point(p.x, p.y), new Point(q.x, q.y))
      path.strokeColor = new Color('black')
      const tp = new Point(RhG.vMean(p, q))
      // const text =new ps.PointText(tp)
      // text.fontSize = '3px'
      // text.content = e
    })
    drawPoints(meshable._points, '#ff0000A0');
    drawPoints(meshable._antiCroachPoints, '#0000ff50');
    drawPoints(meshable._steinerPoints, '#00ff5050');
    drawPointTexts(meshable._allPoints, 'green');
    drawEdges(meshable._allSegments, '#ff0000A0');

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



    ps.view.update();
  }

  // // points3d.push( ...line(new Vector3(),new Vector3(-20,30,20), 20 ) )
  // // points3d.push( ...line(new Vector3(),new Vector3(20,30,-40), 20 ) )
  //   points3d.push( ...line(new Vector3(100,40,130),new Vector3(100, 0,30), 20 ) )
  //   points3d.push( ...line(new Vector3(100,40,-100),new Vector3(100, 0,30), 20 ) )
  //   points3d.push( ...line(new Vector3(-50,0,0),new Vector3(0,0,200), 20 ) )



  function drawPoints(points: P[], color: string, size = 1) {
    for (let p of points) {
      const vertex = new ps.Path.Circle(new ps.Point(p.x, p.y), size);
      vertex.fillColor = new Color(color);
    }
  }
  function drawEdges(edges: A2[], color: string, size = 1) {
    const col = new Color(color);
    for (let [i0, i1] of edges) {
      const p0 = meshable._allPoints[i0]
      const p1 = meshable._allPoints[i1]
      const line = new ps.Path.Line(new ps.Point(p0.x, p0.y), new ps.Point(p1.x, p1.y));
      line.strokeColor = new Color(col)
      col.hue += 122
      line.strokeWidth = 2
    }
  }
  function drawPointTexts(points: P[], color: string, size = 1) {
    for (let [idx, p] of points.entries()) {
      const text = new ps.PointText(new Point(p))
      text.fontSize = '3px'
      text.content = "" + idx
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