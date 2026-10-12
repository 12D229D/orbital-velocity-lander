class TerrainManager {
    /**
     * @param {number} width - Ancho del canvas lógico
     * @param {number} height - Alto del canvas lógico
     * @param {number} level - Nivel actual (afecta la dificultad del terreno)
     */
    constructor(width, height, level = 1) {
        this.width = width;
        this.height = height;
        this.level = level;
        this.points = [];
        this.landingPad = { startX: 0, endX: 0, y: 0 };
        this.generate();
    }

    generate() {
        this.points = [];
        
        const segments = 20;
        const segmentWidth = this.width / segments;
        
        // La plataforma se vuelve más estrecha a mayor nivel (mín. 1 segmento)
        const padWidthSegments = Math.max(1, 3 - Math.floor(this.level / 4));
        
        // El terreno se vuelve más agresivo a mayor nivel
        const heightVariance = Math.min(0.55, 0.3 + this.level * 0.025);

        // Elegir un segmento aleatorio para la plataforma de aterrizaje
        const padSegmentIndex = Math.floor(Math.random() * (segments - padWidthSegments - 3)) + 2;
        const padEndIndex = padSegmentIndex + padWidthSegments;
        
        let currentY = this.height * 0.6 + (Math.random() * this.height * 0.25);
        
        this.points.push({ x: 0, y: currentY });
        
        for (let i = 1; i <= segments; i++) {
            let nextX = i * segmentWidth;
            let nextY;
            
            const inPad = (i > padSegmentIndex && i <= padEndIndex);
            const isPadStart = (i === padSegmentIndex + 1);

            if (inPad) {
                // Segmento plano de la plataforma
                nextY = currentY;
                if (isPadStart) {
                    this.landingPad.startX = nextX - segmentWidth;
                    this.landingPad.y = nextY;
                }
                if (i === padEndIndex) {
                    this.landingPad.endX = nextX;
                }
            } else {
                // Terreno aleatorio con varianza basada en nivel
                const change = (Math.random() - 0.5) * this.height * heightVariance;
                nextY = currentY + change;
                
                if (nextY > this.height * 0.92) nextY = this.height * 0.92;
                if (nextY < this.height * 0.35) nextY = this.height * 0.35;
            }
            
            this.points.push({ x: nextX, y: nextY });
            currentY = nextY;
        }
    }


    draw(ctx) {
        // Draw terrain fill
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        for (let i = 0; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        
        // Fill
        const gradient = ctx.createLinearGradient(0, this.height * 0.5, 0, this.height);
        gradient.addColorStop(0, 'hsl(220, 20%, 20%)');
        gradient.addColorStop(1, 'hsl(220, 30%, 5%)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stroke
        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            if (i === 0) ctx.moveTo(this.points[i].x, this.points[i].y);
            else ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.strokeStyle = 'hsl(190, 50%, 40%)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw Landing Pad Highlight
        ctx.beginPath();
        ctx.moveTo(this.landingPad.startX, this.landingPad.y);
        ctx.lineTo(this.landingPad.endX, this.landingPad.y);
        ctx.strokeStyle = 'hsl(120, 70%, 50%)'; // Green pad
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Pad glow
        ctx.shadowColor = 'hsl(120, 70%, 50%)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
    }

    // Basic line-line intersection check for the whole terrain
    // Returns true if the line (x1,y1) to (x2,y2) intersects any terrain segment
    checkCollision(x1, y1, x2, y2) {
        for (let i = 0; i < this.points.length - 1; i++) {
            const p3 = this.points[i];
            const p4 = this.points[i+1];
            
            if (this.intersects(x1, y1, x2, y2, p3.x, p3.y, p4.x, p4.y)) {
                
                // Check if it's specifically the landing pad
                const isPad = (p3.x >= this.landingPad.startX && p4.x <= this.landingPad.endX);
                return { hit: true, isPad: isPad, padY: this.landingPad.y };
            }
        }
        return { hit: false };
    }

    intersects(a, b, c, d, p, q, r, s) {
        let det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }
}
