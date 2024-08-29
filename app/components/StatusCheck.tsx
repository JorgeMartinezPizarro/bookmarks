'use client'


import { useState, useEffect, useCallback } from 'react';

import { Button, CircularProgress } from '@mui/material';
import { HealthCheckResult } from '../types';
import CheckIcon from '@mui/icons-material/Check';

const StatusCheck = ({urls}: {urls: string[]}) => {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const checkHealth = useCallback(async () => {
    
      setLoading(true)

      try {        
        
        const checkUrls = await Promise.all(
          urls.map(async (url) => {
            try {
              const res = await fetch('/api/status?check=' + encodeURIComponent(url), {
                method: 'GET',
              })
        
              return { url, status: res.status };
            
            } catch (error) {
              return { url, status: 500 };
            }
          })
        );

        setResults(checkUrls);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    }
  , [])

  useEffect(() => {
    checkHealth();
  }, [urls, checkHealth]);

  const percentUp = Math.round(100 * results.filter(result => result.status === 200).length / results.length)

  const title = 
    "Checked the services \n"
      + results
        .map(result => "\n - The service " + result.url + (result.status === 200 ? " is fine" : " is DOWN") + "" )
        .join("") 
      + "\n ."

  return <Button title={title} color={(loading || !urls || percentUp !== 100) ? "primary" : "secondary"} variant="contained" onClick={() => checkHealth()}>
    {loading || urls.length === 0 || isNaN(percentUp) 
      ? <CircularProgress color="secondary" size="12px" />
      : <CheckIcon accentHeight={8} color="primary" />
    }
  </Button>
}

export default StatusCheck;