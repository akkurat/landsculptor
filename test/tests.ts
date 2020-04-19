import * as assert from 'assert'
import { mergePointsIntoSegment } from '../src/Sanitzing'

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });

describe('MergeToSegment', function () {
  describe('SimpleClosePoint', function () {

    const points = [[0, 0], [2, 0], [1, 1], [1, 0.1]]
    const segments = [[0, 1], [2, 3]]
    const changed = mergePointsIntoSegment(points, segments, 0.1)

    const expectedPoints = [[0, 0], [2, 0], [1, 1], [1, 0]]
    const expectedSegments = [[0, 3], [2, 3], [3,2]]

    console.log(changed)

    it('should return -1 when the value is not present', function () {
      assert.equal(points, segments)
    });
  })
})