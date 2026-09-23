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
        
        this.dataset.isChecked = '0';
        this.dataset.pageNum = `${page.pageNumber}`;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        const renderTask = page.render(renderContext as RenderParameters);

        this.renderPromise = renderTask.promise.finally(() => {
            this.#thumbImageURL = this.toDataURL();
        });

        this.ondragend = this.dragEndHandler;
        this.ondragleave = this.dragLeaveHandler;
        this.ondragenter = (e: DragEvent) => e.preventDefault();
    }

    drawCheckbox() {
        const ctx = this.getContext('2d') as CanvasRenderingContext2D;
        const { x, y, height, width } = CHECKBOX_PROPS;

        // Clear canvas area around the checkbox
        ctx.clearRect(x, y, width, height);

        // Draw the outer bounding box
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333333';
        ctx.strokeRect(x, y, width, height);

        // Draw the checkmark if checked
        if (this.dataset.isChecked === '1') {
            ctx.fillStyle = '#007bff'; // Blue fill
            ctx.fillRect(x, y, width, height);
            
            // Optional: Draw an actual checkmark symbol instead of a solid fill
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 12);
            ctx.lineTo(x + 11, y + 17);
            ctx.lineTo(x + 19, y + 7);
            ctx.stroke();
        }
    }

    removeCheckbox () {
        const thumb = new Image();
        const ctx = this.getContext('2d') as CanvasRenderingContext2D; 

        ctx.reset();

        thumb.src = this.#thumbImageURL;
        this.dataset.isChecked = '0';

        thumb.onload = () => ctx.drawImage(thumb, 0, 0);
    }

    toggleCheckbox (e: MouseEvent) {
        const rect = this.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const { x, y, height, width } = CHECKBOX_PROPS;

        // Check if click is inside the box boundaries
        const isInsideX = mouseX >= x && mouseX <= (x + width);
        const isInsideY = mouseY >= y && mouseY <= (y + height);

        if (isInsideX && isInsideY) {
            this.dataset.isChecked = this.dataset.isChecked === '1' ? '0' : '1';
            this.drawCheckbox();
        }
    }

    private dragLeaveHandler (e: DragEvent) {
        if (e.target) {
            const target = e.target as HTMLElement;
            target.classList.remove('insert-before', 'insert-after');
        }
    }

    private dragEndHandler (e: DragEvent) {
        if (e.target) {
            const target = e.target as HTMLElement;
            target.classList.remove('dragging');
        }
    }
}

window.customElements.define('page-thumb', PageThumb, { extends: 'canvas' });

export default PageThumb;