import * as assert from 'assert'
import { mergePointsIntoSegment, distanceToPoint } from '../src/Sanitzing'
import { use } from 'chai';

const  chai = require('chai');
const  chaiAlmost = require( 'chai-almost');

use(chaiAlmost());

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });

// describe('MergeToSegment', function () {
//   describe('SimpleClosePoint', function () {

//     const points = [[0, 0], [2, 0], [1, 1], [1, 0.1]]
//     const segments = [[0, 1], [2, 3]]
//     const changed = mergePointsIntoSegment(points, segments, 0.1)

//     const expectedPoints = [[0, 0], [2, 0], [1, 1], [1, 0]]
//     const expectedSegments = [[0, 3], [2, 3], [3,2]]

//     console.log(changed)

//     it('should return -1 when the value is not present', function () {
//       assert.equal(points, segments)
//     });
//   })
// })


describe('Distance2Line', function () {
  describe('Square', function () {

    const l = distanceToPoint([1,0], [0,1],[1,1])
    it('sqrt(2)/2 is expected', () => chai.expect(l).to.almost(Math.SQRT1_2) )
  })
  describe('Ortho', function () {

    const l = distanceToPoint([0,0], [0,1],[0.5,0.5])
      it('l=0.5', () => assert.equal(l, 0.5) )
  })
  describe('Diagonal', function () {

    const l = distanceToPoint([-3, 3], [5,-5],[Math.SQRT1_2,Math.SQRT1_2])
      it('l=1', () => assert.equal(l, 1) )
  })
  describe('LargeNumberOrtho', function () {

    const l = distanceToPoint([-1e6,5e20], [1e7,5e20],[0,4e20])
      it(' l=1e20', () => assert.equal(l, 1e20) )
  })
  describe('LargeNumberDiagonal', function () {
    const l = diagonal(5e3, Math.SQRT1_2, Math.SQRT1_2)
      it('l=1', () => assert.equal(l, 1) )
  })
  describe('LargeNumberDiagonal Trhough (1|1)', function () {
    const l = diagonalThrough(5e3, 1, 1 )
      it('l=0', () => assert.equal(l, 0) )
  })
  describe('LargeNumberDiagonal Refined', function () {
    const l = diagonal(5e25, Math.SQRT1_2, Math.SQRT1_2, true)
      it('l=1', () => assert.equal(l, 1) )
  })
  describe('LargeNumberDiagonal', function () {
    const l = diagonal(1e10, Math.SQRT1_2, Math.SQRT1_2, false)
      it('l=1', () => assert.equal(l, 1) )
  })
})

function diagonal(a, x, y, refine=false) {
  return distanceToPoint([-a, a], [a, -a], [x, y], refine);
}
function diagonalThrough(a, x, y) {
  return distanceToPoint([-a+x, a+y], [a+x, -a+y], [x, y]);
}
