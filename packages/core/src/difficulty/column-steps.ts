/**
 * Column carries of `x + y` (base 10, carry out of the top column included) or
 * borrows of `x − y` (`x >= y >= 0`). Written independently of the generator so a
 * new generator version can't silently redefine a bucket (AD-8).
 */
export function columnSteps(x: number, y: number, kind: 'carry' | 'borrow'): number {
  let count = 0;
  let pending = 0;
  let a = x;
  let b = y;
  while (a > 0 || b > 0) {
    const da = a % 10;
    const db = b % 10;
    pending = kind === 'carry' ? (da + db + pending >= 10 ? 1 : 0) : da - db - pending < 0 ? 1 : 0;
    count += pending;
    a = (a - da) / 10;
    b = (b - db) / 10;
  }
  return count;
}
