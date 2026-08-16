import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";
import PageThumb, { CHECKBOX_PROPS } from '@ts/page';
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

    toggleDeleteMode () {
        this.#isDeleteModeEnabled = !this.#isDeleteModeEnabled;
        this.#eventTarget.dispatchEvent(new Event('toggleDeleteMode'));
    }

    removePages () {
        const children = this.#container.querySelectorAll('canvas[data-page-num]');
        const allPages = Array.from(children as NodeListOf<PageThumb>);
        const selectedPages = allPages.filter((page) => page.dataset.isChecked === '1');

        for (const page of selectedPages) {
            page.remove();
        }
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
            pageThumb.onclick = this.clickHandler();

            if (this.#isDeleteModeEnabled) {
                pageThumb.showCheckbox();
            }

            this.#eventTarget.addEventListener('toggleDeleteMode', (e) => {
                this.#isDeleteModeEnabled ? pageThumb.showCheckbox() : pageThumb.hideCheckbox();
            }, { signal: this.#controller.signal });
        });
    }

    async addNewPage() {
        const pdf = await store.addNewPage();
        const lastPage = pdf.numPages;
        const pagePromise = pdf.getPage(lastPage);

        return this.renderPage(pagePromise);
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

    private clickHandler () {
        return (e: MouseEvent) => {
            if (!this.#isDeleteModeEnabled) {
                return;
            }
    
            const target = e.target as PageThumb;
            const rect = target.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
    
            // Check if click is inside the box boundaries
            const isInsideX = mouseX >= CHECKBOX_PROPS.x && mouseX <= CHECKBOX_PROPS.x + CHECKBOX_PROPS.width;
            const isInsideY = mouseY >= CHECKBOX_PROPS.y && mouseY <= CHECKBOX_PROPS.y + CHECKBOX_PROPS.height;

            if (isInsideX && isInsideY) {
                target.dataset.isChecked = target.dataset.isChecked === '1' ? '0' : '1';
                target.showCheckbox();
            }
        }
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