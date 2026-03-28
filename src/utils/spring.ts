/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

export class SpringValue {
  private current: number;
  private target: number;
  private velocity: number;
  private stiffness: number;
  private damping: number;

  constructor(initial = 1, stiffness = 180, damping = 12) {
    this.current = initial;
    this.target = initial;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  setTarget(value: number): void {
    this.target = value;
  }

  update(dt: number): number {
    const spring = (this.target - this.current) * this.stiffness;
    const damper = this.velocity * this.damping;
    const acceleration = spring - damper;
    this.velocity += acceleration * dt;
    this.current += this.velocity * dt;
    return this.current;
  }

  getValue(): number {
    return this.current;
  }

  isSettled(): boolean {
    return (
      Math.abs(this.target - this.current) < 0.001 &&
      Math.abs(this.velocity) < 0.001
    );
  }
}
