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
  component
) {

  this._component = component;

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
            click: _ => this._component.downloadAsSVG()
          },
        }
      })
    });
  
    return actions;
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
  'config.component'
];
