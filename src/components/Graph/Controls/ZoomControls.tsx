import React from 'react';
import { IconButton, Stack } from '@fluentui/react';
import { ZoomInIcon, ZoomOutIcon, ArrowUpRight8Icon, ArrowDownLeft8Icon } from '@fluentui/react-icons';

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onPanUp: () => void;
    onPanDown: () => void;
    onPanLeft: () => void;
    onPanRight: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
    onZoomIn,
    onZoomOut,
    onPanUp,
    onPanDown,
    onPanLeft,
    onPanRight,
}) => {
    return (
        <Stack horizontalAlign="center" verticalAlign="center">
            <Stack.Item>
                <IconButton
                    iconProps={{ iconName: 'ZoomIn' }}
                    title="Zoom In"
                    ariaLabel="Zoom In"
                    onClick={onZoomIn}
                />
            </Stack.Item>
            <Stack.Item>
                <IconButton
                    iconProps={{ iconName: 'ZoomOut' }}
                    title="Zoom Out"
                    ariaLabel="Zoom Out"
                    onClick={onZoomOut}
                />
            </Stack.Item>
            <Stack horizontal>
                <Stack.Item>
                    <IconButton
                        iconProps={{ iconName: 'ArrowUpRight8' }}
                        title="Pan Up"
                        ariaLabel="Pan Up"
                        onClick={onPanUp}
                    />
                </Stack.Item>
                 <Stack.Item>
                    <IconButton
                        iconProps={{ iconName: 'ArrowDownLeft8' }}
                        title="Pan Down"
                        ariaLabel="Pan Down"
                        onClick={onPanDown}
                    />
                </Stack.Item>
                 <Stack.Item>
                    <IconButton
                        iconProps={{ iconName: 'ArrowUpRight8' }}
                        title="Pan Left"
                        ariaLabel="Pan Left"
                        onClick={onPanLeft}
                    />
                </Stack.Item>
                 <Stack.Item>
                    <IconButton
                        iconProps={{ iconName: 'ArrowDownLeft8' }}
                        title="Pan Right"
                        ariaLabel="Pan Right"
                        onClick={onPanRight}
                    />
                </Stack.Item>
            </Stack>
        </Stack>
    );
};

export default ZoomControls;