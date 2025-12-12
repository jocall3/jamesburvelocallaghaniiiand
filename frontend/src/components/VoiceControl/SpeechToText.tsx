import React, { useState, useEffect, useCallback } from 'react';
import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

interface SpeechToTextProps {
    onTranscript: (transcript: string) => void;
    onError: (error: string) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onTranscript, onError }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const transcriptSubject = new Subject<string>();

    const handleTranscript = useCallback((transcript: string) => {
        onTranscript(transcript);
    }, [onTranscript]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const newRecognition = new webkitSpeechRecognition();
            newRecognition.continuous = false;
            newRecognition.interimResults = false;
            newRecognition.lang = 'en-US';

            newRecognition.onstart = () => {
                setIsListening(true);
            };

            newRecognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0])
                    .map((result) => result.transcript)
                    .join('');

                transcriptSubject.next(transcript);
            };

            newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                setIsListening(false);
                onError(`Speech recognition error: ${event.error}`);
            };

            newRecognition.onend = () => {
                setIsListening(false);
            };

            setRecognition(newRecognition);
        } else {
            onError('Speech recognition is not supported in this browser.');
        }

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, [onError, recognition]);

    useEffect(() => {
        const subscription = transcriptSubject.pipe(throttleTime(500)).subscribe(transcript => {
            handleTranscript(transcript);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [handleTranscript, transcriptSubject]);

    const startListening = () => {
        if (recognition && !isListening) {
            try {
                recognition.start();
            } catch (error: any) {
                onError(`Error starting speech recognition: ${error.message}`);
            }
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
        }
    };

    return (
        <div>
            <button onClick={startListening} disabled={isListening}>
                Start Listening
            </button>
            <button onClick={stopListening} disabled={!isListening}>
                Stop Listening
            </button>
        </div>
    );
};

export default SpeechToText;