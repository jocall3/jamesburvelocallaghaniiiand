import React from 'react';
import {
	Box,
	CircularProgress,
	Typography,
	Tooltip,
	SvgIconProps,
} from '@mui/material';

interface ReportStatusIndicatorProps {
	status: 'inProgress' | 'success' | 'failure';
}

const ReportStatusIndicator: React.FC<ReportStatusIndicatorProps> = ({ status }) => {
	let color: 'primary' | 'success' | 'error' = 'primary';
	let title = 'In Progress';
	let IconComponent: React.ComponentType<SvgIconProps> | null = null;

	switch (status) {
		case 'inProgress':
			color = 'primary';
			title = 'In Progress';
			IconComponent = () => (
				<CircularProgress size={24} sx={{ color: 'primary.main' }} />
			);
			break;
		case 'success':
			color = 'success';
			title = 'Success';
			IconComponent = () => (
				<Box
					component='svg'
					sx={{
						color: 'success.main',
						width: 24,
						height: 24,
						display: 'block',
						fill: 'currentcolor',
					}}
					viewBox='0 0 24 24'
				>
					<path d='M9 16.17L4.83 12l-1.42 1.41L9 16.17l7.75-7.75L16.75 12 9 16.17z' />
				</Box>
			);
			break;
		case 'failure':
			color = 'error';
			title = 'Failure';
			IconComponent = () => (
				<Box
					component='svg'
					sx={{
						color: 'error.main',
						width: 24,
						height: 24,
						display: 'block',
						fill: 'currentcolor',
					}}
					viewBox='0 0 24 24'
				>
					<path d='M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m-1-13h2v4h-2v-4zm0 5h2v3h-2v-3z' />
				</Box>
			);
			break;
		default:
			break;
	}

	return (
		<Tooltip title={title}>
			<Box sx={{ display: 'flex', alignItems: 'center' }}>
				{IconComponent ? (
					<IconComponent />
				) : (
					<Typography variant='caption' color={color}>
						{status}
					</Typography>
				)}
			</Box>
		</Tooltip>
	);
};

export default ReportStatusIndicator;
