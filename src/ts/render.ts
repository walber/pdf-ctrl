import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";
import PageThumb from '@ts/page';
import * as store from '@ts/store';

class PDFGrid {

    #container: HTMLElement;
    #dragged: HTMLElement;
    #hovered: HTMLElement;
    #controller: AbortController;
    #eventTarget: EventTarget;
    #isDeleteModeEnabled = false;

    constructor (el: string) {
        const container = document.querySelector(el) as HTMLElement;

        if (container == null) {
            throw Error(`Invalid element: ${el}`);
        }

        this.#container = container;
        this.#container.classList = 'pdfier-page-grid';
        this.#dragged = document.createElement('span');
        this.#hovered = document.createElement('span');
        this.#controller = new AbortController();
        this.#eventTarget = new EventTarget();
    }

    download () {
        const children = this.#container.querySelectorAll('canvas[data-page-num]');
        const pageIndexes = Array.from(children as NodeListOf<PageThumb>, (pageThumb) => {
            if (pageThumb.dataset.pageNum == null) {
                throw Error('undefined pageNum');
            }

            return Number.parseInt(pageThumb.dataset.pageNum) - 1;
        });

        return store.download(pageIndexes);
    }

    async render (files: FileList) {        
        const pdf = await store.merge(files);
        return this.load(pdf);
    }

    async reload () {
        const pdf = await store.getPDF();
        return this.load(pdf);
    }

    async renderPage(pagePromise: Promise<PDFPageProxy>) {
        const page =  await pagePromise;
        const pageThumb = new PageThumb(page)

        this.#container.append(pageThumb);

        return pageThumb.renderPromise.then(() => {
            pageThumb.ondrop = this.dropHandler();
            pageThumb.ondragover = this.dragOverHandler();
            pageThumb.ondragstart = this.dragStartHandler();
            pageThumb.ondragenter = this.dragEnterHandler;
            pageThumb.ondragleave = this.dragLeaveHandler;
            pageThumb.ondragend = this.dragEndHandler;

            if (this.#isDeleteModeEnabled) {
                pageThumb.showCheckbox();
            }

            this.#eventTarget.addEventListener('deleteMode', (e) => {
                pageThumb.showCheckbox();
            }, { signal: this.#controller.signal });

            this.#eventTarget.addEventListener('viewMode', (e) => {
                pageThumb.hideCheckbox();
            }, { signal: this.#controller.signal });
        });
    }

    enableDelete () {
        this.#isDeleteModeEnabled = true;
        this.#eventTarget.dispatchEvent(new Event('deleteMode'));
    }

    disableDelete () {
        this.#isDeleteModeEnabled = false;
        this.#eventTarget.dispatchEvent(new Event('viewMode'));
    }

    removePages () {
        const children = this.#container.querySelectorAll('canvas[data-page-num]');
        const allPages = Array.from(children as NodeListOf<PageThumb>);
        const selectedPages = allPages.filter((page) => page.dataset.isChecked === '1');

        for (const page of selectedPages) {
            page.remove();
        }
    }

    private load (pdf: PDFDocumentProxy) {
        this.#controller.abort();
        this.#controller = new AbortController();

        this.#container.replaceChildren();

        const renderTasks = Array.from({ length: pdf.numPages }, (_, index) => {
            const pageNum = index + 1;
            const pagePromise = pdf.getPage(pageNum);

            return this.renderPage(pagePromise);
        });

        return Promise.all(renderTasks);
    }

    async addNewPage() {
        const pdf = await store.addNewPage();
        const lastPage = pdf.numPages;
        const pagePromise = pdf.getPage(lastPage);

        return this.renderPage(pagePromise);
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