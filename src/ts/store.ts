import type { DocumentInitParameters } from "pdfjs-dist/types/src/display/api.js";
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import { PDF } from '@libpdf/core';

let files: FileList = { length: 0 } as FileList

async function merge (fileList: FileList) {
    const documentsBytes = await Array.fromAsync(fileList, (file) => file.bytes());
    const mergedPDF = await PDF.merge(documentsBytes);
    const bytes = await mergedPDF.save();

    files = fileList;

    const loadingTask = getDocument({ data: bytes } as DocumentInitParameters);
    return loadingTask.promise;
}

async function downloadFinalDoc(pageIndexes: number[]) {
    const documentsBytes = await Array.fromAsync(files, (file) => file.bytes());
    const mergedPDF = await PDF.merge(documentsBytes);
    const finalDoc = await mergedPDF.extractPages(pageIndexes);
    const data = await finalDoc.save();

    saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'newDoc.pdf');
}

GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

export {
    merge,
    downloadFinalDoc,
}