import type { DocumentInitParameters, PDFDocumentProxy } from "pdfjs-dist/types/src/display/api.js";
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import { PDF } from '@libpdf/core';

let _pdf: PDF | null = null;
const _dimensions = { width: 595, height: 842 }; // @libpdf/core A4 dimensions (default 72 DPI)

function setDimessions (width: number, height: number) {
    _dimensions.width = width;
    _dimensions.height = height;
}

async function merge (fileList: FileList) {
    const documentsBytes = await Array.fromAsync(fileList, (file) => file.bytes());
    _pdf = await PDF.merge(documentsBytes);

    const loadingTask = getDocument({ data: await _pdf.save() } as DocumentInitParameters);
    return loadingTask.promise;
}

async function deletePage (pageIndex: number) {
    if (_pdf == null) {
        return;
    }

    _pdf.removePage(pageIndex);

    const loadingTask = getDocument({ data: await _pdf.save() } as DocumentInitParameters);
    return loadingTask.promise;
}

async function addNewPage() {
    if (_pdf == null) {
        _pdf = PDF.create();
    }

    _pdf.addPage(_dimensions);

    const loadingTask = getDocument({ data: await _pdf.save() } as DocumentInitParameters);
    return loadingTask.promise;
}

async function download (pageIndexes: number[]) {
    const finalDoc = await (_pdf == null ? PDF.create() : _pdf.extractPages(pageIndexes));
    const data = await finalDoc.save();

    saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'newDoc.pdf');
}

async function getPDF () {
    const data = _pdf == null ? [] : await _pdf.save();

    const loadingTask = getDocument({ data } as DocumentInitParameters);
    return loadingTask.promise;
}

GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

export {
    merge,
    addNewPage,
    deletePage,
    setDimessions,
    download,
    getPDF
}