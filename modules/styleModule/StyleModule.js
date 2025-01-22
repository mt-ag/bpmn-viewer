// eslint-disable-next-line import/no-extraneous-dependencies
import { query as domQuery } from 'min-dom';

export class StyleModule {
  
  constructor(config, elementRegistry, canvas) {
    this._elementRegistry = elementRegistry;
    this._container = canvas.getContainer();
    
    // set global css variables
    this._container.style.setProperty('--highlight-current-fill', config.currentStyle.fill);
    this._container.style.setProperty('--highlight-current-border', config.currentStyle.border);
    this._container.style.setProperty('--highlight-current-label', config.currentStyle.label);
    this._container.style.setProperty('--highlight-completed-fill', config.completedStyle.fill);
    this._container.style.setProperty('--highlight-completed-border', config.completedStyle.border);
    this._container.style.setProperty('--highlight-completed-label', config.completedStyle.label);
    this._container.style.setProperty('--highlight-error-fill', config.errorStyle.fill);
    this._container.style.setProperty('--highlight-error-border', config.errorStyle.border);
    this._container.style.setProperty('--highlight-error-label', config.errorStyle.label);
  }

  addStyleToElements(elements, className) {

    let element;

    for (const e of elements) {

      element = domQuery(`g[data-element-id="${e}"]:not(.djs-connection) .djs-visual`, this._container);

      if (element) {
        element.classList.add(className);
      }
    }
  }

  highlightElements(current, completed, error) {
    if (current && current.length > 0) this.addStyleToElements(current, 'highlight-current');
    if (completed && completed.length > 0) this.addStyleToElements(completed, 'highlight-completed');
    if (error && error.length > 0) this.addStyleToElements(error, 'highlight-error');
  }

  resetHighlighting() {

    const elements = Object.keys(this._elementRegistry._elements);
    let element;

    for (const e of elements) {

      element = domQuery(`g[data-element-id="${e}"]:not(.djs-connection) .djs-visual`, this._container);

      if (element) {
        element.classList.remove('highlight-current');
        element.classList.remove('highlight-completed');
        element.classList.remove('highlight-error');
      }
    }
  }

  resetBPMNcolors() {

    const elements = Object.keys(this._elementRegistry._elements);
    let element;

    for (const e of elements) {

      element = domQuery(`g[data-element-id="${e}"]:not(.djs-connection) .djs-visual`, this._container);

      if (element) {
        element.classList.add('reset-bpmn-colors');
      }
    }
  }

  static addStyleToSVG(svg) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(svg, 'text/xml');

    const [defs] = xmlDoc.getElementsByTagName('defs');

    const styleNode = document.createElement('style');
    styleNode.setAttribute('type', 'text/css');

    const content = document.createTextNode('.djs-group { --default-fill-color: white; --default-stroke-color: black; }');
    styleNode.appendChild(content);

    defs.appendChild(styleNode);

    const xmlText = new XMLSerializer().serializeToString(xmlDoc);

    return xmlText;
  }
}

StyleModule.$inject = [
  // custom viewer properties nested inside parent config object
  'config.config',
  'elementRegistry',
  'canvas'
];
