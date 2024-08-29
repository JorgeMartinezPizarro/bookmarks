import { createTheme } from '@mui/material/styles';

export const PRIMARY = '#fff'
export const PRIMARY_LIGHT = '#71a569'
export const PRIMARY_DARK = '#71a569'
export const PRIMARY_TEXT = "#fff"
export const PRIMARY_CONTRAST = '#000'

export const SECONDARY = '#215519'
export const SECONDARY_LIGHT = '#71a569'
export const SECONDARY_DARK = '#71a569'
export const SECONDARY_TEXT = "#fff"
export const SECONDARY_CONTRAST = "#fff"

const theme = createTheme({
    palette: {
        text: {
            primary: PRIMARY_TEXT,
            secondary: SECONDARY_TEXT,
        },
        primary: {
            main: PRIMARY,
            light: PRIMARY_LIGHT,
            dark: PRIMARY_DARK,
            contrastText: PRIMARY_CONTRAST,
        },
        secondary: {
            main: SECONDARY,
            light: SECONDARY_LIGHT,
            dark: SECONDARY_DARK,
            contrastText: SECONDARY_CONTRAST,
        },
    },
    components: {
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            position: "fixed",
            textAlign: "center", 
            alignItems: "center",
            bottom: 0,
            left: "auto",
            background: SECONDARY,
            width: "100%",
            maxWidth: "700px",
            height: "80px",
            margin: 0,
            padding: 0,
            
          }
        }
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            height: "calc(100%)",
            width: "100%",
            maxWidth: "700px",
            textAlign: 'center',
            background: PRIMARY
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            width: "90%",
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            maxWidth: "700px",
            width: "100%"
          }
        }

      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            whiteSpace: "nowrap",
            color: SECONDARY_TEXT,
            background: SECONDARY,
            cursor: "pointer"
          },
        },
        
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            width: "100%",
            borderColor: SECONDARY,
            borderRadius: "12px",
            color: SECONDARY_TEXT
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            background: SECONDARY,
            color: SECONDARY_TEXT,
            width: "100%",
            borderRadius: "12px"
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            boxShadow: "16",
            padding: "2px",
            borderRadius: "50px",
            
          }
        },
        
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            width: "90%",
            
          },
        },
      },
      MuiModal: {
        styleOverrides: {
          root: {
            height: "calc(100% - 80px)",
            width: "100%",
            opacity: 1,
            overflow: "scroll",
            maxWidth: "700px",
            margin: "0 auto",
            background: SECONDARY
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            marginTop: "4px"
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            padding: "2px!important",
            textAlign: "left",
            maxWidth: "700px!important",
            margin: "0 auto",
            width: "100%!important"
            
          }
        }        
      },
      MuiButton: {
        styleOverrides: {
          root: {
            height: "72px",
            padding: "2px",
            margin: "2px",
          },
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            margin: "0 auto",
            wdith: "100%",
            background: "#fff!important",
            opacity: 1,
            maxWidth: "700px",
            alignItems: "center",
            textAlign: "center",
          }
        }
      }
    },
  });

export default theme;  