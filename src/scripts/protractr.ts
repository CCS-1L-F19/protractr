import {Sketch} from "./gcs/sketch";
import {UI} from "./ui/ui";
import {protractr} from "./main";

export class Protractr {
    sketch: Sketch;
    ui: UI;
    constructor(canvas: HTMLCanvasElement, sidePane: HTMLDivElement, toolbar: HTMLUListElement) {
        this.sketch = new Sketch();
        this.ui = new UI(this, canvas, sidePane, toolbar);
    }
    loadSketch(json: string, push: boolean=true) {
        if(json == undefined) {
            this.resetSketch();
            return;
        }
        this.sketch = Sketch.fromObject(JSON.parse(json));
        this.ui.reload();
    }
    exportSketch(): string {
        return JSON.stringify(this.sketch.asObject());
    }
    resetSketch() {
        this.sketch = new Sketch();
        this.ui.reload();
    }
    loadFromURL(url: string) {
        let request = new XMLHttpRequest();
        let _this = this;
        request.addEventListener("load", function () {
            if(this.status == 200) {
                _this.loadSketch(this.responseText);
            } else {
                console.log("Failed to load sketch, response code != 200: ", this);
            }
        });
        request.open("GET", url);
        request.send();
    }
}

