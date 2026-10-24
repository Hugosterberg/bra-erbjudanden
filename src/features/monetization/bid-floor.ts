export function meetsFloor(bidAmount: number, floor?: number): boolean {
  if (!floor) return true;
  return bidAmount >= floor;
}
