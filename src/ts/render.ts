
import type { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/src/display/api.js";
import * as store from '@ts/store';
import '@styles/app.css';

class PDFPageThumb extends HTMLCanvasElement {

    renderPromise: Promise<void>;
    static THUMB_SCALE = 0.4;

    constructor (pagePromise: Promise<PDFPageProxy>) {
        super();

        this.draggable = true;

        this.renderPromise = pagePromise.then((page) => {
            const viewport = page.getViewport({ scale: PDFPageThumb.THUMB_SCALE });
            const ctx = this.getContext('2d');

            this.classList = 'pdfier-page';
            this.width = viewport.width;
            this.height = viewport.height;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            const renderTask = page.render(renderContext as RenderParameters);
            return renderTask.promise;
        });
    }
}

class PDFGrid {

    #container: HTMLElement;
    #dragged: HTMLElement;
    #hovered: HTMLElement;

    constructor (el: string) {
        const container = document.querySelector(el) as HTMLElement;

        if (container == null) {
            throw Error(`Invalid element: ${el}`);
        }
        
        this.#container = container;
        this.#container.classList = 'pdfier-page-grid';
        this.#dragged = document.createElement('span');
        this.#hovered = document.createElement('span');
    }

    async render (files: FileList) {
        this.#container.replaceChildren();

        const pdf = await store.merge(files);
        const renderTasks = Array.from({ length: pdf.numPages }, (_, index) => {
            const pageNum = index + 1;
            const pagePromise = pdf.getPage(pageNum);
            const pageThumb = new PDFPageThumb(pagePromise);

            pageThumb.dataset.pageNum = `${pageNum}`;

            pageThumb.ondrop = this.dropHandler();
            pageThumb.ondragover = this.dragOverHandler();
            pageThumb.ondragstart = this.dragStartHandler();
            pageThumb.ondragenter = this.dragEnterHandler;
            pageThumb.ondragleave = this.dragLeaveHander;
            pageThumb.ondragend = this.dragEndHandler;

            this.#container.append(pageThumb);
            return pageThumb.renderPromise;
        });

        return Promise.all(renderTasks);
    }

    download () {
        const children = this.#container.querySelectorAll('canvas[data-page-num]');
        const pageIndexes = Array.from(children as NodeListOf<PDFPageThumb>, (pageThumb) => {
            if (pageThumb.dataset.pageNum == null) {
                throw Error('undefined pageNum');
            }

            return Number.parseInt(pageThumb.dataset.pageNum) - 1;
        });
        
        return store.downloadFinalDoc(pageIndexes);
    }

    private dropHandler () {
        return (e: DragEvent) => {
            const target = e.target as HTMLElement;
            target.classList.remove('insert-before', 'insert-after');
        
            if (!target.parentNode) {
                return;
            }

            // clear working elements
            this.#dragged = document.createElement('span');
            this.#hovered = document.createElement('span');
        }
    }

    private dragEnterHandler (e: DragEvent) {
        e.preventDefault();
    }

    private dragOverHandler () {
        return (e: DragEvent) => {

            e.preventDefault();
    
            const target = e.target as HTMLElement;
            
            if (!target || target === this.#dragged || target === this.#hovered) {
                return;
            }

            this.#hovered = target;
            
            const targetRect = target.getBoundingClientRect();
            const targetCenterX = targetRect.left + targetRect.width / 2;          

            document.startViewTransition(() => {
                const hasEnteredThroughLeftSide = e.clientX < targetCenterX;

                if (hasEnteredThroughLeftSide) {
                    this.#container.insertBefore(this.#dragged, target.nextElementSibling);
                    target.style.transform = 'translateX(100%)';
                } else {
                    this.#container.insertBefore(this.#dragged, target);
                    target.style.transform = 'translateX(-100%)';
                }

                target.style.transition = 'none';

                requestAnimationFrame(() => {
                    target.classList.add('animated-move');
                    target.style.transform = '';
                    target.style.transition = '';
    
                    target.addEventListener('transitionend', () => {
                        target.classList.remove('animated-move');
                    }, { once: true });
                });
            });
        }
    }

    private dragLeaveHander (e: DragEvent) {
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

    private dragStartHandler () {
        return (e: DragEvent) => {
            this.#dragged = e.target as HTMLElement;
    
            if (e.dataTransfer?.items) { 
                e.dataTransfer.setData('text/html', this.#dragged.innerHTML);
            }
    
            this.#dragged.classList.add('dragging');
        }
    }
}

window.customElements.define('pdf-page-thumb', PDFPageThumb, { extends: 'canvas' });

export default PDFGrid;