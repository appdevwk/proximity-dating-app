'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SaucyBackgroundProps {
  children: React.ReactNode;
}

export function SaucyBackground({ children }: SaucyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Create silhouette figures with better graphics
  const drawSilhouettes = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Female silhouette (left side) - more detailed
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    
    // Head with flowing hair
    ctx.beginPath();
    ctx.arc(width * 0.35, height * 0.4, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair details
    ctx.beginPath();
    ctx.arc(width * 0.33, height * 0.38, 15, 0, Math.PI * 2);
    ctx.arc(width * 0.37, height * 0.37, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Body with curves
    ctx.beginPath();
    ctx.moveTo(width * 0.35, height * 0.44);
    ctx.quadraticCurveTo(width * 0.32, height * 0.55, width * 0.35, height * 0.7);
    ctx.quadraticCurveTo(width * 0.38, height * 0.75, width * 0.4, height * 0.8);
    ctx.lineTo(width * 0.3, height * 0.8);
    ctx.quadraticCurveTo(width * 0.32, height * 0.75, width * 0.35, height * 0.7);
    ctx.quadraticCurveTo(width * 0.38, height * 0.55, width * 0.35, height * 0.44);
    ctx.fill();
    
    // Arms embracing with better curves
    ctx.beginPath();
    ctx.moveTo(width * 0.35, height * 0.5);
    ctx.quadraticCurveTo(width * 0.45, height * 0.48, width * 0.5, height * 0.5);
    ctx.quadraticCurveTo(width * 0.48, height * 0.52, width * 0.35, height * 0.54);
    ctx.fill();
    
    ctx.restore();

    // Male silhouette (right side) - more detailed
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    
    // Head
    ctx.beginPath();
    ctx.arc(width * 0.65, height * 0.4, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Shoulders and torso with better shape
    ctx.beginPath();
    ctx.moveTo(width * 0.6, height * 0.43);
    ctx.lineTo(width * 0.7, height * 0.43);
    ctx.quadraticCurveTo(width * 0.72, height * 0.55, width * 0.7, height * 0.7);
    ctx.lineTo(width * 0.6, height * 0.7);
    ctx.quadraticCurveTo(width * 0.58, height * 0.55, width * 0.6, height * 0.43);
    ctx.fill();
    
    // Arms embracing with better curves
    ctx.beginPath();
    ctx.moveTo(width * 0.65, height * 0.5);
    ctx.quadraticCurveTo(width * 0.55, height * 0.48, width * 0.5, height * 0.5);
    ctx.quadraticCurveTo(width * 0.52, height * 0.52, width * 0.65, height * 0.54);
    ctx.fill();
    
    ctx.restore();

    // Add some romantic elements - hearts
    ctx.save();
    ctx.fillStyle = 'rgba(255, 20, 147, 0.3)';
    ctx.globalAlpha = 0.6;
    
    // Floating hearts
    for (let i = 0; i < 3; i++) {
      const x = width * 0.5 + (Math.random() - 0.5) * 100;
      const y = height * 0.3 + Math.random() * 50;
      const size = Math.random() * 8 + 5;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - size/2, y - size/2, x - size, y + size/3, x, y + size);
      ctx.bezierCurveTo(x + size, y + size/3, x + size/2, y - size/2, x, y);
      ctx.fill();
    }
    
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio support
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation variables
    const particles: Particle[] = [];
    const flameColors = ['#FF1493', '#FF69B4', '#00BFFF', '#87CEEB', '#9370DB', '#FFB6C1', '#FFA500'];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      decay: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = -Math.random() * 4 - 1;
        this.size = Math.random() * 12 + 3;
        this.color = flameColors[Math.floor(Math.random() * flameColors.length)];
        this.alpha = 1;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.005;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life);
        this.size *= 0.985;
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Create gradient for flame effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.4, this.color + '80');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    // Animation loop with performance optimization
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw silhouettes
      drawSilhouettes(ctx, canvas);

      // Add new particles with controlled rate
      if (Math.random() < 0.2 && particles.length < 50) {
        particles.push(new Particle(
          canvas.width * 0.5 + (Math.random() - 0.5) * 150,
          canvas.height * 0.6
        ));
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        particle.draw(ctx);

        if (particle.life <= 0 || particle.size <= 0.5) {
          particles.splice(i, 1);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawSilhouettes]);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          zIndex: 1,
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      />
      
      {/* Overlay content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}