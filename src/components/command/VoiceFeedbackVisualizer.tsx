import React, { useRef, useEffect, useState, useCallback } from 'react';

// Define the possible states for voice command processing
type VoiceProcessingState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

// Define the props for the VoiceFeedbackVisualizer component
interface VoiceFeedbackVisualizerProps {
  amplitude: number; // A number from 0.0 to 1.0 representing audio loudness
  processingState: VoiceProcessingState; // The current state of voice command processing
  message?: string; // Optional message to display below the visualizer
}

const VoiceFeedbackVisualizer: React.FC<VoiceFeedbackVisualizerProps> = ({
  amplitude,
  processingState,
  message,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const [displayMessage, setDisplayMessage] = useState<string>('');

  // Define colors for different processing states
  const stateColors: Record<VoiceProcessingState, string> = {
    idle: '#9E9E9E', // Grey
    listening: '#4CAF50', // Green
    processing: '#2196F3', // Blue
    success: '#8BC34A', // Light Green
    error: '#F44336', // Red
  };

  // Update the displayed message based on prop or default states
  useEffect(() => {
    if (message !== undefined && message !== null) {
      setDisplayMessage(message);
    } else {
      switch (processingState) {
        case 'idle':
          setDisplayMessage('Tap to speak');
          break;
        case 'listening':
          setDisplayMessage('Listening...');
          break;
        case 'processing':
          setDisplayMessage('Processing...');
          break;
        case 'success':
          setDisplayMessage('Success!');
          break;
        case 'error':
          setDisplayMessage('Something went wrong. Please try again.');
          break;
        default:
          setDisplayMessage('');
      }
    }
  }, [message, processingState]);

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size to match its parent container
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    } else {
      // Fallback if parent is not found, prevent errors
      canvas.width = 300;
      canvas.height = 150;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const DAMPING_FACTOR = 0.93; // How quickly the visualizer decays
    const BASE_RADIUS = 20; // Minimum radius of the central pulse
    const MAX_AMPLITUDE_RADIUS_INCREASE = 40; // Max increase in radius due to amplitude
    const WAVE_MAX_AGE = 60; // How many frames a wave lasts
    const WAVE_INITIAL_THICKNESS = 3;
    const WAVE_SPEED = 1.5;

    let currentVisualAmplitude = 0;
    const waves: { radius: number; alpha: number; age: number }[] = [];
    let lastWaveAddFrame = 0;

    const render = (currentTime: DOMHighResTimeStamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smoothly update visual amplitude based on actual amplitude and processing state
      if (processingState === 'listening') {
        currentVisualAmplitude = amplitude;
      } else {
        currentVisualAmplitude *= DAMPING_FACTOR;
        if (currentVisualAmplitude < 0.01) {
          currentVisualAmplitude = 0; // Stop drawing if too small
        }
      }

      const baseColor = stateColors[processingState];
      const [r, g, b] = [
        parseInt(baseColor.slice(1, 3), 16),
        parseInt(baseColor.slice(3, 5), 16),
        parseInt(baseColor.slice(5, 7), 16),
      ];

      // Draw central pulsating circle
      const pulseRadius = BASE_RADIUS + currentVisualAmplitude * MAX_AMPLITUDE_RADIUS_INCREASE;
      if (pulseRadius > BASE_RADIUS) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`; // Semi-transparent fill
        ctx.fill();
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Generate new waves if listening and amplitude is high enough
      const frameDiff = currentTime - lastWaveAddFrame;
      if (
        processingState === 'listening' &&
        currentVisualAmplitude > 0.1 &&
        frameDiff > (300 - currentVisualAmplitude * 200) // Faster waves for higher amplitude
      ) {
        waves.push({ radius: pulseRadius, alpha: 1, age: 0 });
        lastWaveAddFrame = currentTime;
      }

      // Update and draw existing waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i];
        wave.age++;
        wave.radius += WAVE_SPEED * (1 + currentVisualAmplitude); // Waves speed up with amplitude
        wave.alpha = 1 - wave.age / WAVE_MAX_AGE; // Fade out over time

        if (wave.alpha <= 0) {
          waves.splice(i, 1); // Remove fully faded waves
          continue;
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${wave.alpha})`;
        ctx.lineWidth = WAVE_INITIAL_THICKNESS * wave.alpha; // Thinner as it fades
        ctx.stroke();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    // Start the animation loop
    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      // Cleanup: Cancel animation frame when component unmounts or effect re-runs
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [amplitude, processingState, stateColors]); // Dependencies for drawVisualizer

  useEffect(() => {
    return drawVisualizer(); // Calls the memoized drawVisualizer function
  }, [drawVisualizer]);


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: '120px', // Ensure component has a minimum size
        position: 'relative',
        overflow: 'hidden', // Hide overflow from waves
        fontFamily: 'sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: processingState === 'error' ? stateColors.error : (processingState === 'success' ? stateColors.success : '#424242'), // Dark grey for general text
          fontSize: '1.2em',
          fontWeight: 'bold',
          padding: '10px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)', // Slightly transparent background for readability
          borderRadius: '8px',
          backdropFilter: 'blur(3px)', // Optional: blur background for modern look
        }}
      >
        {displayMessage}
      </div>
    </div>
  );
};

export default VoiceFeedbackVisualizer;