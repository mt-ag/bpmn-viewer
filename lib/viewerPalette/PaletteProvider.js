import ZoomScroll from 'diagram-js/lib/navigation/zoomscroll/ZoomScroll';
import { assign } from 'min-dash';

/**
 * A palette provider for BPMN 2.0 elements.
 */
export default function PaletteProvider(
  palette,
  translate,
  eventBus,
  canvas,
  config,
  bpmnjs
) {

  this._viewer = bpmnjs;

  // palette._needsCollapse = function (availableHeight, entries) {
  //   return false;
  // }; // TODO check if needed

  this.getPaletteEntries = function (element) {
    var actions = {};
    var zoomScroll = new ZoomScroll({}, eventBus, canvas);
  
    assign(actions, {
      'zoom-in': {
        group: 'controls',
        className: 'fa fa-search-plus',
        title: translate('Zoom In'),
        action: {
          click: _ => zoomScroll.zoom(1, 0)
        },
      },
      'zoom-out': {
        group: 'controls',
        className: 'fa fa-search-minus',
        title: translate('Zoom Out'),
        action: {
          click: _ => zoomScroll.zoom(-1, 0)
        },
      },
      'zoom-reset': {
        group: 'controls',
        className: 'fa fa-fit-to-size',
        title: translate('Reset Zoom'),
        action: {
          click: _ => zoomScroll.reset()
        },
      },
      ...(config.allowDownload && {
        'download-svg': {
          group: 'controls',
          className: 'fa fa-image',
          title: translate('Download SVG'),
          action: {
            click: _ => this.downloadAsSVG()
          },
        }
      })
    });
  
    return actions;
  };

  this.downloadAsSVG = async function () { // TODO add check allowDownload
    try {
      const result = await this._viewer.saveSVG({ format: true });
      const { svg } = result;

      const styledSVG = this._viewer.get('styleModule').addStyleToSVG(svg);

      const svgBlob = new Blob([styledSVG], {
          type: 'image/svg+xml'
      });
      const fileName = `${Math.random(36).toString().substring(7)}.svg`;

      const downloadLink = document.createElement('a');
      downloadLink.download = fileName;
      downloadLink.href = window.URL.createObjectURL(svgBlob);
      downloadLink.click();

    } catch (err) {
      console.log(err);
    }
  };

  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'translate',
  'eventBus',
  'canvas',
  // custom viewer properties nested inside parent config object
  'config.config',
  'bpmnjs'
];
