```tsx
import React, { useRef, useEffect } from 'react';
import { ChartData, ChartOptions } from './chartTypes';

interface InteractiveChartProps {
    data: ChartData[];
    options: ChartOptions;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({ data, options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isDragging = false;
        let dragStartX = 0;
        let viewportStart = 0;

        const renderChart = () => {
            if (!ctx || !canvas) return;

            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Example: Drawing a simple line chart
            ctx.beginPath();
            ctx.strokeStyle = options.lineColor || 'blue';
            ctx.lineWidth = options.lineWidth || 2;

            const dataLength = data.length;
            if (dataLength === 0) return;
            const visibleData = data.slice(viewportStart, viewportStart + options.visibleRange);
            const visibleDataLength = visibleData.length;
            
            if (visibleDataLength === 0) return;


            const xIncrement = width / (visibleDataLength - 1);
            const yMax = Math.max(...visibleData.map(d => d.value));
            const yMin = Math.min(...visibleData.map(d => d.value));

            if (yMax === yMin) return; //Prevent division by zero


            for (let i = 0; i < visibleDataLength; i++) {
                const x = i * xIncrement;
                const y = height - ((visibleData[i].value - yMin) / (yMax - yMin)) * height;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        };

        const handleMouseDown = (e: MouseEvent) => {
            isDragging = true;
            dragStartX = e.clientX;
        };

        const handleMouseUp = () => {
            isDragging = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !canvas) return;

            const dragDistance = e.clientX - dragStartX;
            const sensitivity = options.dragSensitivity || 1; // Adjust sensitivity as needed
            const viewportChange = -dragDistance * sensitivity;


            viewportStart = Math.max(0, Math.min(data.length - (options.visibleRange || 50), viewportStart + viewportChange));
            dragStartX = e.clientX;

            animationFrameId.current = requestAnimationFrame(renderChart);
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const zoomSensitivity = options.zoomSensitivity || 0.1; // Adjust zoom sensitivity as needed

            const zoomDirection = e.deltaY > 0 ? -1 : 1;
            const zoomAmount = zoomDirection * zoomSensitivity;

            options.visibleRange = Math.max(10, Math.min(data.length, (options.visibleRange || 50) + zoomAmount));

             animationFrameId.current = requestAnimationFrame(renderChart);
        };

        if (canvas) {
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('wheel', handleWheel, { passive: false });

           animationFrameId.current = requestAnimationFrame(renderChart);
        }


        return () => {
            if (canvas) {
                canvas.removeEventListener('mousedown', handleMouseDown);
                canvas.removeEventListener('mouseup', handleMouseUp);
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('wheel', handleWheel);
            }
             cancelAnimationFrame(animationFrameId.current);
        };
    }, [data, options]);

    return (
        <canvas
            ref={canvasRef}
            width={options.width || 800}
            height={options.height || 400}
            style={{ cursor: 'grab', ...options.style }}
        />
    );
};

export default InteractiveChart;
```