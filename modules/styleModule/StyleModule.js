import { query as domQuery } from 'min-dom';

export default function StyleModule(config, bpmnRenderer, elementRegistry, canvas) { // TODO rebuild to class?

  // set global css variables
  const container = canvas.getContainer();

  container.style.setProperty('--highlight-current-fill', config.currentStyle.fill);
  container.style.setProperty('--highlight-current-border', config.currentStyle.border);
  container.style.setProperty('--highlight-current-label', config.currentStyle.label);
  container.style.setProperty('--highlight-completed-fill', config.completedStyle.fill);
  container.style.setProperty('--highlight-completed-border', config.completedStyle.border);
  container.style.setProperty('--highlight-completed-label', config.completedStyle.label);
  container.style.setProperty('--highlight-error-fill', config.errorStyle.fill);
  container.style.setProperty('--highlight-error-border', config.errorStyle.border);
  container.style.setProperty('--highlight-error-label', config.errorStyle.label);

  this.addStyleToElements = function (elements, className) {

    let element;

    for (const e of elements) {

      element = domQuery(`g[data-element-id="${e}"]:not(.djs-connection) .djs-visual`, container);

      if (element) {
        element.classList.add(className);
      }
    }
  };
  
  this.highlightElements = function (current, completed, error) {
    if (current && current.length > 0) this.addStyleToElements(current, 'highlight-current');
    if (completed && completed.length > 0) this.addStyleToElements(completed, 'highlight-completed');
    if (error && error.length > 0) this.addStyleToElements(error, 'highlight-error');
  };

  this.resetHighlighting = function () {

    const elements = Object.keys(elementRegistry._elements);
    let element;

    for (const e of elements) {

      element = domQuery(`g[data-element-id="${e}"]:not(.djs-connection) .djs-visual`, container);

      if (element) {
        element.classList.remove('highlight-current');
        element.classList.remove('highlight-completed');
        element.classList.remove('highlight-error');
      }
    }
  };

  this.resetBPMNcolors = function () {

    const elements = Object.keys(elementRegistry._elements);
    let element;

    for (const e of elements) {

      element = domQuery(`g[data-element-id="${e}"]:not(.djs-connection) .djs-visual`, container);

      if (element) {

        element.classList.add('reset-bpmn-colors');
      }
    }
  };

  this.addStyleToSVG = function (svg) {
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
  };
}

StyleModule.$inject = [
  // custom viewer properties nested inside parent config object
  'config.config',
  'config.bpmnRenderer',
  'elementRegistry',
  'canvas'
];
