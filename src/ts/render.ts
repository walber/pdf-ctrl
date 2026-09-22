import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api.js";
import PageThumb from '@ts/page';

class PDFGrid {

    #container: HTMLElement;
    #dragged: HTMLElement;
    #hovered: HTMLElement;
    #eventTarget: EventTarget;
    #controller: AbortController;
    #isDeleteModeEnabled: boolean;

    constructor (el: string) {
        const container = document.querySelector(el) as HTMLElement;

        if (container == null) {
            throw Error(`Invalid element: ${el}`);
        }

        this.#container = container;
        this.#isDeleteModeEnabled = false;
        this.#container.classList = 'pdfier-page-grid';
        this.#dragged = document.createElement('span');
        this.#hovered = document.createElement('span');
        this.#eventTarget = new EventTarget();
        this.#controller = new AbortController();
    }

    load (pdf: PDFDocumentProxy) {
        this.#container.replaceChildren();
        this.#controller.abort();

        this.#controller = new AbortController();

        const renderTasks = Array.from({ length: pdf.numPages }, (_, index) => {
            const pageNum = index + 1;
            const pagePromise = pdf.getPage(pageNum);

            return this.renderPage(pagePromise);
        });

        return Promise.all(renderTasks);
    }

    pageIndexes () {
        const children = this.#container.querySelectorAll('canvas[data-page-num]');
        const pageIndexes = Array.from(children as NodeListOf<PageThumb>, (pageThumb) => {
            if (pageThumb.dataset.pageNum == null) {
                throw Error('undefined pageNum');
            }

            return Number.parseInt(pageThumb.dataset.pageNum) - 1;
        });

        return pageIndexes;
    }

    removePages () {
        const children = this.#container.querySelectorAll('canvas[data-page-num]');
        const allPages = Array.from(children as NodeListOf<PageThumb>);
        const selectedPages = allPages.filter((page) => page.dataset.isChecked === '1');
        const pageNumbers = selectedPages.map(page => page.dataset.pageNum);

        selectedPages.forEach(page => page.remove());

        return pageNumbers;
    }

    toggleDeleteMode () {
        this.#isDeleteModeEnabled = !this.#isDeleteModeEnabled;
        this.#eventTarget.dispatchEvent(new Event('toggleDeleteMode'));
    }

    async renderPage(pagePromise: Promise<PDFPageProxy>) {
        const page =  await pagePromise;
        const pageThumb = new PageThumb(page)

        this.#container.append(pageThumb);

        return pageThumb.renderPromise.then(() => {
            pageThumb.ondrop = this.dropHandler();
            pageThumb.ondragover = this.dragOverHandler();
            pageThumb.ondragstart = this.dragStartHandler();
            pageThumb.onclick = this.clickHandler();

            if (this.#isDeleteModeEnabled) {
                pageThumb.drawCheckbox();
            }

            this.#eventTarget.addEventListener('toggleDeleteMode', (e) => {
                this.#isDeleteModeEnabled ? pageThumb.drawCheckbox() : pageThumb.removeCheckbox();
            }, { signal: this.#controller.signal });

            return pageThumb;
        });
    }

    private clickHandler () {
        return (e: MouseEvent) => {
            if (!this.#isDeleteModeEnabled) {
                return;
            }

            const target = e.target as PageThumb;
            target.toggleCheckbox(e);
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
}

export default PDFGrid;