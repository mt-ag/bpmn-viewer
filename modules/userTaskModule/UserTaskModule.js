
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
// eslint-disable-next-line import/no-extraneous-dependencies
import { domify } from 'min-dom';

export class UserTaskModule {

  constructor(canvas, eventBus, elementRegistry, translate, overlays, component) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._elementRegistry = elementRegistry;
    this._translate = translate;
    this._overlays = overlays;
    this._component = component;
  }

  addOverlays() {

    const { userTaskData } = this._component;

    this._elementRegistry.filter((element) => {
      const bo = getBusinessObject(element);
      /* only show link button if
       * - element is userTask
       * - link is existing
       * - element is not iterating
       * - parent is not iterating
       */
      return is(element, 'bpmn:UserTask') && (userTaskData && userTaskData[element.id]) && !bo.loopCharacteristics && !bo.$parent.loopCharacteristics;
    }).forEach((element) => {
      this.addOverlay(element, userTaskData[element.id]);
    });
  }

  addOverlay(element, url) {

    const button = domify('<button class="bjs-drilldown fa fa-external-link"></button>');

    button.addEventListener('click', function () {
      window.open(url, '_self');
    });

    // add overlay
    this._overlays.add(element, 'iterations', {
      position: {
        bottom: -7,
        right: -8
      },
      html: button
    });
  }
}

UserTaskModule.$inject = [
  'canvas',
  'eventBus',
  'elementRegistry',
  'translate',
  'overlays',
  'config.component'
];