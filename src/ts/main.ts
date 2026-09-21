import PDFGrid from '@ts/render';
import * as store from './store';
import '@styles/app.css';

let _grid: PDFGrid;

async function addNewPage() {
    const pdf = await store.addNewPage();
    const lastPageNum = pdf.numPages;
    const pagePromise = pdf.getPage(lastPageNum);

    return _grid.renderPage(pagePromise);
}

function download () {
    const pageIndexes = _grid.pageIndexes();
    return store.download(pageIndexes);
}

async function load (el: string, files: FileList) {
    const pdf = await store.merge(files);
    _grid = new PDFGrid(el);

    return _grid.load(pdf);
}

async function refresh () {
    const pdf = await store.getPDF();
    return _grid.load(pdf);
}

function removePages () {
    const removedPages = _grid.removePages();
    console.log(`Removed pages: ${removedPages}`);
}

function toggleDeleteMode () {
    _grid.toggleDeleteMode();
}

export {
    addNewPage,
    load,
    download,
    refresh,
    removePages,
    toggleDeleteMode
}