/**
 * Vector class for 2D math operations
 */
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    setMag(len) {
        return this.normalize().mult(len);
    }

    normalize() {
        const m = this.mag();
        if (m !== 0 && m !== 1) {
            this.div(m);
        }
        return this;
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }

    copy() {
        return new Vector(this.x, this.y);
    }

    limit(max) {
        if (this.magSq() > max * max) {
            this.normalize().mult(max);
        }
        return this;
    }

    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static fromAngle(angle, length = 1) {
        return new Vector(length * Math.cos(angle), length * Math.sin(angle));
    }
}

/**
 * PhysicsEngine manages world gravity and global parameters
 */
class PhysicsEngine {
    constructor() {
        // Global gravity vector (pointing down)
        this.gravity = new Vector(0, 0.03);
    }

    applyGravity(entity) {
        // Assume entity has an applyForce method
        entity.applyForce(this.gravity);
    }
}
