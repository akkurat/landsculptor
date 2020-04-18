// Thanks: https://gist.github.com/ryascl/4c1fd9e2d5d0030ba429
import * as paper from 'paper'
export class PaperZoom {

    project: paper.Project;
    factor = 1.25;
    
    private _minZoom: number;
    private _maxZoom: number;
    private mouseNativeStart: paper.Point;
    private viewCenterStart: paper.Point;

    constructor(project: paper.Project) {
        this.project = project;
        
        const view = this.project.view;

    view.element.addEventListener('wheel', event => {
        const mousePosition = new paper.Point(event.offsetX, event.offsetY);
            this.changeZoomCentered(event.deltaY, mousePosition);
    })
        
        view.on("mousedown", ev => {
            this.viewCenterStart = view.center;
            // Have to use native mouse offset, because ev.delta 
            //  changes as the view is scrolled.
            this.mouseNativeStart = new paper.Point(ev.event.offsetX, ev.event.offsetY);
        });
        
        view.on("mousedrag", ev => {
            if(this.viewCenterStart){   
                const nativeDelta = new paper.Point(
                    ev.event.offsetX - this.mouseNativeStart.x,
                    ev.event.offsetY - this.mouseNativeStart.y
                );
                // Move into view coordinates to subract delta,
                //  then back into project coords.
                view.center = view.viewToProject( 
                    view.projectToView(this.viewCenterStart)
                    .subtract(nativeDelta));
            }
        });
        
        view.on("mouseup", ev => {
            if(this.mouseNativeStart){
                this.mouseNativeStart = null;
                this.viewCenterStart = null;
            }
        });
    }

    get zoom(): number{
        return this.project.view.zoom;
    }

    get zoomRange(): number[] {
        return [this._minZoom, this._maxZoom];
    }

    /**
     * Set zoom level.
     * @returns zoom level that was set, or null if it was not changed
     */
    setZoomConstrained(zoom: number): number {
        if(this._minZoom) {
            zoom = Math.max(zoom, this._minZoom);
        }
        if(this._maxZoom){
            zoom = Math.min(zoom, this._maxZoom);
        }
        const view = this.project.view;
        if(zoom != view.zoom){
            view.zoom = zoom;
            return zoom;
        }
        return null;
    }

    setZoomRange(range: paper.Size[]): number[] {
        const view = this.project.view;
        const aSize = range.shift();
        const bSize = range.shift();
        const a = aSize && Math.min( 
            view.bounds.height / aSize.height,         
            view.bounds.width / aSize.width);
        const b = bSize && Math.min( 
            view.bounds.height / bSize.height,         
            view.bounds.width / bSize.width);
        const min = Math.min(a,b);
        if(min){
            this._minZoom = min;
        }
        const max = Math.max(a,b);
        if(max){
            this._maxZoom = max;
        }
        return [this._minZoom, this._maxZoom];
    }

    changeZoomCentered(delta: number, mousePos: paper.Point) {
        if (!delta) {
            return;
        }
        const view = this.project.view;
        const oldZoom = view.zoom;
        const oldCenter = view.center;
        const viewPos = view.viewToProject(mousePos);
        
        let newZoom = delta > 0
            ? view.zoom * this.factor
            : view.zoom / this.factor;
        newZoom = this.setZoomConstrained(newZoom);
        
        if(!newZoom){
            return;
        }

        const zoomScale = oldZoom / newZoom;
        const centerAdjust = viewPos.subtract(oldCenter);
        const offset = viewPos.subtract(centerAdjust.multiply(zoomScale))
            .subtract(oldCenter);

        view.center = view.center.add(offset);
    };
    
    zoomTo(rect: paper.Rectangle){
        const view = this.project.view;
        view.center = rect.center;
        view.zoom = Math.min( 
            view.viewSize.height / rect.height, 
            view.viewSize.width / rect.width);
    }
}