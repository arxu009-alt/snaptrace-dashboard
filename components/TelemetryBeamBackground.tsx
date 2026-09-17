'use client';

import React, { useEffect, useRef } from 'react';

interface Beam {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
  color: string;
}

export default function TelemetryBeamBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette matching SnapTrace brand (Snap Yellow, Emerald, Cyan, Violet)
    const colors = [
      '#FACC15', // Snap Yellow
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#38BDF8', // Cyan
      '#A855F7', // Purple
    ];

    const beamCount = 38;
    const beams: Beam[] = [];

    const createBeam = (): Beam => ({
      x: Math.random() * (width + 300) - 150,
      y: Math.random() * -height,
      length: Math.random() * 120 + 60,
      speed: Math.random() * 2.8 + 1.8,
      opacity: Math.random() * 0.7 + 0.25,
      width: Math.random() * 1.6 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    for (let i = 0; i < beamCount; i++) {
      const b = createBeam();
      b.y = Math.random() * height; // Spread across canvas initially
      beams.push(b);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw each falling telemetry beam at a diagonal angle
      beams.forEach((beam) => {
        // Move diagonally (down and left/right trajectory)
        beam.y += beam.speed;
        beam.x -= beam.speed * 0.65; // Diagonal velocity

        // Reset beam when off-screen
        if (beam.y > height + beam.length || beam.x < -200) {
          beam.y = -beam.length - Math.random() * 100;
          beam.x = Math.random() * (width + 200);
          beam.speed = Math.random() * 2.8 + 1.8;
          beam.opacity = Math.random() * 0.7 + 0.25;
        }

        // Draw glowing light tail gradient
        const startX = beam.x;
        const startY = beam.y;
        const endX = beam.x + beam.length * 0.65;
        const endY = beam.y - beam.length;

        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, beam.color);
        gradient.addColorStop(0.3, beam.color);
        gradient.addColorStop(1, 'transparent');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = beam.width;
        ctx.lineCap = 'round';
        ctx.globalAlpha = beam.opacity;
        ctx.shadowBlur = 12;
        ctx.shadowColor = beam.color;
        ctx.stroke();

        // Bright leading spark particle head
        ctx.beginPath();
        ctx.arc(startX, startY, beam.width * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = Math.min(beam.opacity + 0.3, 1);
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#FFFFFF';
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 60fps Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block opacity-60" />
      
      {/* Soft Vignette Mask (Keeps text completely legible) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070E]/30 via-transparent to-[#05070E] pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#05070E]/40 to-[#05070E] pointer-events-none" />
    </div>
  );
}