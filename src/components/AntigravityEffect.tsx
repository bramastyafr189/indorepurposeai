"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  baseSize: number;
}

const GOOGLE_COLORS = [
  "#4285F4", // Blue
  "#EA4335", // Red
  "#FBBC05", // Yellow
  "#34A853", // Green
  "#673AB7", // Deep Purple
];

export const AntigravityEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 600;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      init();
    };

    const init = () => {
      particles = [];
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 2.5 + 0.5;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          originX: 0,
          originY: 0,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size,
          baseSize: size,
          color: GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)],
          angle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Floating motion
        p.angle += p.speed;
        p.x += p.vx + Math.cos(p.angle) * 0.2;
        p.y += p.vy + Math.sin(p.angle) * 0.2;

        // Mouse interaction
        if (mouseRef.current.isActive) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 250;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            
            // Subtle attraction + vortex effect
            const moveX = Math.cos(angle + 0.5) * force * 3;
            const moveY = Math.sin(angle + 0.5) * force * 3;
            
            p.x += moveX;
            p.y += moveY;
            
            // Pulse size when near mouse
            p.size = p.baseSize * (1 + force * 1.5);
          } else {
            p.size += (p.baseSize - p.size) * 0.05;
          }
        } else {
          p.size += (p.baseSize - p.size) * 0.05;
        }

        // Boundary check (wrap around with padding)
        const pad = 50;
        if (p.x < -pad) p.x = width + pad;
        if (p.x > width + pad) p.x = -pad;
        if (p.y < -pad) p.y = height + pad;
        if (p.y > height + pad) p.y = -pad;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        ctx.fillStyle = p.color + (theme === "dark" ? "66" : "99");
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        
        ctx.fill();
        ctx.closePath();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isActive = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isActive = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    // Immediate call to set initial size
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted, theme]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000"
      style={{ 
        width: "100vw", 
        height: "100vh",
      }}
    />
  );
};
