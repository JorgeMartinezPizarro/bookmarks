import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Typography, Divider, Box, Link } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import BackupIcon from '@mui/icons-material/Backup';
import CloudIcon from '@mui/icons-material/Cloud';
import BitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import MathIcon from '@mui/icons-material/Functions';
import "./styles.css"

const resources = [
  { icon: <GitHubIcon />, text: 'BRAIN Sources', link: 'https://github.com/jorgemartinezpizarro/brain' },
  { icon: <GitHubIcon />, text: 'Custom UI Sources', link: 'https://github.com/jorgemartinezpizarro/bookmarks' },
  { icon: <BackupIcon />, text: 'Backups Docker Registry', link: 'https://hub.docker.com/repository/docker/jorgemartinezpizarro/brain/tags' },
];

const visitors = [
  { icon: <CloudIcon />, text: 'Visitors for cloud.ideniox.com', link: 'https://cloud.ideniox.com/reports/report_cloud.html' },
  { icon: <BitcoinIcon />, text: 'Visitors for bitcoinprivacy.net', link: 'https://cloud.ideniox.com/reports/report_bitcoin.html' },
  { icon: <CloudIcon />, text: 'Visitors for ideniox.com', link: 'https://cloud.ideniox.com/reports/report_ideniox.html' },
  { icon: <MathIcon />, text: 'Visitors for math.ideniox.com', link: 'https://cloud.ideniox.com/reports/report_math.html' },
  { icon: <CloudIcon />, text: 'Visitors for nube.ideniox.com', link: 'https://cloud.ideniox.com/reports/report_nube.html' },
  { icon: <MathIcon />, text: 'Visitors for home.ideniox.com', link: 'https://cloud.ideniox.com/reports/report_home.html' },
];

const ResourcePage = () => {
  return (
    <Box sx={{ color: "white", maxWidth: 600, margin: 'auto', padding: 4 }}>
      {/* Lista de Recursos */}
      <Typography variant="h6" gutterBottom>
        Resources
      </Typography>
      <List>
        {resources.map((item, index) => (
          <ListItem className="item" key={index} component="a" href={item.link} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText style={{color: "white"}} primary={item.text} />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ marginY: 2 }} />

      {/* Lista de Visitantes */}
      <Typography variant="h6" gutterBottom>
        Visitors
      </Typography>
      <List>
        {visitors.map((item, index) => (
          <ListItem className="item" key={index} component="a" href={item.link} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText style={{color: "white"}}  primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ResourcePage;
