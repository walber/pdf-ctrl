# Merge and Reorganize PDF files

Here is the steps to run pdf-ctrl locally:

### 1. Clone the project
```bash
git clone https://github.com/walber/pdf-ctrl.git
```

### 2. To build
```bash
npm run build
```

### 3. Run the test
```bash
npm run test
```

## Or Simply do this:

Follow the steps to run PDF-Ctrl locally.

### 1. Install pdf-ctrl using *npm* package manager

```bash
npm i pdf-ctrl
```

### 2. Add the following content to *index.html* file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF-Ctrl</title>

    <link rel="stylesheet" href="node_modules/pdf-ctrl/dist/pdf-ctrl.min.css">

    <script type="module" defer>
        import PDFGrid from './node_modules/pdf-ctrl/dist/pdf-ctrl.min.js';

        document.addEventListener('DOMContentLoaded', () => {
            const openButton = document.querySelector('#filePicker');
            const downloadButton = document.querySelector('#download');
            const filePicker = document.createElement('input');
            const grid = new PDFGrid('#main');

            filePicker.accept = 'application/pdf';
            filePicker.multiple = true;
            filePicker.type = 'file';

            filePicker.onchange = () => grid.render(filePicker.files);
            
            downloadButton.onclick = (e) => grid.download();

            openButton.onclick = (e) => filePicker.showPicker();
        });
    </script>

    <style>
        .styled {
            border: 0;
            line-height: 2.5;
            padding: 0 20px;
            font-size: 1rem;
            text-align: center;
            color: white;
            text-shadow: 1px 1px 1px black;
            border-radius: 10px;
            background-color: tomato;
            background-image: linear-gradient(
                to top left,
                rgb(0 0 0 / 20%),
                rgb(0 0 0 / 20%) 30%,
                transparent
            );
            box-shadow:
                inset 2px 2px 3px rgb(255 255 255 / 60%),
                inset -2px -2px 3px rgb(0 0 0 / 60%);
        }

        .styled:hover {
            background-color: red;
        }

        .styled:active {
            box-shadow:
                inset -2px -2px 3px rgb(255 255 255 / 60%),
                inset 2px 2px 3px rgb(0 0 0 / 60%);
        }

        #toolbar {
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <input class="styled" type="button" value="Open" id="filePicker" />
        <input class="styled" type="button" value="Download" id="download" />
    </div>

    <main id="main"></main>

    <footer>
        <p>&copy; 2026. Content Rights Reserved.</p>
    </footer>
</body>
</html>
```

### 3. Startup the http server
```bash
npx http-server --port 3000
``` 

## Here's what you get:

![Demo](assets/demo.gif)