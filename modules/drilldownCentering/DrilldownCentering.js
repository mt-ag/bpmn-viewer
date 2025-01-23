/**
 * Move collapsed subprocesses into view when drilling down.
 *
 * Overwrite default behaviour where zoom and scroll are saved in a session.
 * Zoom always reset to fit-viewport & centered when drilling down / moving up
 *
 * @param {eventBus} eventBus
 * @param {canvas} canvas
 */
export default function DrilldownCentering(eventBus, canvas) {

  eventBus.on('root.set', () => canvas.zoom('fit-viewport', 'auto'));
}

DrilldownCentering.$inject = ['eventBus', 'canvas'];