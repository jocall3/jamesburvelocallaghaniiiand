```tsx
import React, { useState, useEffect, useRef } from 'react';
import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';

interface ScenarioTimelineProps {
    duration: number; // Total duration of the scenario in steps (e.g., months)
    currentStep: number;
    onStepChange: (step: number) => void;
}

const StyledSlider = styled(Slider)(({ theme }) => ({
    color: theme.palette.primary.main,
    height: 4,
    '& .MuiSlider-thumb': {
        height: 12,
        width: 12,
        backgroundColor: '#fff',
        border: '2px solid currentColor',
        '&:focus, &:hover, &.Mui-active': {
            boxShadow: '0 3px 6px rgba(0,0,0,0.12)',
        },
    },
    '& .MuiSlider-rail': {
        color: theme.palette.grey[300],
        height: 4,
    },
    '& .MuiSlider-track': {
        height: 4,
    },
}));

const ScenarioTimeline: React.FC<ScenarioTimelineProps> = ({ duration, currentStep, onStepChange }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [internalStep, setInternalStep] = useState(currentStep); // Use internal state for the running animation
    const animationRef = useRef<number | null>(null);
    const animationSpeed = 500; // milliseconds per step

    useEffect(() => {
      setInternalStep(currentStep); // Keep internal step in sync with external prop
    }, [currentStep]);

    useEffect(() => {
        if (isRunning) {
            animationRef.current = requestAnimationFrame(animateStep);
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRunning]);

    const animateStep = () => {
        if (internalStep < duration) {
            setInternalStep((prevStep) => prevStep + 1);
            onStepChange(internalStep + 1); // Notify parent of the new step
            animationRef.current = requestAnimationFrame(animateStep);
        } else {
            setIsRunning(false); // Stop when reaching the end
        }
    };

    useEffect(() => {
        if (isRunning) {
            const timeoutId = setTimeout(() => {
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
              }
              if (internalStep < duration) {
                animationRef.current = requestAnimationFrame(animateStep);
              } else {
                setIsRunning(false);
              }
            }, animationSpeed)

            return () => clearTimeout(timeoutId);
        }
    }, [internalStep, isRunning, duration, onStepChange]);


    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        const step = Number(newValue);
        setInternalStep(step);
        onStepChange(step);
    };

    const handlePlayPauseClick = () => {
        setIsRunning((prevIsRunning) => !prevIsRunning);
    };

    const handleSkipNext = () => {
        if (internalStep < duration) {
            const nextStep = Math.min(internalStep + 1, duration);
            setInternalStep(nextStep);
            onStepChange(nextStep);
        }
    };

    const handleSkipPrevious = () => {
        if (internalStep > 0) {
            const prevStep = Math.max(internalStep - 1, 0);
            setInternalStep(prevStep);
            onStepChange(prevStep);
        }
    };

    return (
        <Box sx={{ width: '100%', mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography id="timeline-slider" gutterBottom>
                Scenario Timeline (Step: {internalStep} / {duration})
            </Typography>
            <Box sx={{ width: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton aria-label="previous" onClick={handleSkipPrevious} disabled={internalStep === 0}>
                    <SkipPreviousIcon />
                </IconButton>
                <IconButton aria-label={isRunning ? 'pause' : 'play'} onClick={handlePlayPauseClick}>
                    {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton aria-label="next" onClick={handleSkipNext} disabled={internalStep === duration}>
                    <SkipNextIcon />
                </IconButton>
            </Box>

            <Box sx={{ width: '90%', mt: 1 }}>
                <StyledSlider
                    value={internalStep}
                    onChange={handleSliderChange}
                    max={duration}
                    aria-labelledby="timeline-slider"
                    disabled={isRunning}
                />
            </Box>
        </Box>
    );
};

export default ScenarioTimeline;
```