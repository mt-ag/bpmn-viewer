
import { is } from 'bpmn-js/lib/util/ModelUtil';
// eslint-disable-next-line import/no-extraneous-dependencies
import { domify, query as domQuery } from 'min-dom';

var ARROW_DOWN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.81801948,3.50735931 L10.4996894,9.1896894 L10.5,4 L12,4 L12,12 L4,12 L4,10.5 L9.6896894,10.4996894 L3.75735931,4.56801948 C3.46446609,4.27512627 3.46446609,3.80025253 3.75735931,3.50735931 C4.05025253,3.21446609 4.52512627,3.21446609 4.81801948,3.50735931 Z"/></svg>';

export class CallActivityModule {
  
  constructor(canvas, eventBus, elementRegistry, overlays, component) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._overlays = overlays;
    this._component = component;

    // create and append breadcrumb
    this._breadcrumb = domify('<ul class="bjs-breadcrumbs" id="callActivityBreadcrumb"></ul>');
    this._container = this._canvas.getContainer();
    this._container.appendChild(this._breadcrumb);

    // add overlay for drilldown-able elements
    this._eventBus.on('import.render.complete', () => {
      this._elementRegistry
        .filter(e => is(e, 'bpmn:CallActivity'))
        .forEach(e => this.addOverlay(e));
    });
  }

  addOverlay(element) {
    
    const button = domify(`<button class="bjs-drilldown">${ARROW_DOWN_SVG}</button>`);

    // remove (possible) existing overlay
    if (this._overlays.get({ element: element, type: 'drilldown' }).length) {
      this.removeOverlay(element);
    }

    // add event listener
    button.addEventListener('click', (_) => {

      // clicked object
      const objectId = element.id;

      // retrieve hieracry + current diagram
      const { data, diagramIdentifier } = this._component;

      // get new diagram from hierarchy
      const newDiagram = data.find(
        d => d.callingDiagramIdentifier === diagramIdentifier &&
          d.callingObjectId === objectId
      );

      // if insight allowed
      if (newDiagram && newDiagram.insight === 1) {

        // set new diagram properties
        this._component.diagramIdentifier = newDiagram.diagramIdentifier;
        this._component.callingDiagramIdentifier = newDiagram.callingDiagramIdentifier;
        this._component.callingObjectId = newDiagram.callingObjectId;

        this._component.current = newDiagram.current;
        this._component.completed = newDiagram.completed;
        this._component.error = newDiagram.error;

        // update breadcrumb
        this.updateBreadcrumb();

        // move down sub process breadcrumb
        const subProcessBreadcrumb = domQuery('.bjs-breadcrumbs:not(#callActivityBreadcrumb)', this._container);
        subProcessBreadcrumb.style.top = '60px';

        // invoke loadDiagram of component
        this._component.loadDiagram(newDiagram.diagram);
      }
    });

    // add overlay
    this._overlays.add(element, 'drilldown', {
      position: {
        bottom: -7,
        right: -8
      },
      html: button
    });
  }
  
  removeOverlay(element) {
    // remove overlay
    this._overlays.remove({
      element: element,
      type: 'drilldown'
    });
  }

  updateBreadcrumb() {

    // retrieve hierarchy
    const { data, diagramIdentifier, callingDiagramIdentifier, callingObjectId } = this._component;

    // retrieve properties of current diagram
    const { breadcrumb } = data.find(
      d => d.diagramIdentifier === diagramIdentifier &&
        d.callingDiagramIdentifier === callingDiagramIdentifier &&
        d.callingObjectId === callingObjectId
    );

    // breadcrumb list entry
    const link = domify(
      `<li data-index="${this._breadcrumb.childNodes.length}"
      ${diagramIdentifier ? ` data-diagramIdentifier="${diagramIdentifier}"` : ''}
      ${callingDiagramIdentifier ? ` data-callingDiagramIdentifier="${callingDiagramIdentifier}"` : ''}
      ${callingObjectId ? ` data-callingObjectId="$${callingObjectId}"` : ''}>` +
      `<span class="bjs-crumb"><a
      ${callingObjectId ? ` title="called by ${callingObjectId}"` : ''}>` +
      `${breadcrumb}</a></span></li>`);

    // add event listener
    link.addEventListener('click', (_) => {

      // clicked object
      const { index, diagramidentifier } = link.dataset;

      // retrieve current(!) hierarchy
      const { data } = this._component;

      // get new diagram from hierarchy
      const newDiagram = data.find(
        d => d.diagramIdentifier.toString() === diagramidentifier
      );

      // all but last entry are clickable
      if (index < this._breadcrumb.childNodes.length - 1) {

        // trim breadcrumb to clicked entry
        this.trimBreadcrumbTo(index);

        // set new diagram properties
        this._component.diagramIdentifier = newDiagram.diagramIdentifier;
        this._component.callingDiagramIdentifier = newDiagram.callingDiagramIdentifier;
        this._component.callingObjectId = newDiagram.callingObjectId;

        this._component.current = newDiagram.current;
        this._component.completed = newDiagram.completed;
        this._component.error = newDiagram.error;

        // invoke loadDiagram of component
        this._component.loadDiagram(newDiagram.diagram);
      }
    });

    // append entry
    this._breadcrumb.appendChild(link);

    // toggle visibility
    this.toggleBreadcrumbVisibility();
  }

  resetBreadcrumb() {
    // remove all entries
    while (this._breadcrumb.firstChild) {
      this._breadcrumb.removeChild(this._breadcrumb.firstChild);
    }

    // toggle visibility
    this.toggleBreadcrumbVisibility();
  }

  trimBreadcrumbTo(index) {
    let flag = false;
    const removeNodes = [];

    for (let i = 0; i < this._breadcrumb.childNodes.length; i++) {
      if (flag) {
        // add entry to removable nodes
        removeNodes.push(this._breadcrumb.childNodes[i]);
      } else if (this._breadcrumb.childNodes[i].dataset.index === index) {
        // mark as last node
        flag = true;
      }
    }

    // remove subsequent nodes
    removeNodes.forEach(n => this._breadcrumb.removeChild(n));

    // toggle visibility
    this.toggleBreadcrumbVisibility();
  }
  
  toggleBreadcrumbVisibility() {
    // show/hide breadcrumb (depending on number of entries)
    if (this._breadcrumb.childNodes.length > 1) {

      const breadcrumbHeight = this._breadcrumb.offsetHeight;

      // show element
      this._breadcrumb.style.display = 'flex';

      // scroll canvas down
      this._canvas.scroll({ dx: 0, dy: 30 + breadcrumbHeight + 30 });

    } else {

      const subProcessBreadcrumb = domQuery('.bjs-breadcrumbs:not(#callActivityBreadcrumb)', this._container);

      // hide element
      this._breadcrumb.style.display = 'none';

      // move up sub process breadcrumb
      subProcessBreadcrumb.style.top = '30px';
    }
  }
}

CallActivityModule.$inject = [
  'canvas',
  'eventBus',
  'elementRegistry',
  'overlays',
  'config.component'
];