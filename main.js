import { initialize, getShaderModule } from "./engine.js";
import {
    GRID_SIZE,
    diagonalFillCellsArray,
    stripeFillCellsArray,
    createUniformBuffer,
    createCellStateStorageBuffer,
    createVertexBuffer,
} from "./game.js";

const {
    device,
    format,
    context
} = await initialize();

const { vertexBuffer, squareVertices } = createVertexBuffer(device);
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, squareVertices);

const { uniformBuffer, uniformArray } = createUniformBuffer(device);
device.queue.writeBuffer(uniformBuffer, /*bufferOffset=*/0, uniformArray);

const { cellStateStorage, cellStateArray } = createCellStateStorageBuffer(device);
stripeFillCellsArray();
device.queue.writeBuffer(cellStateStorage[0], /*bufferOffset=*/0, cellStateArray);
diagonalFillCellsArray();
device.queue.writeBuffer(cellStateStorage[1], /*bufferOffset=*/0, cellStateArray);


const cellShaderModule = await getShaderModule(device, 'shader.wgsl');

const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // location, see vertex shader
    }]
}

const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [ vertexBufferLayout ],
    },
    fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format }]
    }
})

const bindGroups = [
    device.createBindGroup({
        label: "Cell renderer bind group A",
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }, {
            binding: 1,
            resource: { buffer: cellStateStorage[0] }
        }],
    }),
    device.createBindGroup({
        label: "Cell renderer bind group B",
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }, {
            binding: 1,
            resource: { buffer: cellStateStorage[1] }
        }],
    })
];

let step = 0;
const updateGrid = () => {
    step++;

    const encoder = device.createCommandEncoder();
    const currentContent = context.getCurrentTexture();

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: currentContent.createView(),
            loadOp: "clear",
            clearValue: { r: 0, g: 0.3, b: 0, a: 1 },
            storeOp: "store",
        }]
    });

    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroups[step % 2]);

    pass.draw(squareVertices.length / 2, GRID_SIZE * GRID_SIZE);

    pass.end();
    device.queue.submit([ encoder.finish() ]);
}

const UPDATE_INTERVAL = 200;
setInterval(updateGrid, UPDATE_INTERVAL);