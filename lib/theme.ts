import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb", // brand-600 blue
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#64748b", // slate-500
    },
    background: {
      default: "#f8fafc",
    },
  },
  typography: {
    fontFamily: "inherit",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
        },
      },
    },
  },
});

export default theme;
