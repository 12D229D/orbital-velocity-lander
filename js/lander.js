class Lander {
    constructor(x, y) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        
        this.angle = -Math.PI / 2; // Pointing up (0 is right)
        this.angularVel = 0;
        
        this.width = 20;
        this.height = 30;
        
        this.fuel = 1000;
        this.maxFuel = 1000;
        
        this.thrustPower = 0.08;
        this.rotationPower = 0.05;
        
        this.isThrusting = false;
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
        
        this.status = 'FLYING'; // FLYING, LANDED, CRASHED
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (this.status !== 'FLYING') return;

        // Handle rotation
        if (this.isRotatingLeft && this.fuel > 0) {
            this.angularVel -= this.rotationPower;
            this.fuel -= 0.5;
        }
        if (this.isRotatingRight && this.fuel > 0) {
            this.angularVel += this.rotationPower;
            this.fuel -= 0.5;
        }
        
        // Dampen angular velocity slightly
        this.angularVel *= 0.9;
        this.angle += this.angularVel;

        // Handle thrust
        if (this.isThrusting && this.fuel > 0) {
            const thrust = Vector.fromAngle(this.angle, this.thrustPower);
            this.applyForce(thrust);
            this.fuel -= 2;
        }

        // Apply physics
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        
        // Reset acceleration
        this.acc.mult(0);
    }

    draw(ctx) {
        if (this.status === 'CRASHED') return; // Don't draw if crashed (particles will handle it)

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle + Math.PI / 2); // Adjust so that 0 rotation points up on screen

        // Draw Lander Body
        ctx.fillStyle = '#ccc';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        
        // Main pod (octagon-ish)
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(10, -10);
        ctx.lineTo(15, 0);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Cockpit window
        ctx.fillStyle = '#3cf';
        ctx.beginPath();
        ctx.arc(0, -2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-10, 5);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-18, 15);
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(15, 15);
        ctx.lineTo(18, 15);
        ctx.stroke();

        ctx.restore();
    }

    // Returns a bounding box approximation for collision detection
    getBounds() {
        // Simple radius based collision point at the bottom of the lander
        const bottomPoint = Vector.fromAngle(this.angle, this.height / 2);
        bottomPoint.add(this.pos);
        
        return {
            x: bottomPoint.x,
            y: bottomPoint.y
        };
    }
}
