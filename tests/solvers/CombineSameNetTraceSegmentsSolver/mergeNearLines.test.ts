import { expect, test } from "bun:test"
import inputData from "../../assets/mergeNearLines.input.json"
import { CombineSameNetTraceSegmentsSolver } from "lib/solvers/CombineSameNetTraceSegmentsSolver/CombineSameNetTraceSegmentsSolver"

test("CombineSameNetTraceSegmentsSolver should merge near aligned lines of the same net", () => {
  const solver = new CombineSameNetTraceSegmentsSolver({
    inputProblem: inputData.inputProblem as any,
    allTraces: inputData.allTraces as any,
  })

  solver.solve()
  const output = solver.getOutput()

  // Initially we have 2 traces. After merging, we should have 1 trace
  // covering from x=0 to x=20.
  expect(output.traces.length).toBe(1)
  expect(output.traces[0].tracePath).toEqual([
    { x: 0, y: 0 },
    { x: 20, y: 0 },
  ])
})
