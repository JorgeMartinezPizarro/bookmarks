'use client'

import React, { useState } from 'react';
import { ThemeProvider, Modal, BottomNavigation, Table, TableBody, TableRow, TableCell, TextField, Button } from '@mui/material';
import axios from "axios"

import theme from '../theme';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.post('/api/login', { password });
      if (response.status === 200) {
        window.location.href = '/'
      } else (
        setError("Error during the login process")
      )
    } catch (error) {
      setError(error ? error.toString() : "");
    }
  };

  return (<ThemeProvider theme={theme}>
      <Modal open={true}><>
      <BottomNavigation>
          <Button color="secondary" variant="contained" onClick={handleSubmit}>Login</Button>
        </BottomNavigation>  
        <Table>
          <TableBody>
            <TableRow><TableCell title={error} colSpan={2}>Log in {error && " - " + error}</TableCell></TableRow>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>
                <TextField
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      handleSubmit(event)
                    }
                  }}
                  placeholder="Enter password"
                  required
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
      </></Modal>
  </ThemeProvider>);
};

export default Login;