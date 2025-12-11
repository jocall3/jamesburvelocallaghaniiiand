```typescript
import { useContext, useEffect, useState } from 'react';
import { IdentityContext } from '../contexts/IdentityContext';
import { useSpeechRecognition } from './useSpeechRecognition';

export const useVoiceIdentityControl = () => {
    const { identity, dispatch } = useContext(IdentityContext);
    const { transcript, listening, startListening, stopListening, error } = useSpeechRecognition();
    const [command, setCommand] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (transcript) {
            const lowerCaseTranscript = transcript.toLowerCase();
            
            if (lowerCaseTranscript.includes("set display name")) {
                const displayNameMatch = lowerCaseTranscript.match(/to (.*)/);
                if (displayNameMatch && displayNameMatch[1]) {
                    setCommand("SET_DISPLAY_NAME");
                    setCommandData(displayNameMatch[1].trim());
                }
            } else if (lowerCaseTranscript.includes("set app id")) {
                const appIdMatch = lowerCaseTranscript.match(/to (.*)/);
                if (appIdMatch && appIdMatch[1]) {
                    setCommand("SET_APP_ID");
                    setCommandData(appIdMatch[1].trim());
                }
            } else if (lowerCaseTranscript.includes("enable account")) {
                setCommand("SET_ACCOUNT_ENABLED");
                setCommandData(true);
            } else if (lowerCaseTranscript.includes("disable account")) {
                setCommand("SET_ACCOUNT_ENABLED");
                setCommandData(false);
            } else if (lowerCaseTranscript.includes("set application type")) {
                const appTypeMatch = lowerCaseTranscript.match(/to (.*)/);
                if (appTypeMatch && appTypeMatch[1]) {
                    setCommand("SET_APPLICATION_TYPE");
                    setCommandData(appTypeMatch[1].trim());
                }
            } else if (lowerCaseTranscript.includes("set application visibility")) {
                const visibilityMatch = lowerCaseTranscript.match(/(visible|hidden)/);
                if (visibilityMatch && visibilityMatch[1]) {
                    setCommand("SET_APPLICATION_VISIBILITY");
                    setCommandData(visibilityMatch[1].trim() === "visible");
                }
            } else if (lowerCaseTranscript.includes("set assignment required")) {
                const assignmentMatch = lowerCaseTranscript.match(/(required|not required)/);
                if (assignmentMatch && assignmentMatch[1]) {
                    setCommand("SET_ASSIGNMENT_REQUIRED");
                    setCommandData(assignmentMatch[1].trim() === "required");
                }
            } else if (lowerCaseTranscript.includes("set is app proxy")) {
                const appProxyMatch = lowerCaseTranscript.match(/(yes|no)/);
                if (appProxyMatch && appProxyMatch[1]) {
                    setCommand("SET_IS_APP_PROXY");
                    setCommandData(appProxyMatch[1].trim() === "yes");
                }
            } else if (lowerCaseTranscript.includes("set id")) {
                    const idMatch = lowerCaseTranscript.match(/to (.*)/);
                    if (idMatch && idMatch[1]) {
                        setCommand("SET_ID");
                        setCommandData(idMatch[1].trim());
                    }
                }
        }
    }, [transcript]);

    useEffect(() => {
        if (command) {
            setIsLoading(true);
            let commandData: any = null;
            switch (command) {
                case "SET_DISPLAY_NAME":
                    commandData = getCommandData();
                    if(commandData !== null) {
                        dispatch({ type: 'SET_DISPLAY_NAME', payload: commandData });
                    }
                    break;
                case "SET_APP_ID":
                    commandData = getCommandData();
                    if(commandData !== null) {
                        dispatch({ type: 'SET_APP_ID', payload: commandData });
                    }
                    break;
                case "SET_ACCOUNT_ENABLED":
                    commandData = getCommandData();
                    if(commandData !== null) {
                        dispatch({ type: 'SET_ACCOUNT_ENABLED', payload: commandData });
                    }
                    break;
                case "SET_APPLICATION_TYPE":
                    commandData = getCommandData();
                    if(commandData !== null) {
                        dispatch({ type: 'SET_APPLICATION_TYPE', payload: commandData });
                    }
                    break;
                case "SET_APPLICATION_VISIBILITY":
                    commandData = getCommandData();
                    if(commandData !== null) {
                        dispatch({ type: 'SET_APPLICATION_VISIBILITY', payload: commandData });
                    }
                    break;
                case "SET_ASSIGNMENT_REQUIRED":
                    commandData = getCommandData();
                    if(commandData !== null) {
                        dispatch({ type: 'SET_ASSIGNMENT_REQUIRED', payload: commandData });
                    }
                    break;
                case "SET_IS_APP_PROXY":
                    commandData = getCommandData();
                    if(commandData !== null) {
                        dispatch({ type: 'SET_IS_APP_PROXY', payload: commandData });
                    }
                    break;
                case "SET_ID":
                    commandData = getCommandData();
                    if (commandData !== null) {
                        dispatch({type: 'SET_ID', payload: commandData})
                    }
                    break;
                default:
                    console.warn(`Unknown command: ${command}`);
            }
            setCommand(null);
            setIsLoading(false);
            stopListening();
        }
    }, [command, dispatch, stopListening, getCommandData]);

    const [commandData, setCommandData] = useState<any>(null);

    const getCommandData = () => {
        const data = commandData;
        setCommandData(null);
        return data;
    }

    const activateVoiceControl = () => {
        startListening();
    };

    return {
        activateVoiceControl,
        listening,
        isLoading,
        error,
        identity,
    };
};
```