import type { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/src/display/api.js";

const CHECKBOX_PROPS = {
    x: 10,
    y: 10,
    width: 25,
    height: 25
};

const THUMB_SCALE = 0.4;

class PageThumb extends HTMLCanvasElement {

    #thumbImageURL: string;

    readonly renderPromise: Promise<void>;

    constructor (page: PDFPageProxy) {
        super();

        this.draggable = true;
        this.classList = 'pdfier-page';

        const viewport = page.getViewport({ scale: THUMB_SCALE });
        const ctx = this.getContext('2d');

        this.width = viewport.width;
        this.height = viewport.height;
        this.#thumbImageURL = this.toDataURL();

        this.dataset.pageNum = `${page.pageNumber}`;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        const renderTask = page.render(renderContext as RenderParameters);

        this.renderPromise = renderTask.promise.finally(() => {
            this.#thumbImageURL = this.toDataURL();
        });
    }

    showCheckbox() {
        document.startViewTransition(() => {
            const ctx = this.getContext('2d') as CanvasRenderingContext2D;
           
            // Clear canvas area around the checkbox
            ctx.clearRect(CHECKBOX_PROPS.x, CHECKBOX_PROPS.y, CHECKBOX_PROPS.width, CHECKBOX_PROPS.height);
    
            // Draw the outer bounding box
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333333';
            ctx.strokeRect(CHECKBOX_PROPS.x, CHECKBOX_PROPS.y, CHECKBOX_PROPS.width, CHECKBOX_PROPS.height);
    
            // Draw the checkmark if checked
            if (this.dataset.isChecked === '1') {
                ctx.fillStyle = '#007bff'; // Blue fill
                ctx.fillRect(CHECKBOX_PROPS.x, CHECKBOX_PROPS.y, CHECKBOX_PROPS.width, CHECKBOX_PROPS.height);
                
                // Optional: Draw an actual checkmark symbol instead of a solid fill
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(CHECKBOX_PROPS.x + 6, CHECKBOX_PROPS.y + 12);
                ctx.lineTo(CHECKBOX_PROPS.x + 11, CHECKBOX_PROPS.y + 17);
                ctx.lineTo(CHECKBOX_PROPS.x + 19, CHECKBOX_PROPS.y + 7);
                ctx.stroke();
            }
        });
    }

    hideCheckbox () {
        document.startViewTransition(() => {
            const thumb = new Image();
            const ctx = this.getContext('2d') as CanvasRenderingContext2D; 
    
            ctx.reset();
    
            thumb.src = this.#thumbImageURL;
            this.dataset.isChecked = '0';
    
            thumb.onload = () => ctx.drawImage(thumb, 0, 0);
        });
    }
}

window.customElements.define('page-thumb', PageThumb, { extends: 'canvas' });

export default PageThumb;

export {
    CHECKBOX_PROPS,
}