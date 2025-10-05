import { useEffect, useRef } from 'react';

interface TrajectoryVisualizationProps {
  deflectionDistance: number;
  willImpact: boolean;
}

export default function TrajectoryVisualization({
  deflectionDistance,
  willImpact
}: TrajectoryVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const earthRadius = 40;
    const scale = 0.02;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, earthRadius);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(0.7, '#2563eb');
    gradient.addColorStop(1, '#1e40af');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius + 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const startX = -200;
    const startY = -300;
    const endX = centerX + (deflectionDistance * scale);
    const endY = centerY;

    const controlX1 = startX + 150;
    const controlY1 = startY;
    const controlX2 = endX - 100;
    const controlY2 = endY - 100;

    ctx.strokeStyle = willImpact ? '#ef4444' : '#10b981';
    ctx.lineWidth = 3;
    ctx.shadowColor = willImpact ? '#ef4444' : '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const numDots = 20;
    for (let i = 0; i <= numDots; i++) {
      const t = i / numDots;
      const x = Math.pow(1 - t, 3) * startX +
                3 * Math.pow(1 - t, 2) * t * controlX1 +
                3 * (1 - t) * Math.pow(t, 2) * controlX2 +
                Math.pow(t, 3) * endX;
      const y = Math.pow(1 - t, 3) * startY +
                3 * Math.pow(1 - t, 2) * t * controlY1 +
                3 * (1 - t) * Math.pow(t, 2) * controlY2 +
                Math.pow(t, 3) * endY;

      ctx.fillStyle = willImpact ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const asteroidSize = 8;
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(endX, endY, asteroidSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EARTH', centerX, centerY + earthRadius + 35);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('BENNU', endX, endY - 20);

    const distance = Math.abs(deflectionDistance);
    ctx.fillStyle = willImpact ? '#ef4444' : '#10b981';
    ctx.font = '14px sans-serif';
    const distanceText = willImpact
      ? `IMPACT! ${distance.toFixed(0)} km from center`
      : `SAFE: ${distance.toFixed(0)} km miss distance`;
    ctx.fillText(distanceText, centerX, height - 20);

  }, [deflectionDistance, willImpact]);

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4">Trajectory Visualization</h3>
      <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="max-w-full"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-900 p-3 rounded">
          <div className="text-slate-400 mb-1">Status</div>
          <div className={`font-bold ${willImpact ? 'text-red-400' : 'text-green-400'}`}>
            {willImpact ? 'COLLISION COURSE' : 'SAFE TRAJECTORY'}
          </div>
        </div>
        <div className="bg-slate-900 p-3 rounded">
          <div className="text-slate-400 mb-1">Miss Distance</div>
          <div className="font-bold text-blue-400">
            {Math.abs(deflectionDistance).toFixed(0)} km
          </div>
        </div>
      </div>
    </div>
  );
}
