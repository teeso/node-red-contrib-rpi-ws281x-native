'use strict';

module.exports = function(RED) {
    function Ws281xNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.leds = require("rpi-ws281x-native");

        node.width = parseInt(config.width);
        node.height = parseInt(config.height);

        node.numLeds = node.width * node.height;
        node.mode = config.mode;
        node.reverse = config.reverse;

        node.brightness = Math.floor(parseInt(config.brightness) * 255 / 100);
        node.finalArray = new Uint32Array(node.numLeds);

        node.leds.init(node.numLeds, {dmaNum: 10, brightness: node.brightness});

        node.on('input', function(msg) {
            const mode = msg.mode || node.mode;

            if (Buffer.isBuffer(msg.payload)) {
                node.bufferToArray(msg.payload, node.numLeds, mode, node.width);
                node.leds.render(node.finalArray);
            }
        });

        node.on('close', function() {
            try {
                node.leds.reset();
            } catch (e) {
                node.error("Error closing LEDs");
            }
        });

        node.bufferToArray = (buffer, numLeds, mode, rowLength) => {
            if (mode == 'canvas') {
                for (let p = 0; p < numLeds; p++) {
                    let rowNum = Math.floor(p/rowLength);
                    // Si impair
                    if ((rowNum % 2 == 1) && node.reverse) {
                        node.finalArray[(2 * rowNum * rowLength) - p + rowLength - 1] = buffer.readUInt32LE(p*4);
                    } else {
                        node.finalArray[p] = buffer.readUInt32LE(p*4);
                    }
                }
            } else {
                // For each LED
                for (var p = 0; p < numLeds; p++) {
                    var pixel = Buffer.alloc(4);
                    buffer.copy(pixel, 1, p*3, (p*3)+3);
                    node.finalArray[p] = pixel.readUInt32BE(0);
                }
            }

        };
    }
    RED.nodes.registerType("rpi-ws281x-native", Ws281xNode);
};
