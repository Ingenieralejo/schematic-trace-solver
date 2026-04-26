import { BaseSolver } from "lib/solvers/BaseSolver/BaseSolver"
import type { InputProblem } from "lib/types/InputProblem"
import type { SolvedTracePath } from "lib/solvers/SchematicTraceLinesSolver/SchematicTraceLinesSolver"
import type { GraphicsObject, Line } from "graphics-debug"
import { simplifyPath } from "lib/solvers/TraceCleanupSolver/simplifyPath"
import type { Point } from "@tscircuit/math-utils"

interface CombineSameNetTraceSegmentsSolverInput {
  inputProblem: InputProblem
  allTraces: SolvedTracePath[]
}

export class CombineSameNetTraceSegmentsSolver extends BaseSolver {
  private input: CombineSameNetTraceSegmentsSolverInput
  private outputTraces: SolvedTracePath[]

  constructor(solverInput: CombineSameNetTraceSegmentsSolverInput) {
    super()
    this.input = solverInput
    this.outputTraces = [...solverInput.allTraces]
  }

  override _step() {
    let mergedAny = false
    const traces = [...this.outputTraces]
    const newTraces: SolvedTracePath[] = []
    const processedIndices = new Set<number>()

    for (let i = 0; i < traces.length; i++) {
      if (processedIndices.has(i)) continue
      let currentTrace = traces[i]!
      processedIndices.add(i)

      let mergedThisRound = true
      while (mergedThisRound) {
        mergedThisRound = false
        for (let j = 0; j < traces.length; j++) {
          if (processedIndices.has(j)) continue
          const otherTrace = traces[j]!

          if (currentTrace.globalConnNetId !== otherTrace.globalConnNetId)
            continue

          // Check if they can be merged
          const p1Start = currentTrace.tracePath[0]!
          const p1End = currentTrace.tracePath[currentTrace.tracePath.length - 1]!
          const p2Start = otherTrace.tracePath[0]!
          const p2End = otherTrace.tracePath[otherTrace.tracePath.length - 1]!

          const dist = (pt1: Point, pt2: Point) =>
            Math.sqrt((pt1.x - pt2.x) ** 2 + (pt1.y - pt2.y) ** 2)
          const threshold = 0.05 // Standard threshold

          let mergedPath: Point[] | null = null
          if (dist(p1End, p2Start) < threshold) {
            mergedPath = [...currentTrace.tracePath, ...otherTrace.tracePath]
          } else if (dist(p1Start, p2End) < threshold) {
            mergedPath = [...otherTrace.tracePath, ...currentTrace.tracePath]
          } else if (dist(p1End, p2End) < threshold) {
            mergedPath = [
              ...currentTrace.tracePath,
              ...[...otherTrace.tracePath].reverse(),
            ]
          } else if (dist(p1Start, p2Start) < threshold) {
            mergedPath = [
              ...[...currentTrace.tracePath].reverse(),
              ...otherTrace.tracePath,
            ]
          }

          if (mergedPath) {
            currentTrace = {
              ...currentTrace,
              tracePath: simplifyPath(mergedPath),
              mspConnectionPairIds: [
                ...currentTrace.mspConnectionPairIds,
                ...otherTrace.mspConnectionPairIds,
              ],
              pinIds: [...currentTrace.pinIds, ...otherTrace.pinIds],
            }
            processedIndices.add(j)
            mergedThisRound = true
            mergedAny = true
          }
        }
      }
      newTraces.push(currentTrace)
    }

    this.outputTraces = newTraces
    this.solved = true
  }

  getOutput() {
    return {
      traces: this.outputTraces,
    }
  }

  override visualize(): GraphicsObject {
    const graphics: GraphicsObject = {
      lines: [],
    }

    for (const trace of this.outputTraces) {
      const line: Line = {
        points: trace.tracePath.map((p) => ({ x: p.x, y: p.y })),
        strokeColor: "blue",
      }
      graphics.lines!.push(line)
    }
    return graphics
  }
}
