export const GRID_SIZE = 32;
export const WORKGROUP_SIZE = 8;

const squareVertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8, // Triangle 1
    0.8, -0.8,
    0.8,  0.8,

    -0.8, -0.8, // Triangle 2
    0.8,  0.8,
    -0.8,  0.8,
]);
export const createVertexBuffer = (device) => {
    const vertexBuffer = device.createBuffer({
        label: "Cell vertices",
        size: squareVertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    return { vertexBuffer, squareVertices };
}

const uniformArray = new Float32Array([ GRID_SIZE, GRID_SIZE ]);
export const createUniformBuffer = (device) => {
    const uniformBuffer = device.createBuffer({
        label: "Grid uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    return { uniformBuffer, uniformArray };
}

const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
export const createCellStateStorageBuffer = (device) => {
    const cellStateStorage = [
        device.createBuffer({
            label: "Cell state A",
            size: cellStateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }),
        device.createBuffer({
            label: "Cell state B",
            size: cellStateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
    ];
    return { cellStateStorage, cellStateArray };
}
export const stripeFillCellsArray = () => {
    for (let i = 0; i < cellStateArray.length; i += 3) {
        cellStateArray[i] = 1;
    }
}
export const diagonalFillCellsArray = () => {
    for (let i = 0; i < cellStateArray.length; i++) {
        cellStateArray[i] = i % 2;
    }
}