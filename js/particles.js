class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(vx, vy);
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
    }

    update() {
        this.pos.add(this.vel);
        this.life--;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class ParticleEmitter {
    constructor() {
        this.particles = [];
    }

    emitEngineThrust(x, y, angle, power) {
        // Create 2-4 particles per frame based on power
        const count = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < count; i++) {
            // Opposite to angle
            const emitAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
            const speed = (Math.random() * 2 + 1) * power;
            
            const vx = Math.cos(emitAngle) * speed;
            const vy = Math.sin(emitAngle) * speed;
            
            const life = Math.floor(Math.random() * 20) + 10;
            const size = Math.random() * 3 + 1;
            
            // Color from white to orange/red
            const r = 255;
            const g = Math.floor(Math.random() * 150) + 50;
            const b = Math.floor(Math.random() * 50);
            const color = `rgb(${r}, ${g}, ${b})`;
            
            this.particles.push(new Particle(x, y, vx, vy, life, color, size));
        }
    }

    emitExplosion(x, y) {
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const life = Math.floor(Math.random() * 60) + 20;
            const size = Math.random() * 4 + 1;
            
            const isFire = Math.random() > 0.5;
            const r = 255;
            const g = isFire ? Math.floor(Math.random() * 100) + 50 : 255;
            const b = isFire ? 0 : 255;
            
            const color = `rgb(${r}, ${g}, ${b})`;
            
            this.particles.push(new Particle(x, y, vx, vy, life, color, size));
        }
    }

    updateAndDraw(ctx) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                p.draw(ctx);
            }
        }
    }
}
