import BpmnViewer from 'bpmn-js/lib/Viewer';

// eslint-disable-next-line import/no-extraneous-dependencies
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
// eslint-disable-next-line import/no-extraneous-dependencies
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';

import customPaletteProviderModule from './lib/viewerPalette';
import callActivityModule from './modules/callActivityModule';
import drilldownCentering from './modules/drilldownCentering';
import styleModule from './modules/styleModule';
import multiInstanceModule from './modules/multiInstanceModule';
import userTaskModule from './modules/userTaskModule/';

import css from './assets/css/style.css';
import bpmnCSS from 'bpmn-js/dist/assets/bpmn-js.css';
import diagramCSS from 'bpmn-js/dist/assets/diagram-js.css';

import embeddedFontCSS from './assets/css/bpmn-embedded-font.css';
import embeddedRulesCSS from './assets/css/bpmn-embedded-rules.css';

class Viewer extends HTMLElement {
  constructor() {
    super();

    this.regionId = this.getAttribute('regionId');
    this.themePluginClass = this.getAttribute('themePluginClass');

    this.allowDownload = (this.getAttribute('allowDownload') === 'true');
    this.addHighlighting = (this.getAttribute('addHighlighting') === 'true');
    this.useBPMNcolors = (this.getAttribute('useBPMNcolors') === 'true');
    this.showToolbar = (this.getAttribute('showToolbar') === 'true');
    this.enableMousewheelZoom = (this.getAttribute('enableMousewheelZoom') === 'true');
    this.enableCallActivities = (this.getAttribute('enableCallActivities') === 'true');

    // create shadow dom
    this.attachShadow({ mode: 'open' });
  }

  async initCSS() {

    // copy bpmn @font-face declaration into global dom
    const styleGlobal = document.createElement('style');
    styleGlobal.innerHTML = embeddedFontCSS.toString();
    document.head.appendChild(styleGlobal);

    // copy apex font file from global page to shadow dom
    const apexFontFile = Array.from(document.styleSheets).find(s => s.href && s.href.includes('font-apex.min.css'));

    if (apexFontFile) {
      const styleShadow = document.createElement('style');
      styleShadow.innerHTML = `@import "${apexFontFile.href}"`;
      this.shadowRoot.appendChild(styleShadow);
    }

    // import general css files into shadow dom
    const sheets = await Promise.all(
      [
        css,
        bpmnCSS,
        diagramCSS,
        embeddedRulesCSS,
      ]
      .map((file) => {
        const sheet = new CSSStyleSheet();
        return sheet.replace(file.toString());
      })
    );

    this.shadowRoot.adoptedStyleSheets = sheets;
  }

  initHTML() {

    const container = document.createElement('div');
    // general class for styling
    container.classList.add('flows4apex-viewer');
    // class determining plugin theme
    container.classList.add(this.themePluginClass);

    // create and append canvas container
    this.canvas = document.createElement('div');
    this.canvas.id = `${this.regionId}_canvas`;
    this.canvas.classList.add('canvas');

    container.appendChild(this.canvas);

    // append container
    this.shadowRoot.appendChild(container);
  }

  initViewer() {
    this.viewer = new BpmnViewer({
      container: this.shadowRoot.querySelector(`#${this.canvas.id}`),
      additionalModules: [
       ...(this.showToolbar || this.enableMousewheelZoom) ? [MoveCanvasModule] : [], // TODO check condition
        ...(this.enableMousewheelZoom) ? [ZoomScrollModule] : [],
        drilldownCentering,
        ...(this.enableCallActivities) ? [callActivityModule] : [],
        multiInstanceModule,
        ...(this.addHighlighting || this.useBPMNcolors) ? [styleModule] : [],
        ...(this.showToolbar) ? [customPaletteProviderModule] : [],
        // bpmnViewer.customModules.rightClickModule,
        userTaskModule
      ],
      bpmnRenderer: {
        defaultFillColor: 'var(--default-fill-color)',
        defaultStrokeColor: 'var(--default-stroke-color)',
        defaultLabelColor: 'var(--default-stroke-color)',
      },
      config: {
        currentStyle: {
          'fill': '#6aad42',
          'border': 'black',
          'label': 'black'
        },
        completedStyle: {
          'fill': '#8c9eb0',
          'border': 'black',
          'label': 'black'
        },
        errorStyle: {
          'fill': '#d2423b',
          'border': 'black',
          'label': 'white'
        },
        allowDownload: this.allowDownload,
        addHighlighting: this.addHighlighting,
        useBPMNcolors: this.useBPMNcolors,
      }
    });
  }

  initModules() {
    
    this.viewer.get('multiInstanceModule').setWidget(this);
    this.viewer.get('userTaskModule').setWidget(this);

    if (this.enableCallActivities) this.viewer.get('callActivityModule').setWidget(this);
  }

