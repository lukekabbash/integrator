import React, { ReactNode } from 'react';
import { 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  useMediaQuery, 
  IconButton,
  Tooltip
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { createAppTheme } from '../theme';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  // We'll always use dark mode with our custom dark gray theme
  const [mode] = React.useState<'light' | 'dark'>('dark');
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout; 