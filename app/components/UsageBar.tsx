// components/UsageBar.tsx
import React from 'react';
import { Box, Typography, LinearProgress, linearProgressClasses } from '@mui/material';
import { styled } from '@mui/material/styles';

interface UsageBarProps {
  label: string;
  value: number;
}

const getColor = (value: number): string => {
  if (value < 50) return '#4caf50'; // verde
  if (value < 80) return '#ff9800'; // amarillo
  return '#f44336'; // rojo
};

export const UsageBar: React.FC<UsageBarProps> = ({ label, value }) => {
  const color = getColor(value);

  const ColoredLinearProgress = styled(LinearProgress)(() => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: '#eee',
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: color,
    },
  }));

  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">{`${value}%`}</Typography>
      </Box>
      <ColoredLinearProgress variant="determinate" value={value} />
    </Box>
  );
};
