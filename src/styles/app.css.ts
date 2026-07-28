import { globalStyle } from '@vanilla-extract/css';

globalStyle(':where(.pdfier-page)', {
  'cursor': 'move',
  'padding': '0',
  'color': 'white',
  'lineHeight': '5',
  'textAlign': 'center',
  'boxSizing': 'border-box',
  'outline': '2px solid #c0c0c0',
});

globalStyle(':where(.pdfier-page:hover)', {
  'borderColor': 'rgb(96 165 250 / 60%)',
  'boxShadow': '0 15px 35px rgb(0 0 0 / 60%), 0 0 0 3px rgb(59 130 246 / 25%)',
});

globalStyle(':where(.pdfier-page:active)', {
  'cursor': 'grabbing',
});

globalStyle(':where(.pdfier-page.dragging)', {
  'opacity': '0.4',
  'background': '#c0c0c0',
});

globalStyle(':where(.animated-move)', {
  'transition': 'transform 0.25s ease-in-out',
});

globalStyle(':where(.pdfier-page-grid)', {
  'gap': '16px',
  'margin': '0',
  'padding': '0',
  'display': 'flex',
  'listStyle': 'none',
  'flexFlow': 'row wrap',
  'justifyContent': 'flex-start',
  'fontFamily': 'Roboto, sans-serif',
});