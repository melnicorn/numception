/**
 * Column carries of `x + y` in base 10, the carry out of the top column included
 * (so 5 + 5 has one). Non-negative integers; at most 17 loop turns for safe integers.
 */
export function countCarries(x: number, y: number): number {
  let carries = 0;
  let carry = 0;
  let a = x;
  let b = y;
  while (a > 0 || b > 0) {
    const da = a % 10;
    const db = b % 10;
    carry = da + db + carry >= 10 ? 1 : 0;
    carries += carry;
    a = (a - da) / 10;
    b = (b - db) / 10;
  }
  return carries;
}

/**
 * Column borrows of `x − y` in base 10, for integers `x >= y >= 0`. Equal to the
 * carries of `y + (x − y)`: each borrow in the subtraction is a carry in the
 * addition that undoes it.
 */
export function countBorrows(x: number, y: number): number {
  let borrows = 0;
  let borrow = 0;
  let a = x;
  let b = y;
  while (a > 0 || b > 0) {
    const da = a % 10;
    const db = b % 10;
    borrow = da - db - borrow < 0 ? 1 : 0;
    borrows += borrow;
    a = (a - da) / 10;
    b = (b - db) / 10;
  }
  return borrows;
}
