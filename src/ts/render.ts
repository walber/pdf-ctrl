
import { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/src/display/api.js";
import * as store from '@ts/store';

class PDFGrid {

    #THUMB_SCALE = 0.4;
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

            return this.renderPageThumb(pagePromise);
        });

        return Promise.all(renderTasks);
    }

    renderPageThumb(pagePromise: Promise<PDFPageProxy>) {
        const pageThumb = document.createElement('canvas');

        pageThumb.draggable = true;
        pageThumb.classList = 'pdfier-page';

        this.#container.append(pageThumb);

        const renderTaskPromise = pagePromise.then((page) => {
            const viewport = page.getViewport({ scale: this.#THUMB_SCALE });
            const ctx = pageThumb.getContext('2d');
            
            pageThumb.width = viewport.width;
            pageThumb.height = viewport.height;
            pageThumb.dataset.pageNum = `${page.pageNumber}`;

            pageThumb.ondrop = this.dropHandler();
            pageThumb.ondragover = this.dragOverHandler();
            pageThumb.ondragstart = this.dragStartHandler();
            pageThumb.ondragenter = this.dragEnterHandler;
            pageThumb.ondragleave = this.dragLeaveHandler;
            pageThumb.ondragend = this.dragEndHandler;
    
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
    
            const renderTask = page.render(renderContext as RenderParameters);
            return renderTask.promise;
        });

        return renderTaskPromise;
    }

    download () {
        const children = this.#container.querySelectorAll('canvas[data-page-num]');
        const pageIndexes = Array.from(children as NodeListOf<HTMLCanvasElement>, (pageThumb) => {
            if (pageThumb.dataset.pageNum == null) {
                throw Error('undefined pageNum');
            }

            return Number.parseInt(pageThumb.dataset.pageNum) - 1;
        });

        return store.download(pageIndexes);
    }

    async addNewPage() {
        const pdf = await store.addNewPage();
        const lastPage = pdf.numPages;
        const pagePromise = pdf.getPage(lastPage);

        return this.renderPageThumb(pagePromise);
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

    private dragStartHandler () {
        return (e: DragEvent) => {
            this.#dragged = e.target as HTMLElement;
    
            if (e.dataTransfer?.items) { 
                e.dataTransfer.setData('text/html', this.#dragged.innerHTML);
            }
    
            this.#dragged.classList.add('dragging');
        }
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

    private dragEnterHandler (e: DragEvent) {
        e.preventDefault();
    }
}

export default PDFGrid;