  connectedCallback() {

    this.initCSS();
    
    this.initHTML();

    this.initViewer();

    this.initModules();
  }

  async loadData(data) {

    let diagram;
    let oldLoaded = true;

    // if call activities option enabled
    if (this.enableCallActivities) {
      // load old diagram (if possible)
      diagram = data.find(d => d.diagramIdentifier === this.diagramIdentifier);
      // otherwise: get root entry
      if (!diagram) {
        oldLoaded = false;
        diagram = data.find(d => typeof d.callingDiagramIdentifier === 'undefined');
      } 
      // set references to hierarchy + current diagram
      this.data = data;
      this.diagramIdentifier = diagram.diagramIdentifier;
      this.callingDiagramIdentifier = diagram.callingDiagramIdentifier;
      this.callingObjectId = diagram.callingObjectId;

      const callActivityModule = this.viewer.get('callActivityModule');

      // reset & update breadcrumb
      if (!oldLoaded) {
        callActivityModule.resetBreadcrumb();
        callActivityModule.updateBreadcrumb();
      }
    }
    // call activities not activated
    else {
      // get first (only) entry
      [diagram] = data;
      this.diagramIdentifier = diagram.diagramIdentifier;
    }

    // add highlighting if option is enabled
    if (this.addHighlighting) {
      this.current = diagram.current;
      this.completed = diagram.completed;
      this.error = diagram.error;
    }

    // parse iterationData and attach to instance
    try {
      this.iterationData = JSON.parse(diagram.iterationData);
    } catch (e) {
      this.iterationData = null;
    }
    
    // parse userTaskData and attach to instance
    try {
      this.userTaskData = JSON.parse(diagram.userTaskData);
    } catch (e) {
      this.userTaskData = null;
    }

    return diagram.diagram;
  }

  async loadDiagram(diagramContent) {
    
    // $( "#" + this.canvasId ).show();
    // $( "#" + this.regionId + " span.nodatafound" ).hide();
      
    try {
      const result = await this.viewer.importXML(diagramContent);
      const { warnings } = result;
        
      if (warnings.length > 0) {
        apex.debug.warn('Warnings during XML Import', warnings);
      }
        
      this.zoom('fit-viewport');
        
      // get viewer modules
      const eventBus = this.viewer.get('eventBus');
      const multiInstanceModule = this.viewer.get('multiInstanceModule');
      const userTaskModule = this.viewer.get('userTaskModule');

      // update colors with the current highlighting info
      this.updateColors(this.current, this.completed, this.error);
        
      // root.set -> drilled down into or moved out from sub process
      eventBus.on('root.set', (event) => {
        const {element} = event;
        // if current element is not iterating -> iterating elements are handled inside module
        if (!multiInstanceModule.isMultiInstanceSubProcess(element)) {
          // update colors
          this.updateColors(this.current, this.completed, this.error);
        }
      });

      // add overlays if iterationData is existing
      if (this.iterationData) {
        multiInstanceModule.addOverlays();
      }

      // add overlays if userTaskData is existing
      if (this.userTaskData) {
        userTaskModule.addOverlays();
      }

      // trigger load event
      // event.trigger( "#" + this.regionId, "mtbv_diagram_loaded", 
      //   { 
      //     diagramIdentifier: this.diagramIdentifier, 
      //     callingDiagramIdentifier: this.callingDiagramIdentifier, 
      //     callingObjectId: this.callingObjectId
      //   } 
      // );

    } catch (err) {
      apex.debug.error('Loading Diagram failed.', err, this.diagram);
    }
  }

  updateColors(current, completed, error) {
    // if any color option is enabled
    if (this.addHighlighting || this.useBPMNcolors) {
      // get viewer module
      const styleModule = this.viewer.get('styleModule');
      // reset current colors
      this.resetColors();
      // add highlighting if option is enabled
      if (this.addHighlighting) {
        styleModule.highlightElements(current, completed, error);
      }
    }
  }
  
  resetColors() {
    // if any color option is enabled
    if (this.addHighlighting || this.useBPMNcolors) {
      // get viewer module
      const styleModule = this.viewer.get('styleModule');
      // reset bpmn colors if option is not enabled
      if (!this.useBPMNcolors) {
        styleModule.resetBPMNcolors();
      }
      // reset highlighting
      styleModule.resetHighlighting();
    }
  }

  zoom(zoomOption) {
    this.viewer.get('canvas').zoom(zoomOption, 'auto');
  }

  async downloadAsSVG() {
    this.viewer.get('paletteProvider').downloadAsSVG();
  }
}

window.customElements.define('f4a-viewer', Viewer);