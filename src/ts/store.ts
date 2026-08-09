import type { DocumentInitParameters } from "pdfjs-dist/types/src/display/api.js";
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import { PDF } from '@libpdf/core';

let _pdf = PDF.create();
const _dimensions = { width: 595, height: 842 }; // @libpdf/core A4 dimensions (default 72 DPI)

function setDimessions (width: number, height: number) {
    _dimensions.width = width;
    _dimensions.height = height;
}

async function merge (fileList: FileList) {
    const fileListBytes = await Array.fromAsync(fileList, (file) => file.bytes());

    _pdf = await PDF.merge(fileListBytes);

    _pdf.setMetadata({
        producer: 'pdf-ctrl',
        creationDate: new Date(),
    });

    const loadingTask = getDocument({ data: await _pdf.save() } as DocumentInitParameters);
    return loadingTask.promise;
}

async function addNewPage() {
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
    const data = await _pdf.save();

    const loadingTask = getDocument({ data } as DocumentInitParameters);
    return loadingTask.promise;
}

GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

export {
    merge,
    addNewPage,
    setDimessions,
    download,
    getPDF
}