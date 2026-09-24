import { createTheme } from '@mui/material/styles'

/**
 * Material Design con los colores del AMPA, sacados de los píxeles del logo
 * (assets/logo-ampa.png), no a ojo.
 *
 * Se usa Material porque es la interfaz que la gente ya conoce de Android y de
 * las aplicaciones de Google: el botón redondo de acción, las tarjetas, los
 * avisos de colores. Nadie tiene que aprender nada nuevo.
 *
 * Es el único tema de la suite: toda aplicación del AMPA tiene que parecer la
 * misma casa. Si una necesita un color nuevo, se añade aquí y lo tienen todas.
 */
export const BRAND_RED = '#E22333'
export const BRAND_NAVY = '#424C76'

export const theme = createTheme({
  palette: {
    // Blanco sobre este rojo da un contraste de 4,6:1: pasa el mínimo WCAG AA (4,5).
    primary: { main: BRAND_RED },
    secondary: { main: BRAND_NAVY },
    background: { default: '#F5F5F7', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    // Material 3 ya no pone los botones en mayúsculas.
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Reserva siempre el hueco de la barra de desplazamiento: así la página
        // no salta de lado al abrir un desplegable o al cambiar a una pantalla
        // más larga. Venía del index.css de facturación.
        html: { scrollbarGutter: 'stable' },
      },
    },
    // Tarjetas con borde fino en vez de sombra: más limpio, estilo Material 3.
    MuiCard: {
      defaultProps: { variant: 'outlined' },
    },
  },
})
