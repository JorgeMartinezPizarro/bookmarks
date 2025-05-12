import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Typography, Divider, Box } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import BackupIcon from '@mui/icons-material/Backup';

import "./styles.css"
import MainMenu from '@/app/components/MainMenu';

const resources = [
  { icon: <GitHubIcon />, text: 'BRAIN Sources', link: 'https://github.com/jorgemartinezpizarro/brain' },
  { icon: <GitHubIcon />, text: 'Custom UI Sources', link: 'https://github.com/jorgemartinezpizarro/bookmarks' },
  { icon: <BackupIcon />, text: 'Backups Docker Registry', link: 'https://hub.docker.com/repository/docker/jorgemartinezpizarro/brain/tags' },
];

const ResourcePage = () => {
  return (
    <div style={{height: "100%", display: "flex", justifyContent: "center"}}>
    <Box className="intro" sx={{ color: "white", maxWidth: 600, margin: 'auto', padding: 4 }}>
      {/* Lista de Recursos */}
      <MainMenu />
      <Typography variant="h6" gutterBottom>
        Resources
      </Typography>
      <List>
        {resources.map((item, index) => (
          <ListItem className="item" key={index} component="a" href={item.link} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText style={{color: "white", fontSize: "32pt"}} primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ marginY: 2 }} />
    </Box></div>
  );
};

export default ResourcePage;
