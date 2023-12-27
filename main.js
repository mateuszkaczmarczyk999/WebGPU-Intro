import {initialize, getDrawShaderModule, getSimulationShaderModule} from "./engine.js";
import {
    GRID_SIZE,
    diagonalFillCellsArray,
    stripeFillCellsArray,
    createUniformBuffer,
    createCellStateStorageBuffer,
    createVertexBuffer, WORKGROUP_SIZE,
} from "./game.js";

const {
    device,
    queue,
    format,
    context
} = await initialize();

const { vertexBuffer, squareVertices } = createVertexBuffer(device);
queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, squareVertices);

const { uniformBuffer, uniformArray } = createUniformBuffer(device);
queue.writeBuffer(uniformBuffer, /*bufferOffset=*/0, uniformArray);

const { cellStateStorage, cellStateArray } = createCellStateStorageBuffer(device);
stripeFillCellsArray();
queue.writeBuffer(cellStateStorage[0], /*bufferOffset=*/0, cellStateArray);
diagonalFillCellsArray();
queue.writeBuffer(cellStateStorage[1], /*bufferOffset=*/0, cellStateArray);

const cellShaderModule = await getDrawShaderModule(device);
const simulationShaderModule = await getSimulationShaderModule(device);

const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // location, see vertex shader
    }]
}

const bindGroupLayout = device.createBindGroupLayout({
    label: "Cell Bind Group Layout",
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" } // Grid uniform buffer
    }, {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" } // Cell state input buffer
    }, {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" } // Cell state output buffer
    }]
})

const bindGroups = [
    device.createBindGroup({
        label: "Cell renderer bind group A",
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }, {
            binding: 1,
            resource: { buffer: cellStateStorage[0] }
        }, {
            binding: 2,
            resource: { buffer: cellStateStorage[1] }
        }],
    }),
    device.createBindGroup({
        label: "Cell renderer bind group B",
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }, {
            binding: 1,
            resource: { buffer: cellStateStorage[1] }
        }, {
            binding: 2,
            resource: { buffer: cellStateStorage[0] }
        }],
    })
];

const pipelineLayout = device.createPipelineLayout({
    label: "Cell Pipeline Layout",
    bindGroupLayouts: [ bindGroupLayout ],
})

const simulationPipeline = device.createComputePipeline({
    label: "Simulation pipeline",
    layout: pipelineLayout,
    compute: {
        module: simulationShaderModule,
        entryPoint: "computeMain",
    }
})

const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: pipelineLayout,
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

let step = 0;
const updateGrid = () => {
    const encoder = device.createCommandEncoder();

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(simulationPipeline);
    computePass.setBindGroup(0, bindGroups[step % 2]);

    const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
    computePass.dispatchWorkgroups(workgroupCount, workgroupCount);


    computePass.end();

    step++;

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
    queue.submit([ encoder.finish() ]);
}

const UPDATE_INTERVAL = 200;
setInterval(updateGrid, UPDATE_INTERVAL);