
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { domify, query as domQuery } from 'min-dom';


export default function MultiInstanceModule(
  canvas, eventBus, elementRegistry, translate, overlays
) {
  this._canvas = canvas;
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._translate = translate;
  this._overlays = overlays;

  var _self = this;

  const modal = domify(`
    <div id="modal">
      <div id ="modal-content">
        <div id="iteration-title">
          <span></span>
          <button class="fa fa-times"></button>
        </div>
        <div id="iteration-search">
          <input type="text" placeholder="Search.."/>
        </div>
        <div id="iteration-list">
            <table>
              <thead>
                <tr>
                  <th>Loop Counter</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  `);

  // append content
  canvas.getContainer().appendChild(modal);

  eventBus.on('import.render.complete', function () {
    // add search listener for filtering
    const searchbar = domQuery('#iteration-search input');
    searchbar.addEventListener('keyup', function (event) {
      _self.filterIterations(event);
    });
    // add close listener
    const closeButton = domQuery('#iteration-title button.fa-times');
    closeButton.addEventListener('click', function (event) {
      _self.closeIterations();
    });
  });

  // when diagram root changes
  eventBus.on('root.set', function (event) {
    const element = getBusinessObject(event.element);
    // if drilled down into subprocess
    if (is(element, 'bpmn:SubProcess') && _self.hasIterationData(element)) {
      _self.addBreadcrumbButton(element);
    }
  });
}

MultiInstanceModule.prototype.addOverlays = function () {
  
  const _this = this;
  
  this._elementRegistry.filter(function (e) {
    return !(is(e, 'bpmn:SubProcess')) && _this.hasIterationData(e);
  }).forEach(function (el) {
    _this.addOverlay(el);
  });
};

MultiInstanceModule.prototype.isMultiInstanceSubProcess = function (element) {
  const businessObject = getBusinessObject(element);
  return is(businessObject, 'bpmn:SubProcess') && this.hasIterationData(businessObject);
};

MultiInstanceModule.prototype.addOverlay = function (element) {

  const button = domify('<button class="bjs-drilldown fa fa-list"></button>');

  const _this = this;

  button.addEventListener('click', function (event) {
    _this.openIterations(element);
  });

  // add overlay
  this._overlays.add(element, 'iterations', {
    position: {
      bottom: -7,
      right: -8
    },
    html: button
  });
};

MultiInstanceModule.prototype.addBreadcrumbButton = function (element) {

  const breadcrumb = domQuery('.bjs-breadcrumbs li:last-child'); // TODO fix selector for excluding call activity breadcrumb

  const button = domify('<button class="bjs-drilldown fa fa-list"></button>');

  const _this = this;

  button.addEventListener('click', function (event) {
    _this.openIterations(element);
  });

  breadcrumb.appendChild(button);
};

MultiInstanceModule.prototype.hasIterationData = function (element) {
  return (this._widget.iterationData && this._widget.iterationData[element.id]);
};

MultiInstanceModule.prototype.setWidget = function (widget) {
  this._widget = widget;
};

MultiInstanceModule.prototype.openDialog = function () {

  const searchbar = domQuery('#iteration-search input');
  const modal = domQuery('#modal');

  // clear searchbar
  searchbar.value = '';
  // show modal
  modal.style.display = 'flex';
};

MultiInstanceModule.prototype.loadTable = function (data) {

  const tbody = domQuery('#iteration-list tbody');

  const addOnClick = is(this.currentElement, 'bpmn:SubProcess');

  tbody.replaceChildren(
    ...data.map((d) => {
      const row = domify(`
        <tr ${addOnClick ? 'class="clickable"' : ''}>
          <td>${d.loopCounter}</td>
          <td>${d.description}</td>
          <td>${d.status}</td>
        </tr>
      `);

      const _this = this;

      if (addOnClick) {
        row.addEventListener('click', function (event) {
          _this.loadIteration(d.stepKey);
          _this.closeIterations();
        });
      }

      return row;
    }));

  
};

MultiInstanceModule.prototype.openIterations = function (element) {

  const {id} = element;
  
  const businessObject = getBusinessObject(element);
  
  const {name} = businessObject;
  
  // TODO retrieve data by using <id>
  const subProcessData = this._widget.iterationData[id];

  if (subProcessData) {

    // set reference
    this.currentElement = element;

    // store for later
    this._widget.subProcessData = subProcessData;

    this.loadTable(subProcessData);

    // set title
    const title = domQuery('#iteration-title span');
    title.textContent = name;

    this.openDialog();

  } else {
    // TODO do anything here?
  }

};

MultiInstanceModule.prototype.closeIterations = function () {

  const modal = domQuery('#modal');

  modal.style.display = 'none';
};

MultiInstanceModule.prototype.loadIteration = function (value) {

  if (value) {

    // TODO extract this out of sub process data using <value>
    const highlightingData = this._widget.subProcessData.find(v => v.stepKey == value).highlighting;

    if (highlightingData) {
      // set new diagram properties
      // TODO probably need to set the currently selected instance as well
      const {current, completed, error} = highlightingData;

      this._widget.updateColors(current, completed, error);

      // TODO update breadcrumb
    }
  }
};

MultiInstanceModule.prototype.filterIterations = function (event) {

  const {value} = event.target;

  const filtered = this._widget.subProcessData.filter(
    d => d.description.includes(value) || d.status.includes(value)
  ); // TODO make other columns searchable as well

  this.loadTable(filtered);
};

MultiInstanceModule.$inject = ['canvas', 'eventBus', 'elementRegistry', 'translate', 'overlays'];